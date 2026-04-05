import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const guard = await assertAdmin("grade.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const body = await request.json();
        const { userId, crewId, newGradeId } = body;

        if (!userId || !crewId || !newGradeId) {
            return NextResponse.json(
                { error: "사용자 ID, 크루 ID, 새 등급 ID가 모두 필요합니다." },
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

        // user_crews 등급 업데이트
        const { error: updateError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .update({
                crew_grade_id: newGradeId,
                grade_updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("crew_id", crewId);

        if (updateError) {
            console.error("등급 업데이트 오류:", updateError);
            return NextResponse.json(
                { error: "등급 업데이트 중 오류가 발생했습니다." },
                { status: 500 }
            );
        }

        // 등급 변경 로그 기록
        const { error: logError } = await supabase
            .schema("attendance")
            .from("grade_promotion_logs")
            .insert({
                user_id: userId,
                crew_id: crewId,
                to_grade_id: newGradeId,
                change_type: "approved",
                changed_by: guard.userId,
            });

        if (logError) {
            console.error("등급 변경 로그 기록 오류:", logError);
            return NextResponse.json(
                { error: "등급 변경 로그 기록 중 오류가 발생했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "등급이 승인되었습니다.",
        });
    } catch (error) {
        console.error("등급 승인 API 오류:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
