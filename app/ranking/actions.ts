"use server";

import { createClient } from "@/lib/supabase/server";
import type { RankingData } from "@/components/templates/UltraFastRankingTemplate";

interface FetchRankingResult {
    data: RankingData | null;
    error: string | null;
    redirect: string | null;
}

/**
 * 서버에서 랭킹 데이터를 가져오는 서버 액션
 * - page.tsx에서 초기 데이터 로딩에 사용
 * - 클라이언트에서 월 변경 시에도 재사용 가능
 */
export async function fetchRankingData(
    year: number,
    month: number
): Promise<FetchRankingResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: null, redirect: "/auth/login" };
        }

        const { data: result, error } = await supabase
            .schema("attendance")
            .rpc("get_ranking_data_unified", {
                p_user_id: user.id,
                target_year: year,
                target_month: month,
            });

        if (error) {
            return {
                data: null,
                error: error.message,
                redirect: null,
            };
        }

        if (!result?.success) {
            if (result?.error === "user_not_found") {
                return {
                    data: null,
                    error: null,
                    redirect: "/auth/login",
                };
            }
            if (result?.error === "crew_not_verified") {
                return {
                    data: null,
                    error: null,
                    redirect: "/auth/verify-crew",
                };
            }
            return {
                data: null,
                error:
                    result?.message || "알 수 없는 오류가 발생했습니다.",
                redirect: null,
            };
        }

        // 헤더 sub("크루명 · N명")용 활성 멤버 수 조회.
        // 실패해도 랭킹 자체에는 영향 없도록 안전 처리.
        let memberCount: number | null = null;
        try {
            const crewId = result.data?.crewId ?? null;
            // RPC가 crewId를 안 주는 경우 users 테이블에서 보강
            let resolvedCrewId: string | null = crewId;
            if (!resolvedCrewId) {
                const { data: userRow } = await supabase
                    .schema("attendance")
                    .from("users")
                    .select("verified_crew_id")
                    .eq("id", user.id)
                    .maybeSingle();
                resolvedCrewId = userRow?.verified_crew_id ?? null;
            }
            if (resolvedCrewId) {
                const { count } = await supabase
                    .schema("attendance")
                    .from("user_crews")
                    .select("user_id", {
                        count: "exact",
                        head: true,
                    })
                    .eq("crew_id", resolvedCrewId)
                    .eq("status", "ACTIVE");
                if (typeof count === "number") {
                    memberCount = count;
                }
            }
        } catch {
            // 무시 — 멤버 수는 보조 정보
        }

        return {
            data: { ...result.data, memberCount },
            error: null,
            redirect: null,
        };
    } catch (e: any) {
        return {
            data: null,
            error: e.message || "서버 오류가 발생했습니다.",
            redirect: null,
        };
    }
}
