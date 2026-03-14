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

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const crewId = searchParams.get("crewId");

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

        return NextResponse.json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        console.error("등급 추천 API 오류:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
