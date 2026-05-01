import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
    CrewActivityDay,
    CrewActivityRecent,
    CrewHostRanking,
} from "@/lib/domain/master/types";

export interface CrewActivityViewModel {
    daily: CrewActivityDay[];
    recent: CrewActivityRecent[];
    host_top: CrewHostRanking[];
}

interface RpcDaily {
    date?: string | null;
    count?: number | string | null;
}

interface RpcRecent {
    id?: string | null;
    user_id?: string | null;
    user_name?: string | null;
    attendance_timestamp?: string | null;
    location?: string | null;
    is_host?: boolean | null;
    exercise_type_name?: string | null;
}

interface RpcHostTop {
    user_id?: string | null;
    user_name?: string | null;
    host_count?: number | string | null;
}

interface RpcActivityPayload {
    daily?: RpcDaily[] | null;
    recent?: RpcRecent[] | null;
    host_top?: RpcHostTop[] | null;
}

const EMPTY_VM: CrewActivityViewModel = {
    daily: [],
    recent: [],
    host_top: [],
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
 * get_master_crew_activity RPC 호출.
 *
 * - 일자별 카운트 / 최근 50건 / 호스트 Top 5 반환.
 * - error/null 안전 처리: 빈 VM.
 * - BIGINT는 string으로 직렬화될 수 있어 number 캐스팅.
 */
export async function 크루활동VM_조립(
    crewId: string,
    days: number = 30
): Promise<CrewActivityViewModel> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("attendance")
        .rpc("get_master_crew_activity", {
            p_crew_id: crewId,
            p_days: days,
        });

    if (error || !data) {
        return EMPTY_VM;
    }

    const payload = data as RpcActivityPayload;

    const daily: CrewActivityDay[] = (payload.daily ?? [])
        .filter((d): d is RpcDaily & { date: string } =>
            Boolean(d && d.date)
        )
        .map((d) => ({
            date: d.date,
            count: toNumber(d.count),
        }));

    const recent: CrewActivityRecent[] = (payload.recent ?? [])
        .filter(
            (
                r
            ): r is RpcRecent & {
                id: string;
                user_id: string;
                attendance_timestamp: string;
            } =>
                Boolean(
                    r &&
                        r.id &&
                        r.user_id &&
                        r.attendance_timestamp
                )
        )
        .map((r) => ({
            id: r.id,
            user_id: r.user_id,
            user_name: r.user_name ?? null,
            attendance_timestamp: r.attendance_timestamp,
            location: r.location ?? null,
            is_host: r.is_host ?? null,
            exercise_type_name: r.exercise_type_name ?? null,
        }));

    const host_top: CrewHostRanking[] = (payload.host_top ?? [])
        .filter((h): h is RpcHostTop & { user_id: string } =>
            Boolean(h && h.user_id)
        )
        .map((h) => ({
            user_id: h.user_id,
            user_name: h.user_name ?? null,
            host_count: toNumber(h.host_count),
        }));

    return { daily, recent, host_top };
}
