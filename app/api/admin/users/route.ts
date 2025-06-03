import { NextRequest, NextResponse } from "next/server";
import { getUsersByCrewId } from "@/lib/supabase/admin";

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

    // 해당 크루의 사용자 목록 데이터 가져오기
    const { data: users, error } = await getUsersByCrewId(crewId);

    if (error) {
      console.error("사용자 데이터 조회 실패:", error);
      return NextResponse.json(
        { error: "사용자 데이터를 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
    });
  } catch (error) {
    console.error("Users API 오류:", error);
    return NextResponse.json(
      { error: "사용자 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
