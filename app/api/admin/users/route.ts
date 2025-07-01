import { NextRequest, NextResponse } from "next/server";
import { getUsersByCrewIdOptimized } from "@/lib/supabase/admin";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");

    let users, error;

    if (crewId) {
      // 특정 크루의 사용자 목록 조회 (최적화됨)
      const result = await getUsersByCrewIdOptimized(crewId);
      users = result.data;
      error = result.error;
    }

    if (error) {
      console.error("사용자 데이터 조회 실패:", error);
      return NextResponse.json(
        { error: "사용자 데이터를 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      optimized: true, // 최적화된 버전임을 표시
    });
  } catch (error) {
    console.error("Users API 오류:", error);
    return NextResponse.json(
      { error: "사용자 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
