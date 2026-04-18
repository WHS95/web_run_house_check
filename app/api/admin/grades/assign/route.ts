import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";
import { getPostHogServer, flushPostHog } from "@/lib/posthog/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
    const guard = await assertAdmin("grade.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const body = await request.json();
        const { userId, crewId, gradeId } = body;

        if (!userId || !crewId || !gradeId) {
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

        // 등급 수동 지정 업데이트
        const { error: updateError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .update({
                crew_grade_id: gradeId,
                grade_override: true,
                grade_updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("crew_id", crewId);

        if (updateError) {
            return NextResponse.json(
                { error: "등급 업데이트에 실패했습니다." },
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
                to_grade_id: gradeId,
                change_type: "manual",
                changed_by: guard.userId,
            });

        if (logError) {
            return NextResponse.json(
                { error: "등급 변경 로그 기록에 실패했습니다." },
                { status: 500 }
            );
        }

        const posthog = getPostHogServer();
        if (posthog) {
            posthog.capture({
                distinctId: guard.userId,
                event: "server_grade_assigned",
                properties: {
                    crew_id: crewId,
                    target_user_id: userId,
                    grade_id: gradeId,
                },
            });
            await flushPostHog();
        }

        return NextResponse.json({
            success: true,
            message: "등급이 수동 지정되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
