'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import {
    deleteAttendanceRecord,
    getDailyAttendanceDetails,
    getMonthlyAttendanceData,
    updateAttendanceRecord,
    type AttendanceDetailData,
    type AttendanceRecord,
    type AttendanceSummary,
} from '@/lib/supabase/admin';
import { getAdminStatsOptimized, type AdminStats } from '@/lib/admin-stats';
import { createClient } from '@/lib/supabase/server';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import { getPostHogServer, flushPostHog } from '@/lib/posthog/server';
import * as 정책 from '@/lib/domain/attendance/admin/policies';
import type {
    AdminAttendanceQueryType,
    AdminAttendanceUpdateInput,
    BulkAttendanceCreateResult,
    BulkAttendanceInput,
} from '@/lib/domain/attendance/admin/types';
import type { AdminActionResult } from '@/lib/domain/admin/types';

const REVALIDATE_PATH = '/admin2/attendance';

interface AdminAttendanceCalendarData {
    summary: AttendanceSummary[];
    detailData: AttendanceDetailData;
}

interface AdminDailyAttendanceData {
    records: AttendanceRecord[];
    date: string;
}

/**
 * /api/admin/attendance GET 대체 — type=stats(대시보드) 또는
 * type=calendar(달력 데이터) 분기.
 *
 * - stats: AdminStats를 그대로 반환 (대시보드 카드 통계).
 * - calendar(기본값): 월별 summary + 날짜별 detail.
 */
export async function getAdminAttendanceAction(input: {
    crewId: string;
    type?: string | null;
    year?: string | number | null;
    month?: string | number | null;
}): Promise<
    AdminActionResult<AdminStats | AdminAttendanceCalendarData> & {
        type?: AdminAttendanceQueryType;
    }
> {
    const guard = await assertAdminAction('attendance.edit');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crewId가 필요합니다.',
        };
    }

    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const queryType = 정책.쿼리타입_정규화(input.type);
    if (queryType === null) {
        return {
            success: false,
            error: 'invalid_data',
            message: "type 파라미터는 'stats' 또는 'calendar'여야 합니다.",
        };
    }

    if (queryType === 'stats') {
        try {
            const targetYear =
                input.year != null && input.year !== ''
                    ? Number(input.year)
                    : undefined;
            const targetMonth =
                input.month != null && input.month !== ''
                    ? Number(input.month)
                    : undefined;
            const stats = await getAdminStatsOptimized(
                input.crewId,
                targetYear,
                targetMonth
            );
            return { success: true, type: 'stats', data: stats };
        } catch (e) {
            console.error('[getAdminAttendanceAction] stats failed:', e);
            return {
                success: false,
                error: 'database_error',
                message: '통계 데이터를 가져오는데 실패했습니다.',
            };
        }
    }

    // calendar
    if (input.year == null || input.month == null) {
        return {
            success: false,
            error: 'invalid_data',
            message: '달력 데이터 요청 시 year, month가 필요합니다.',
        };
    }

    const year = Number(input.year);
    const month = Number(input.month);
    if (Number.isNaN(year) || Number.isNaN(month)) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'year, month는 숫자여야 합니다.',
        };
    }

    const { summary, detailData, error } = await getMonthlyAttendanceData(
        input.crewId,
        year,
        month
    );

    if (error) {
        console.error('[getAdminAttendanceAction] calendar failed:', error);
        return {
            success: false,
            error: 'database_error',
            message: '출석 데이터를 가져오는데 실패했습니다.',
        };
    }

    return {
        success: true,
        type: 'calendar',
        data: {
            summary: summary ?? [],
            detailData: detailData ?? {},
        },
    };
}

/**
 * /api/admin/attendance/bulk POST 대체 — 일괄 출석 등록.
 *
 * 1) bulk 입력 도메인 검증
 * 2) location_id → 장소명 조회 (text 컬럼 호환)
 * 3) crew_exercise_types로 운동 종류 검증
 * 4) attendance_records 일괄 insert + 23505 중복 처리
 */
