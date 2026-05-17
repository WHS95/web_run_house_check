'use server';

import { revalidateTag } from 'next/cache';
import {
    getCrewById,
    getCrewLocations,
    getCrewExerciseTypes,
    toggleLocationBasedAttendance,
    updateAccuracyRange,
    updateAllowUnregisteredLocation,
} from '@/lib/supabase/admin';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import { 정확도범위_유효한가 } from '@/lib/domain/crew/policies';
import type { AdminActionResult } from '@/lib/domain/admin/types';
import type {
    CrewSettingsBundle,
    CrewSettingsRow,
    CrewExerciseTypeRow,
} from '@/lib/domain/crew/types';

/**
 * 자기 크루의 종합 설정 (크루 정보, 활동장소, 운동종류) 조회.
 * 기존 /api/admin/settings GET 대체.
 */
export async function getCrewSettingsBundleAction(input: {
    crewId: string;
}): Promise<AdminActionResult<CrewSettingsBundle>> {
    const guard = await assertAdminAction('crew.update');
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

    const { data: crewData, error: crewError } = await getCrewById(
        input.crewId
    );
    if (crewError || !crewData) {
        return {
            success: false,
            error: 'database_error',
            message: '크루 정보를 가져오는데 실패했습니다.',
        };
    }

    const { data: locations, error: locationsError } = await getCrewLocations(
        input.crewId
    );
    if (locationsError) {
        return {
            success: false,
            error: 'database_error',
            message: '모임 장소 정보를 가져오는데 실패했습니다.',
        };
    }

    const { data: exerciseTypes, error: exerciseTypesError } =
        await getCrewExerciseTypes(input.crewId);
    if (exerciseTypesError) {
        return {
            success: false,
            error: 'database_error',
            message: '운동 종류 정보를 가져오는데 실패했습니다.',
        };
    }

    return {
        success: true,
        data: {
            crewData: crewData as unknown as CrewSettingsRow,
            locations: locations || [],
            exerciseTypes: (exerciseTypes || []) as CrewExerciseTypeRow[],
        },
    };
}

/**
 * 위치 기반 출석 ON/OFF 토글.
 * 기존 PATCH /api/admin/crew-settings/location-attendance
 *  (location_based_attendance만 전달된 케이스) 대체.
 */
export async function toggleLocationBasedAttendanceAction(input: {
    crewId: string;
    enabled: boolean;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('crew.update');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crew_id가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }
    if (typeof input.enabled !== 'boolean') {
        return {
            success: false,
            error: 'invalid_data',
            message: 'enabled는 boolean 값이어야 합니다.',
        };
    }

    const { error } = await toggleLocationBasedAttendance(
        input.crewId,
        input.enabled
    );
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: error.message,
        };
    }

    revalidateTag(`admin:settings:${guard.auth.crewId}`);

    return {
        success: true,
        message: `위치 기반 출석이 ${input.enabled ? '활성화' : '비활성화'}되었습니다.`,
    };
}

/**
 * 위치 기반 출석 정확도(허용 범위, m) 업데이트.
 * 기존 PATCH /api/admin/crew-settings/location-attendance
 *  (accuracy_range만 전달된 케이스) 대체.
 */
export async function updateAccuracyRangeAction(input: {
    crewId: string;
    accuracyRange: number;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('crew.update');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crew_id가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }
    if (!정확도범위_유효한가(input.accuracyRange)) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'accuracy_range는 50~500 사이의 숫자여야 합니다.',
        };
    }

    const { error } = await updateAccuracyRange(
        input.crewId,
        input.accuracyRange
    );
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: error.message,
        };
    }

    revalidateTag(`admin:settings:${guard.auth.crewId}`);

    return {
        success: true,
        message: `허용 범위가 ${input.accuracyRange}m로 변경되었습니다.`,
    };
}

/**
 * 미등록 장소 출석 허용 토글.
 * 기존 PATCH /api/admin/crew-settings/location-attendance
 *  (allow_unregistered_location만 전달된 케이스) 대체.
 */
export async function updateAllowUnregisteredLocationAction(input: {
    crewId: string;
    allow: boolean;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('crew.update');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crew_id가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }
    if (typeof input.allow !== 'boolean') {
        return {
            success: false,
            error: 'invalid_data',
            message: 'allow_unregistered_location은 boolean 값이어야 합니다.',
        };
    }

    const { error } = await updateAllowUnregisteredLocation(
        input.crewId,
        input.allow
    );
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: error.message,
        };
    }

    revalidateTag(`admin:settings:${guard.auth.crewId}`);

    return {
        success: true,
        message: `미등록 장소 출석이 ${input.allow ? '허용' : '비허용'}으로 변경되었습니다.`,
    };
}

