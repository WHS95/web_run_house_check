import { NextRequest, NextResponse } from "next/server";
import { toggleLocationBasedAttendance } from "@/lib/supabase/admin";

// PATCH: 크루의 위치 기반 출석 설정 토글
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { crew_id, location_based_attendance } = body;

    if (!crew_id) {
      return NextResponse.json(
        { success: false, error: "crew_id가 필요합니다." },
        { status: 400 }
      );
    }

    if (typeof location_based_attendance !== "boolean") {
      return NextResponse.json(
        { success: false, error: "location_based_attendance는 boolean 값이어야 합니다." },
        { status: 400 }
      );
    }

    const { success, error } = await toggleLocationBasedAttendance(
      crew_id, 
      location_based_attendance
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `위치 기반 출석이 ${location_based_attendance ? '활성화' : '비활성화'}되었습니다.` 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("위치 기반 출석 설정 변경 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}