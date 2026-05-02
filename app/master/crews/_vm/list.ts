import "server-only";
import { createClient } from "@/lib/supabase/server";
import * as 마스터워크플로우 from "@/lib/domain/master/workflows";
import type {
    CrewListItem,
    CrewOverviewRow,
} from "@/lib/domain/master/types";

interface CrewRow {
    id: string;
    name: string;
    description: string | null;
    region: string | null;
    profile_image_url: string | null;
    created_at: string;
}

interface UserCrewRow {
    crew_id: string;
}

interface AttendanceRow {
    crew_id: string;
    attendance_timestamp: string;
}

const ATTENDANCE_LOOKBACK_DAYS = 30;

/**
 * `/master/crews` 목록 ViewModel 조립.
 *
 * 데이터 fetch 전략(N+1 회피):
 *  - Promise.all로 3개 쿼리를 병렬 실행한 뒤 메모리에서 그룹핑/조인.
 *    1) attendance.crews 전체 select
 *    2) attendance.user_crews(crew_id) → groupBy로 멤버 카운트
 *    3) attendance.attendance_records(최근 30일, deleted_at IS NULL)
 *       → 각 crew_id별 마지막 출석 시각 + 출석 카운트 산출
 *  - 마지막 출석은 30일 lookback 내 데이터만 반영. 30일 초과로 누락되더라도
 *    크루_활동상태_산출이 'dormant'로 분류하므로 의미가 동일.
 *  - 크루 수가 1~100 수준인 마스터 어드민 가정. RPC 신설 없이 page 단위 fetch.
 */
export async function 크루목록VM_조립(): Promise<CrewListItem[]> {
    const supabase = await createClient();
    const sinceIso = new Date(
        Date.now() - ATTENDANCE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const [crewsRes, userCrewsRes, attendanceRes] = await Promise.all([
        supabase
            .schema("attendance")
            .from("crews")
            .select(
                "id, name, description, region, profile_image_url, created_at"
            )
            .order("created_at", { ascending: false }),
        supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_id"),
        supabase
            .schema("attendance")
            .from("attendance_records")
            .select("crew_id, attendance_timestamp")
            .is("deleted_at", null)
            .gte("attendance_timestamp", sinceIso),
    ]);

    if (crewsRes.error || !crewsRes.data) {
        return [];
    }

    const crews = crewsRes.data as CrewRow[];

    // 멤버 수 그룹핑
    const memberCountMap = new Map<string, number>();
    if (!userCrewsRes.error && userCrewsRes.data) {
        for (const row of userCrewsRes.data as UserCrewRow[]) {
            if (!row.crew_id) continue;
            memberCountMap.set(
                row.crew_id,
                (memberCountMap.get(row.crew_id) ?? 0) + 1
            );
        }
    }

    // 30일 출석 카운트 + 최근 출석 그룹핑
    const attendanceCountMap = new Map<string, number>();
    const lastAttendanceMap = new Map<string, string>();
    if (!attendanceRes.error && attendanceRes.data) {
        for (const row of attendanceRes.data as AttendanceRow[]) {
            if (!row.crew_id || !row.attendance_timestamp) continue;
            attendanceCountMap.set(
                row.crew_id,
                (attendanceCountMap.get(row.crew_id) ?? 0) + 1
            );
            const prev = lastAttendanceMap.get(row.crew_id);
            if (!prev || row.attendance_timestamp > prev) {
                lastAttendanceMap.set(row.crew_id, row.attendance_timestamp);
            }
        }
    }

    const overview: CrewOverviewRow[] = crews.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? null,
        region: c.region ?? null,
        profile_image_url: c.profile_image_url ?? null,
        created_at: c.created_at,
        member_count: memberCountMap.get(c.id) ?? 0,
        last_attendance_at: lastAttendanceMap.get(c.id) ?? null,
        attendance_30d: attendanceCountMap.get(c.id) ?? 0,
    }));

    return 마스터워크플로우.크루목록_조립(overview);
}
