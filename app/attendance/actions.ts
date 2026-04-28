'use server';

import { revalidatePath } from 'next/cache';
import { waitUntil } from '@vercel/functions';
import { createClient } from '@/lib/supabase/server';
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

    let locationName = '미등록 장소';
    if (locationId === 'unregistered') {
        const { data: crew } = await supabase
            .schema('attendance')
            .from('crews')
            .select('allow_unregistered_location')
            .eq('id', crewId)
            .single();
        if (!crew || !출석정책.미등록허용(crew)) {
            return {
                success: false,
                message:
                    '미등록 장소 출석이 허용되지 않은 크루입니다.',
            };
        }
    } else {
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
