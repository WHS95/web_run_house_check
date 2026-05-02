'use server';

import { revalidatePath } from 'next/cache';
import { waitUntil } from '@vercel/functions';
import { createClient } from '@/lib/supabase/server';
import { 사용자_컨텍스트_조회 } from '@/lib/access/user-context';
import * as 접근정책 from '@/lib/domain/access/policies';
import * as 출석정책 from '@/lib/domain/attendance/policies';
import { 알림메시지_조립 } from '@/lib/domain/attendance/messages';
import { attendanceSubmissionSchema } from '@/lib/domain/attendance/validators';
import type { AttendanceSubmitResult } from '@/lib/domain/attendance/types';
import { sendNotification } from '@/lib/push/send-notification';
import { getPostHogServer, flushPostHog } from '@/lib/posthog/server';

/**
 * 출석 등록 Server Action.
 * 4계층 BFF 룰: auth/검증/DB write는 여기서, 비즈니스 룰은 lib/domain/attendance/.
 *
 * 응답 형태는 기존 /api/attendance route.ts와 호환되어
 * 클라이언트 호출자(ClientAttendancePage, useOfflineAttendance)는
 * fetch 응답 처리 패턴을 그대로 사용한다.
 */
export async function submitAttendance(
    input: unknown
): Promise<AttendanceSubmitResult> {
    const supabase = await createClient();

    const parsed = attendanceSubmissionSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            message: '제출된 데이터가 유효하지 않습니다.',
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    const {
        userId,
        crewId,
        locationId,
        exerciseTypeId,
        isHost,
        attendanceTimestamp,
    } = parsed.data;

    if (!출석정책.유효한가(new Date(), attendanceTimestamp)) {
        return {
            success: false,
            message: '허용된 시간 범위를 초과했습니다.',
        };
    }

    // 인증된 사용자 컨텍스트 조회 + 입력 userId 와 일치 여부 검증
    // (페이지 가드 우회 / 다른 사용자 ID 위조 방지)
    const ctx = await 사용자_컨텍스트_조회();
    if (!ctx) {
        return {
            success: false,
            message: '인증이 필요합니다.',
        };
    }
    if (ctx.userId !== userId) {
        return {
            success: false,
            message:
                '요청한 사용자와 인증 정보가 일치하지 않습니다.',
        };
    }

    // 활성 상태 가드 — 어드민이 비활성화한 유저는 출석 차단
    if (
        !접근정책.출석등록_가능한가({
            userStatus: ctx.userStatus,
            userCrewStatus: ctx.userCrewStatus,
        })
    ) {
        return {
            success: false,
            message:
                '비활성화된 계정입니다. 운영진에게 문의해주세요.',
        };
    }

    // crew_exercise_types 화이트리스트 검증 — 어드민이 운동 종류를 제거해도
    // 클라이언트 캐시로 인해 deleted exercise_type_id로 출석되는 것을 방지.
    const { data: cetRow } = await supabase
        .schema('attendance')
        .from('crew_exercise_types')
        .select('exercise_type_id')
        .eq('crew_id', crewId)
        .eq('exercise_type_id', exerciseTypeId)
        .maybeSingle();
    if (!cetRow) {
        return {
            success: false,
            message:
                '선택한 운동 종류가 현재 크루에서 사용 가능한 종류가 아닙니다.',
        };
    }

    // crews 설정을 한 번만 조회해 unregistered/일반 분기에서 재사용 (DB round-trip 절약)
    const { data: crew, error: crewErr } = await supabase
        .schema('attendance')
        .from('crews')
        .select('allow_unregistered_location, location_based_attendance')
        .eq('id', crewId)
        .single();
    if (crewErr || !crew) {
        return {
            success: false,
            message: '크루 정보 조회 실패',
        };
    }

    let locationName = '미등록 장소';
    if (locationId === 'unregistered') {
        // 위치기반 출석이 ON인 경우에만 미등록 허용 정책을 강제한다.
        // OFF인 크루는 클라이언트가 위치 모달을 거치지 않으므로 unregistered를 자유 허용.
        if (
            출석정책.위치기반_출석필요한가(crew) &&
            !출석정책.미등록허용(crew)
        ) {
            return {
                success: false,
                message:
                    '미등록 장소 출석이 허용되지 않은 크루입니다.',
            };
        }
    } else {
        // 위치기반 출석이 OFF인데 특정 location_id를 보낸 건 의심스럽지만 거부할 필요는 없음.
        // 기존 active location 확인은 그대로 유지.
        const { data: loc, error: locErr } = await supabase
            .schema('attendance')
            .from('crew_locations')
            .select('name')
            .eq('id', locationId)
            .eq('crew_id', crewId)
            .eq('is_active', true)
            .single();
        if (locErr || !loc) {
            return {
                success: false,
                message:
                    '선택한 장소를 찾을 수 없거나 현재 크루에서 사용할 수 없는 장소입니다.',
            };
        }
        locationName = loc.name;
    }

    const { data: record, error } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .insert([
            {
                user_id: userId,
                crew_id: crewId,
                exercise_type_id: exerciseTypeId,
                is_host: isHost,
                attendance_timestamp: attendanceTimestamp,
                location: locationName,
            },
        ])
        .select()
        .single();

    if (error) {
        return {
            success: false,
            message: '출석 기록 저장 중 오류가 발생했습니다.',
        };
    }

    waitUntil(
        (async () => {
            try {
                const { data: u } = await supabase
                    .schema('attendance')
                    .from('users')
                    .select('first_name, birth_year')
                    .eq('id', userId)
                    .single();
                const message = 알림메시지_조립({
                    userName: u?.first_name ?? null,
                    birthYear: u?.birth_year ?? null,
                    timestamp: attendanceTimestamp,
                    locationName,
                });
                await sendNotification(
                    crewId,
                    ['OWNER', 'CREW_MANAGER'],
                    null,
                    {
                        type: 'attendance',
                        title: '출석 알림',
                        body: message,
                        data: { crewId, locationName },
                    }
                );
            } catch (e) {
                console.error('[attendance push] send failed:', e);
            }
            const ph = getPostHogServer();
            if (ph) {
                ph.capture({
                    distinctId: userId,
                    event: 'server_attendance_recorded',
                    properties: {
                        crew_id: crewId,
                        location: locationName,
                        exercise_type_id: exerciseTypeId,
                        is_host: isHost,
                        attendance_timestamp: attendanceTimestamp,
                    },
                });
                await flushPostHog();
            }
        })()
    );

    revalidatePath('/attendance');
    return {
        success: true,
        message: '출석이 성공적으로 기록되었습니다.',
        data: record,
    };
}
