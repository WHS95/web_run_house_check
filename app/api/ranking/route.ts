import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

const createSupabaseServerClient = async () => {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set() {},
                remove() {},
            },
        }
    );
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const isPrefetch = searchParams.get("prefetch") === "true";

        const cacheHeaders = isPrefetch
            ? {
                  "Cache-Control":
                      "public, max-age=300, stale-while-revalidate=60",
              }
            : { "Cache-Control": "public, max-age=60" };

        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "인증이 필요합니다." },
                { status: 401, headers: cacheHeaders }
            );
        }

        // 년월 파싱
        const now = new Date();
        let year = parseInt(searchParams.get("year") || "", 10);
        let month = parseInt(searchParams.get("month") || "", 10);
        if (isNaN(year) || year < 1900 || year > 2200)
            year = now.getFullYear();
        if (isNaN(month) || month < 1 || month > 12)
            month = now.getMonth() + 1;

        const startDate = new Date(
            Date.UTC(year, month - 1, 1)
        ).toISOString();
        const endDate = new Date(
            Date.UTC(year, month, 1)
        ).toISOString();

        // 1. 유저의 크루 ID 조회
        const { data: userData } = await supabase
            .schema("attendance")
            .from("users")
            .select("verified_crew_id")
            .eq("id", user.id)
            .single();

        if (!userData?.verified_crew_id) {
            return NextResponse.json(
                {
                    selectedYear: year,
                    selectedMonth: month,
                    attendanceRanking: [],
                    hostingRanking: [],
                    crewName: null,
                },
                { headers: cacheHeaders }
            );
        }

        // 2. 크루명 + 랭킹 데이터를 병렬로 조회 (Promise.all)
        const [crewResult, rankingResult] = await Promise.all([
            supabase
                .schema("attendance")
                .from("crews")
                .select("name")
                .eq("id", userData.verified_crew_id)
                .single(),
            supabase
                .schema("attendance")
                .rpc("get_ranking_data", {
                    p_crew_id: userData.verified_crew_id,
                    p_start_date: startDate,
                    p_end_date: endDate,
                    p_current_user_id: user.id,
                }),
        ]);

        const crewName = crewResult.data?.name || null;
        const rankingData = rankingResult.data || {
            attendance_ranking: [],
            hosting_ranking: [],
        };

        return NextResponse.json(
            {
                selectedYear: year,
                selectedMonth: month,
                attendanceRanking:
                    rankingData.attendance_ranking,
                hostingRanking: rankingData.hosting_ranking,
                crewName,
            },
            { headers: cacheHeaders }
        );
    } catch (error) {
        console.error("랭킹 API 오류:", error);
        return NextResponse.json(
            { error: "랭킹 데이터를 불러오는데 실패했습니다." },
            { status: 500 }
        );
    }
}
