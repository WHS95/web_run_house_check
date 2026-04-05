import { NextRequest, NextResponse } from "next/server";
import { getUsersByCrewIdOptimized } from "@/lib/supabase/admin";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const guard = await assertAdmin("user.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const { searchParams } = new URL(request.url);
        const crewId = searchParams.get("crewId");

        if (!crewId) {
            return NextResponse.json(
                { success: false, message: "크루 ID가 필요합니다." },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { success: false, message: "권한이 없습니다." },
                { status: 403 }
            );
        }

        const result = await getUsersByCrewIdOptimized(crewId);
        if (result.error) {
            return NextResponse.json(
                {
                    success: false,
                    message: "사용자 데이터를 가져오는데 실패했습니다.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data || [],
            optimized: true,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "사용자 데이터를 가져오는데 실패했습니다.",
            },
            { status: 500 }
        );
    }
}