export async function createBulkAttendanceAction(
    input: BulkAttendanceInput
): Promise<AdminActionResult<BulkAttendanceCreateResult>> {
    const guard = await assertAdminAction('attendance.create');
    if (!guard.ok) return guard.failure;

    if (!정책.bulk_입력_유효한가(input)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '필수 데이터가 누락되었습니다.',
        };
    }

    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const locationId = 정책.locationId_정규화(input.locationId);
    if (locationId === null) {
        return {
            success: false,
            error: 'invalid_location',
            message: '유효하지 않은 장소입니다.',
        };
    }

    const exerciseTypeId = 정책.exerciseTypeId_정규화(input.exerciseTypeId);
    if (exerciseTypeId === null) {
        return {
            success: false,
            error: 'invalid_exercise_type',
            message: '유효하지 않은 운동 종류입니다.',
        };
    }

    const supabase = await createClient();

    // 장소명 조회 (location은 text 컬럼)
    const { data: locationRow, error: locationError } = await supabase
        .schema('attendance')
        .from('crew_locations')
        .select('name')
        .eq('id', locationId)
        .single();

    if (locationError || !locationRow) {
        return {
            success: false,
            error: 'invalid_location',
            message: '유효하지 않은 장소입니다.',
        };
    }

    // 크루에 등록된 운동 종류인지 검증
    const { data: crewExerciseRow, error: crewExerciseError } = await supabase
        .schema('attendance')
        .from('crew_exercise_types')
        .select('exercise_type_id')
        .eq('crew_id', input.crewId)
        .eq('exercise_type_id', exerciseTypeId)
        .single();

    if (crewExerciseError || !crewExerciseRow) {
        return {
            success: false,
            error: 'invalid_exercise_type',
            message: '크루에 등록되지 않은 운동 종류입니다.',
        };
    }

    const records = input.users.map((u) => ({
        user_id: u.userId,
        crew_id: input.crewId,
        attendance_timestamp: input.attendanceTimestamp,
        location: locationRow.name,
        exercise_type_id: exerciseTypeId,
        is_host: u.isHost,
    }));

    const { data: insertResult, error: insertError } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .insert(records)
        .select('id, user_id');

    if (insertError) {
        if (insertError.code === '23505') {
            return {
                success: false,
                error: 'duplicate_attendance',
                message:
                    '이미 해당 날짜에 출석 기록이 있는 사용자가 포함되어 있습니다.',
            };
        }
        console.error(
            '[createBulkAttendanceAction] insert failed:',
            insertError
        );
        return {
            success: false,
            error: 'database_error',
            message: '출석 기록 생성 중 오류가 발생했습니다.',
        };
    }

    const createdRecords = (insertResult ?? []) as Array<{
        id: string;
        user_id: string;
    }>;
    const createdCount = createdRecords.length;

    revalidateTag(`admin:attendance:${guard.auth.crewId}`);
    revalidatePath(REVALIDATE_PATH);

    const posthog = getPostHogServer();
    if (posthog) {
        posthog.capture({
            distinctId: guard.auth.userId,
            event: 'server_admin_bulk_attendance',
            properties: {
                crew_id: input.crewId,
                member_count: createdCount,
                location: locationRow.name,
                exercise_type_id: exerciseTypeId,
                attendance_timestamp: input.attendanceTimestamp,
            },
        });
        await flushPostHog();
    }

    return {
        success: true,
        message: `${createdCount}명의 출석 기록이 성공적으로 생성되었습니다.`,
        data: { createdCount, createdRecords },
    };
}

/**
 * /api/admin/attendance/daily GET 대체 — 특정 날짜의 출석 상세.
 */
