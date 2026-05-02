import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CrewDetailViewModel {
    crew: {
        id: string;
        name: string;
        description: string | null;
        region: string | null;
        profile_image_url: string | null;
        max_members: number | null;
        location_based_attendance: boolean | null;
        accuracy_range: number | null;
        allow_unregistered_location: boolean | null;
        created_at: string;
        updated_at: string | null;
    };
    kpi: {
        member_count: number;
        attendance_30d: number;
        host_count_30d: number;
        last_attendance_at: string | null;
        active_member_count_30d: number;
    };
}

interface RpcCrew {
    id?: string | null;
    name?: string | null;
    description?: string | null;
    region?: string | null;
    profile_image_url?: string | null;
    max_members?: number | string | null;
    location_based_attendance?: boolean | null;
    accuracy_range?: number | string | null;
    allow_unregistered_location?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface RpcKpi {
    member_count?: number | string | null;
    attendance_30d?: number | string | null;
    host_count_30d?: number | string | null;
    last_attendance_at?: string | null;
    active_member_count_30d?: number | string | null;
}

interface RpcOverviewPayload {
    crew?: RpcCrew | null;
    kpi?: RpcKpi | null;
}

function toNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

function toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

/**
 * get_master_crew_overview RPC 호출.
 * - 크루 미존재(payload null) 시 null 반환 → 페이지에서 notFound() 처리.
 * - error 시도 null 반환 (페이지 깨지지 않도록 notFound 동작).
 */
export async function 크루상세VM_조립(
    crewId: string
): Promise<CrewDetailViewModel | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("attendance")
        .rpc("get_master_crew_overview", { p_crew_id: crewId });

    if (error || !data) {
        return null;
    }

    const payload = data as RpcOverviewPayload;
    const rpcCrew = payload.crew;
    const rpcKpi = payload.kpi;

    if (!rpcCrew || !rpcCrew.id || !rpcCrew.name || !rpcCrew.created_at) {
        return null;
    }

    return {
        crew: {
            id: rpcCrew.id,
            name: rpcCrew.name,
            description: rpcCrew.description ?? null,
            region: rpcCrew.region ?? null,
            profile_image_url: rpcCrew.profile_image_url ?? null,
            max_members: toNullableNumber(rpcCrew.max_members),
            location_based_attendance:
                rpcCrew.location_based_attendance ?? null,
            accuracy_range: toNullableNumber(rpcCrew.accuracy_range),
            allow_unregistered_location:
                rpcCrew.allow_unregistered_location ?? null,
            created_at: rpcCrew.created_at,
            updated_at: rpcCrew.updated_at ?? null,
        },
        kpi: {
            member_count: toNumber(rpcKpi?.member_count),
            attendance_30d: toNumber(rpcKpi?.attendance_30d),
            host_count_30d: toNumber(rpcKpi?.host_count_30d),
            last_attendance_at: rpcKpi?.last_attendance_at ?? null,
            active_member_count_30d: toNumber(
                rpcKpi?.active_member_count_30d
            ),
        },
    };
}
