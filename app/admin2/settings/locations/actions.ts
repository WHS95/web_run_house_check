'use server';

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
    getCrewLocations,
    createCrewLocation,
    updateCrewLocation,
    deleteCrewLocation,
} from '@/lib/supabase/admin';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import * as 위치정책 from '@/lib/domain/location/policies';
import type { AdminActionResult } from '@/lib/domain/admin/types';
import type {
    CrewLocation,
    CrewLocationUpdateData,
} from '@/lib/types/crew-locations';

async function 소유권_확인(
    locationId: number,
    crewId: string
): Promise<boolean> {
    const supabase = await createClient();
    const { data } = await supabase
        .schema('attendance')
        .from('crew_locations')
        .select('crew_id')
        .eq('id', locationId)
        .maybeSingle();
    return !!data && data.crew_id === crewId;
}

/**
 * 크루의 모든 활동장소 조회. /api/admin/crew-locations GET 대체.
 */
export async function getAdminCrewLocationsAction(input: {
    crewId: string;
}): Promise<AdminActionResult<CrewLocation[]>> {
    const guard = await assertAdminAction('location.manage');
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

    const { data, error } = await getCrewLocations(input.crewId);
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: error.message,
        };
    }

    return { success: true, data: (data || []) as CrewLocation[] };
}

/**
 * 활동장소 생성. /api/admin/crew-locations POST 대체.
 */
export async function createAdminCrewLocationAction(input: {
    crewId: string;
    name: string;
    description?: string | null;
    latitude: number;
    longitude: number;
}): Promise<AdminActionResult<CrewLocation>> {
    const guard = await assertAdminAction('location.manage');
    if (!guard.ok) return guard.failure;

    if (
        !input.crewId ||
        !input.name ||
        input.latitude === undefined ||
        input.longitude === undefined
    ) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crew_id, name, latitude, longitude는 필수입니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }
    if (!위치정책.좌표_유효한가(input.latitude, input.longitude)) {
        return {
            success: false,
            error: 'invalid_coordinates',
            message: '유효하지 않은 좌표입니다.',
        };
    }

    const { data, error } = await createCrewLocation(input.crewId, {
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        latitude: input.latitude,
        longitude: input.longitude,
    });
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: error.message,
        };
    }

    revalidateTag(`admin:settings:${guard.auth.crewId}`);

    return { success: true, data: data as CrewLocation };
}

/**
 * 활동장소 수정 (PUT). /api/admin/crew-locations/[id] PUT 대체.
 */
export async function updateAdminCrewLocationAction(input: {
    locationId: number;
    name?: string;
    description?: string | null;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
}): Promise<AdminActionResult<CrewLocation>> {
    const guard = await assertAdminAction('location.manage');
    if (!guard.ok) return guard.failure;

    if (!Number.isFinite(input.locationId)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '유효하지 않은 ID입니다.',
        };
    }

    const ok = await 소유권_확인(input.locationId, guard.auth.crewId);
    if (!ok) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const noField =
        input.name === undefined &&
        input.description === undefined &&
        input.latitude === undefined &&
        input.longitude === undefined &&
        input.isActive === undefined;
    if (noField) {
        return {
            success: false,
            error: 'invalid_data',
            message: '수정할 데이터가 필요합니다.',
        };
    }

    if (input.latitude !== undefined && !위치정책.위도_유효한가(input.latitude)) {
        return {
            success: false,
            error: 'invalid_coordinates',
            message: '유효하지 않은 좌표입니다.',
        };
    }
    if (input.longitude !== undefined && !위치정책.경도_유효한가(input.longitude)) {
        return {
            success: false,
            error: 'invalid_coordinates',
            message: '유효하지 않은 좌표입니다.',
        };
    }

    const updateData: CrewLocationUpdateData = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) {
        updateData.description = input.description?.trim() || undefined;
    }
    if (input.latitude !== undefined) updateData.latitude = input.latitude;
    if (input.longitude !== undefined) updateData.longitude = input.longitude;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await updateCrewLocation(
        input.locationId,
        updateData
    );
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: error.message,
        };
    }

    revalidateTag(`admin:settings:${guard.auth.crewId}`);

    return { success: true, data: data as CrewLocation };
}

/**
 * 활동장소 활성화 토글 (PATCH). /api/admin/crew-locations/[id] PATCH 대체.
 */
export async function toggleAdminCrewLocationActiveAction(input: {
    locationId: number;
    isActive: boolean;
}): Promise<AdminActionResult<CrewLocation>> {
    const guard = await assertAdminAction('location.manage');
    if (!guard.ok) return guard.failure;

    if (!Number.isFinite(input.locationId)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '유효하지 않은 ID입니다.',
        };
    }
    if (typeof input.isActive !== 'boolean') {
        return {
            success: false,
            error: 'invalid_data',
            message: 'is_active는 boolean 값이어야 합니다.',
        };
    }

    const ok = await 소유권_확인(input.locationId, guard.auth.crewId);
    if (!ok) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const { data, error } = await updateCrewLocation(input.locationId, {
        is_active: input.isActive,
    });
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: error.message,
        };
    }

    revalidateTag(`admin:settings:${guard.auth.crewId}`);

    return { success: true, data: data as CrewLocation };
}

/**
 * 활동장소 삭제. /api/admin/crew-locations/[id] DELETE 대체.
 */
export async function deleteAdminCrewLocationAction(input: {
    locationId: number;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('location.manage');
    if (!guard.ok) return guard.failure;

    if (!Number.isFinite(input.locationId)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '유효하지 않은 ID입니다.',
        };
    }

    const ok = await 소유권_확인(input.locationId, guard.auth.crewId);
    if (!ok) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const { error } = await deleteCrewLocation(input.locationId);
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
        message: '활동장소가 성공적으로 삭제되었습니다.',
    };
}
