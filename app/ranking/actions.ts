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

        // 개발 환경 바이패스
        let userId: string;
        if (
            process.env.NODE_ENV !== "production" &&
            process.env.DEV_BYPASS_AUTH === "true" &&
            process.env.DEV_BYPASS_USER_ID
        ) {
            userId = process.env.DEV_BYPASS_USER_ID;
        } else {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                return { data: null, error: null, redirect: "/auth/login" };
            }
            userId = user.id;
        }

        const { data: result, error } = await supabase
            .schema("attendance")
            .rpc("get_ranking_data_unified", {
                p_user_id: userId,
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

        return { data: result.data, error: null, redirect: null };
    } catch (e: any) {
        return {
            data: null,
            error: e.message || "서버 오류가 발생했습니다.",
            redirect: null,
        };
    }
}
