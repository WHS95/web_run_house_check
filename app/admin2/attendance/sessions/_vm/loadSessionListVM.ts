import { createClient } from '@/lib/supabase/server';

export interface SessionListFilter {
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    label?: string;
    minMembers?: number;
    page: number;
    pageSize: number;
}

export interface SessionListItem {
    id: string;
    startedAt: string;
    endedAt: string | null;
    autoLabel: string | null;
    centerLat: number;
    centerLng: number;
    radiusM: number;
    memberCount: number;
}

export interface SessionListVM {
    items: SessionListItem[];
    total: number;
    page: number;
    pageSize: number;
    filter: SessionListFilter;
}

/**
 * 세션 목록 ViewModel 로더.
 *
 * 페이지네이션 + 기간/라벨/최소인원 필터 지원.
 * 세션별 멤버 수는 session_members count로 계산.
 */
export async function loadSessionListVM(
    crewId: string,
    filter: SessionListFilter,
): Promise<SessionListVM> {
    const supabase = await createClient();
    const offset = (filter.page - 1) * filter.pageSize;

    // 세션 + 멤버 수 카운트 (LEFT JOIN COUNT 형태로 RPC 없이 처리)
    let q = supabase
        .schema('attendance')
        .from('sessions')
        .select(
            `
            id,
            started_at,
            ended_at,
            auto_label,
            center_lat,
            center_lng,
            radius_m,
            session_members(count)
            `,
            { count: 'exact' },
        )
        .eq('crew_id', crewId)
        .order('started_at', { ascending: false });

    if (filter.startDate) {
        q = q.gte('started_at', `${filter.startDate}T00:00:00Z`);
    }
    if (filter.endDate) {
        q = q.lte('started_at', `${filter.endDate}T23:59:59Z`);
    }
    if (filter.label) {
        q = q.ilike('auto_label', `%${filter.label}%`);
    }

    const { data, count, error } = await q.range(
        offset,
        offset + filter.pageSize - 1,
    );

    if (error) {
        return {
            items: [],
            total: 0,
            page: filter.page,
            pageSize: filter.pageSize,
            filter,
        };
    }

    const items: SessionListItem[] = (data ?? []).map((row) => {
        const membersField = row.session_members as
            | Array<{ count: number }>
            | null;
        const memberCount = membersField?.[0]?.count ?? 0;
        return {
            id: row.id as string,
            startedAt: row.started_at as string,
            endedAt: row.ended_at as string | null,
            autoLabel: row.auto_label as string | null,
            centerLat: row.center_lat as number,
            centerLng: row.center_lng as number,
            radiusM: row.radius_m as number,
            memberCount,
        };
    });

    // minMembers 필터는 in-memory로 (서버사이드 group by 비용 절감)
    const filtered =
        typeof filter.minMembers === 'number'
            ? items.filter((it) => it.memberCount >= filter.minMembers!)
            : items;

    return {
        items: filtered,
        total: count ?? 0,
        page: filter.page,
        pageSize: filter.pageSize,
        filter,
    };
}
