import { NextRequest, NextResponse } from "next/server";
import { getMonthlyAttendanceData } from "@/lib/supabase/admin";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!crewId || !year || !month) {
      return NextResponse.json(
        { error: "crewId, year, month가 모두 필요합니다." },
        { status: 400 }
      );
    }

    const {
      summary,
      detailData,
      error: attendanceError,
    } = await getMonthlyAttendanceData(crewId, parseInt(year), parseInt(month));

    if (attendanceError) {
      console.error("출석 데이터 조회 오류:", attendanceError);
      return NextResponse.json(
        { error: "출석 데이터를 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: summary || [],
      detailData: detailData || {},
    });
  } catch (error) {
    console.error("Attendance API 오류:", error);
    return NextResponse.json(
      { error: "출석 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
