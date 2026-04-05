import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const guard = await assertAdmin("pushHistory.view");
    if (isGuardFailure(guard)) return guard;

    try {
        const { searchParams } = new URL(request.url);
        const crewId = searchParams.get("crewId");

        if (!crewId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "crewId 파라미터가 필요합니다.",
                },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "권한이 없습니다.",
                },
                { status: 403 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .schema("attendance")
            .from("push_history")
            .select(
                "id, title, target_mode, target_count, success_count, failure_count, created_at"
            )
            .eq("crew_id", crewId)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: "푸시 발송 내역을 가져오는데 실패했습니다.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data || [],
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: "푸시 발송 내역을 가져오는데 실패했습니다.",
            },
            { status: 500 }
        );
    }
}
