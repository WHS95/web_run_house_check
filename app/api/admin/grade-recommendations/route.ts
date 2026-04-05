import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const guard = await assertAdmin("grade.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const { searchParams } = new URL(request.url);
        const crewId = searchParams.get("crewId");

        if (!crewId) {
            return NextResponse.json(
                { error: "크루 ID가 필요합니다." },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { error: "권한이 없습니다." },
                { status: 403 }
            );
        }

        const supabase = await createClient();

        const { data: recommendations, error: rpcError } = await supabase
            .schema("attendance")
            .rpc("calculate_grade_recommendations", {
                p_crew_id: crewId,
            });

        if (rpcError) {
            console.error("등급 추천 조회 오류:", rpcError);
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
