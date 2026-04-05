import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
    const guard = await assertAdmin("grade.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const body = await request.json();
        const { userId, crewId } = body;

        if (!userId || !crewId) {
            return NextResponse.json(
                { error: "필수 항목이 누락되었습니다." },
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

        // 자동 계산 모드로 복원
        const { error: updateError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .update({
                grade_override: false,
            })
            .eq("user_id", userId)
            .eq("crew_id", crewId);

        if (updateError) {
            return NextResponse.json(
                { error: "등급 복원에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "자동 계산 모드로 복원되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
