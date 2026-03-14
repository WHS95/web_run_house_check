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
                set(name: string, value: string, options: any) {},
                remove(name: string, options: any) {},
            },
        }
    );
};

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { crewId } = body;

        if (!crewId) {
            return NextResponse.json(
                { error: "크루 ID가 필요합니다." },
                { status: 400 }
            );
        }

        // 크루 매니저 권한 확인
        const { data: userCrew, error: crewError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("role")
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .single();

        if (crewError || !userCrew || userCrew.role !== "manager") {
            return NextResponse.json(
                { error: "크루 매니저 권한이 필요합니다." },
                { status: 403 }
            );
        }

        // 모든 등급 추천 조회
        const { data: recommendations, error: rpcError } = await supabase
            .schema("attendance")
            .rpc("calculate_grade_recommendations", {
                p_crew_id: crewId,
            });

        if (rpcError) {
            console.error(
                "등급 추천 조회 오류:",
                rpcError
            );
            return NextResponse.json(
                { error: "등급 추천 데이터를 가져오는 중 오류가 발생했습니다." },
                { status: 500 }
            );
        }

        if (!recommendations || recommendations.length === 0) {
            return NextResponse.json({
                success: true,
                message: "승인할 등급 변경 추천이 없습니다.",
                count: 0,
            });
        }

        let approvedCount = 0;

        for (const rec of recommendations) {
            // user_crews 등급 업데이트
            const { error: updateError } = await supabase
                .schema("attendance")
                .from("user_crews")
                .update({
                    crew_grade_id: rec.recommended_grade_id,
                    grade_updated_at: new Date().toISOString(),
                })
                .eq("user_id", rec.user_id)
                .eq("crew_id", crewId);

            if (updateError) {
                console.error(
                    `사용자 ${rec.user_id} 등급 업데이트 오류:`,
                    updateError
                );
                continue;
            }

            // 등급 변경 로그 기록
            const { error: logError } = await supabase
                .schema("attendance")
                .from("grade_promotion_logs")
                .insert({
                    user_id: rec.user_id,
                    crew_id: crewId,
                    to_grade_id: rec.recommended_grade_id,
                    change_type: "approved",
                    changed_by: user.id,
                });

            if (logError) {
                console.error(
                    `사용자 ${rec.user_id} 등급 변경 로그 기록 오류:`,
                    logError
                );
                continue;
            }

            approvedCount++;
        }

        return NextResponse.json({
            success: true,
            message: "모든 등급 변경이 승인되었습니다.",
            count: approvedCount,
        });
    } catch (error) {
        console.error("전체 등급 승인 API 오류:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
