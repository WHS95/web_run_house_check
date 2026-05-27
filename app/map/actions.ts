'use server';

import { createClient } from '@/lib/supabase/server';
import type {
    CrewLocationRow,
    CrewLocationsActionResult,
} from '@/lib/domain/location/types';
import {
    활성모임_배너VM_생성,
    type ActiveMeetBannerVM,
} from '@/lib/domain/attendance/policies';

export type ActiveMeetActionResult =
    | { success: true; data: ActiveMeetBannerVM | null }
    | { success: false; error: string };

/**
 * 인증된 사용자의 크루 활성 장소 조회.
 * 기존 /api/crew-locations GET 대체.
 *
 * crewId가 명시되지 않으면 users.verified_crew_id를 사용한다.
 */
export async function getCrewLocationsAction(
    crewId?: string | null
): Promise<CrewLocationsActionResult> {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: '인증이 필요합니다.' };
    }

    let resolvedCrewId = crewId ?? null;
    if (!resolvedCrewId) {
        const { data: userData, error: userErr } = await supabase
            .schema('attendance')
            .from('users')
            .select('verified_crew_id')
            .eq('id', user.id)
            .single();
        if (userErr || !userData) {
            return {
                success: false,
                error: userErr?.message || '사용자 정보를 찾을 수 없습니다.',
            };
        }
        resolvedCrewId = userData.verified_crew_id;
    }

    const { data, error } = await supabase
        .schema('attendance')
        .from('crew_locations')
        .select('id, name, description, latitude, longitude, is_active')
        .eq('crew_id', resolvedCrewId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data: (data ?? []) as CrewLocationRow[] };
}

/**
 * 인증된 사용자의 크루 활성 모임(최근 30분 이내) 조회.
 * 지도 하단 collapsed 카드 메타(거리·시간) 표시용.
 */
export async function getActiveMeetAction(): Promise<ActiveMeetActionResult> {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: '인증이 필요합니다.' };
    }

    const { data: userData, error: userErr } = await supabase
        .schema('attendance')
        .from('users')
        .select('verified_crew_id')
        .eq('id', user.id)
        .single();
    if (userErr || !userData?.verified_crew_id) {
        return { success: true, data: null };
    }

    const { data, error } = await supabase
        .schema('attendance')
        .rpc('get_recent_active_meet', {
            p_user_id: user.id,
            p_crew_id: userData.verified_crew_id,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    if (!data?.success) {
        return { success: true, data: null };
    }

    return {
        success: true,
        data: 활성모임_배너VM_생성(data.data),
    };
}
