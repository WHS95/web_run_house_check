import { NextRequest, NextResponse } from "next/server";
import { getDailyAttendanceDetails } from "@/lib/supabase/admin";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await assertAdmin("attendance.edit");
  if (isGuardFailure(guard)) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");
    const date = searchParams.get("date");

    if (!crewId || !date) {
      return NextResponse.json(
        { success: false, message: "crewId와 date가 모두 필요합니다." },
        { status: 400 }
      );
    }

    if (crewId !== guard.crewId) {
      return NextResponse.json(
        { success: false, message: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "date는 YYYY-MM-DD 형식이어야 합니다." },
        { status: 400 }
      );
    }

    const { data: records, error: attendanceError } =
      await getDailyAttendanceDetails(crewId, date);

    if (attendanceError) {
      //console.error("일별 출석 상세 조회 오류:", attendanceError);
      return NextResponse.json(
        { error: "출석 상세 데이터를 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      records: records || [],
      date,
    });
  } catch (error) {
    //console.error("Daily Attendance API 오류:", error);
    return NextResponse.json(
      { error: "출석 상세 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
