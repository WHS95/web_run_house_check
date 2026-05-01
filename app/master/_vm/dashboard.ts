import "server-only";
import { createClient } from "@/lib/supabase/server";
import * as 마스터워크플로우 from "@/lib/domain/master/workflows";
import type {
    DashboardKpi,
    RecentSignupCrew,
    CrewActivityStatus,
} from "@/lib/domain/master/types";

export interface IdleCrewItemVM {
    id: string;
    name: string;
    last_attendance_at: string | null;
    member_count: number;
    activity_status: CrewActivityStatus;
}

export interface DashboardViewModel {
    kpi: DashboardKpi;
    recent_signups: RecentSignupCrew[];
    idle_crews: IdleCrewItemVM[];
}

interface RpcRecentSignup {
    id?: string | null;
    name?: string | null;
    created_at?: string | null;
    member_count?: number | string | null;
}

interface RpcIdleCrew {
    id?: string | null;
    name?: string | null;
    last_attendance_at?: string | null;
    member_count?: number | string | null;
}

interface RpcDashboardKpi {
    total_crews?: number | string | null;
    total_users?: number | string | null;
    attendance_30d?: number | string | null;
    active_crews?: number | string | null;
    idle_crews?: number | string | null;
    dormant_crews?: number | string | null;
    recent_signups?: RpcRecentSignup[] | null;
    idle_crews_detail?: RpcIdleCrew[] | null;
}

const EMPTY_KPI: DashboardKpi = {
    total_crews: 0,
    total_users: 0,
    attendance_30d: 0,
    active_crews: 0,
    idle_crews: 0,
    dormant_crews: 0,
};

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

/**
 * 마스터 대시보드 ViewModel 조립.
 *
 * - attendance.get_master_dashboard_kpis RPC 호출.
 * - RPC가 null/error면 빈 KPI + 빈 리스트 반환 (페이지가 깨지지 않도록).
 * - idle_crews_detail은 크루_활동상태_산출로 status 부여.
 */
export async function 대시보드VM_조립(): Promise<DashboardViewModel> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("attendance")
        .rpc("get_master_dashboard_kpis");

    if (error || !data) {
        return {
            kpi: EMPTY_KPI,
            recent_signups: [],
            idle_crews: [],
        };
    }

    const payload = data as RpcDashboardKpi;

    const kpi: DashboardKpi = {
        total_crews: toNumber(payload.total_crews),
        total_users: toNumber(payload.total_users),
        attendance_30d: toNumber(payload.attendance_30d),
        active_crews: toNumber(payload.active_crews),
        idle_crews: toNumber(payload.idle_crews),
        dormant_crews: toNumber(payload.dormant_crews),
    };

    const recent_signups: RecentSignupCrew[] = (
        payload.recent_signups ?? []
    )
        .filter(
            (r): r is RpcRecentSignup & { id: string; name: string; created_at: string } =>
                Boolean(r && r.id && r.name && r.created_at)
        )
        .map((r) => ({
            id: r.id,
            name: r.name,
            created_at: r.created_at,
            member_count: toNumber(r.member_count),
        }));

    const now = new Date();
    const idle_crews: IdleCrewItemVM[] = (
        payload.idle_crews_detail ?? []
    )
        .filter(
            (r): r is RpcIdleCrew & { id: string; name: string } =>
                Boolean(r && r.id && r.name)
        )
        .map((r) => ({
            id: r.id,
            name: r.name,
            last_attendance_at: r.last_attendance_at ?? null,
            member_count: toNumber(r.member_count),
            activity_status: 마스터워크플로우.크루_활동상태_산출(
                r.last_attendance_at ?? null,
                now
            ),
        }));

    return {
        kpi,
        recent_signups,
        idle_crews,
    };
}
