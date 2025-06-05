import { NextRequest, NextResponse } from "next/server";
import { getAdminStats } from "@/lib/admin-stats";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");

    if (!crewId) {
      return NextResponse.json(
        { error: "crewId가 필요합니다." },
        { status: 400 }
      );
    }

    const stats = await getAdminStats(crewId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin stats API 오류:", error);
    return NextResponse.json(
      { error: "통계 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