export async function getDailyAttendanceAction(input: {
    crewId: string;
    date: string;
}): Promise<AdminActionResult<AdminDailyAttendanceData>> {
    const guard = await assertAdminAction('attendance.edit');
    if (!guard.ok) return guard.failure;

    if (!input.crewId || !input.date) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crewId와 date가 모두 필요합니다.',
        };
    }

    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    if (!정책.날짜형식_유효한가(input.date)) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'date는 YYYY-MM-DD 형식이어야 합니다.',
        };
    }

    const { data: records, error } = await getDailyAttendanceDetails(
        input.crewId,
        input.date
    );

    if (error) {
        console.error('[getDailyAttendanceAction] query failed:', error);
        return {
            success: false,
            error: 'database_error',
            message: '출석 상세 데이터를 가져오는데 실패했습니다.',
        };
    }

    return {
        success: true,
        data: {
            records: records ?? [],
            date: input.date,
        },
    };
}

/**
 * /api/admin/attendance/delete DELETE 대체 — 출석 기록 soft delete.
 *
 * 도메인 검증으로 UUID 형식만 허용하고, 본 액션에서 tenant 격리(crew_id)
 * 직접 확인 후 supabase admin 헬퍼로 soft delete.
 */
export async function deleteAttendanceAction(input: {
    recordId: string;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('attendance.delete');
    if (!guard.ok) return guard.failure;

    if (!input.recordId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'recordId가 필요합니다.',
        };
    }

    if (!정책.recordId_유효한가(input.recordId)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '유효하지 않은 recordId 형식입니다.',
        };
    }

    const supabase = await createClient();
    const { data: rec } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .select('crew_id')
        .eq('id', input.recordId)
        .maybeSingle();

    if (!rec || rec.crew_id !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const { success, error } = await deleteAttendanceRecord(input.recordId);
    if (!success || error) {
        console.error('[deleteAttendanceAction] delete failed:', error);
        return {
            success: false,
            error: 'database_error',
            message:
                error?.message || '출석 기록 삭제에 실패했습니다.',
        };
    }

    revalidateTag(`admin:attendance:${guard.auth.crewId}`);
    revalidatePath(REVALIDATE_PATH);

    return {
        success: true,
        message: '출석 기록이 성공적으로 삭제되었습니다.',
    };
}

/**
 * /api/admin/attendance/update PUT 대체 — 출석 기록 수정.
 *
 * 도메인 정책으로 화이트리스트 필드만 통과시키고, tenant 격리 후
 * supabase admin 헬퍼로 update.
 */
export async function updateAttendanceAction(input: {
    recordId: string;
    updates: Record<string, unknown> | null | undefined;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('attendance.edit');
    if (!guard.ok) return guard.failure;

    if (!input.recordId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'recordId가 필요합니다.',
        };
    }

    if (!input.updates || typeof input.updates !== 'object') {
        return {
            success: false,
            error: 'invalid_data',
            message: '수정할 데이터가 필요합니다.',
        };
    }

    if (!정책.recordId_유효한가(input.recordId)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '유효하지 않은 recordId 형식입니다.',
        };
    }

    const validUpdates: AdminAttendanceUpdateInput = 정책.허용필드_필터(
        input.updates
    );

    if (Object.keys(validUpdates).length === 0) {
        return {
            success: false,
            error: 'invalid_data',
            message: '수정 가능한 필드가 없습니다.',
        };
    }

    const supabase = await createClient();
    const { data: rec } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .select('crew_id')
        .eq('id', input.recordId)
        .maybeSingle();

    if (!rec || rec.crew_id !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const { success, error } = await updateAttendanceRecord(
        input.recordId,
        validUpdates
    );

    if (!success || error) {
        console.error('[updateAttendanceAction] update failed:', error);
        return {
            success: false,
            error: 'database_error',
            message:
                error?.message || '출석 기록 수정에 실패했습니다.',
        };
    }

    revalidateTag(`admin:attendance:${guard.auth.crewId}`);
    revalidatePath(REVALIDATE_PATH);

    return {
        success: true,
        message: '출석 기록이 성공적으로 수정되었습니다.',
    };
}
