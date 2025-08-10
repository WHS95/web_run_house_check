import { NextRequest, NextResponse } from "next/server";
import { getMonthlyAttendanceData } from "@/lib/supabase/admin";
import { getAdminStatsOptimized } from "@/lib/admin-stats";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

/**
 * 통합 Admin API - 대시보드 통계 & 출석 관리
 *
 * @param type=stats: 대시보드 통계 데이터 반환
 * @param type=calendar: 출석 달력 데이터 반환 (기본값)
 *
 * 사용 예시:
 * - 대시보드: /api/admin/attendance?crewId=xxx&type=stats
 * - 출석관리: /api/admin/attendance?crewId=xxx&type=calendar&year=2025&month=1
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");
    const type = searchParams.get("type"); // 'calendar' | 'stats'
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!crewId) {
      return NextResponse.json(
        { error: "crewId가 필요합니다." },
        { status: 400 }
      );
    }

    // 통계 데이터 요청 (대시보드용)
    if (type === "stats") {
      try {
        // 년도/월 파라미터 처리 (선택사항)
        const targetYear = year ? parseInt(year) : undefined;
        const targetMonth = month ? parseInt(month) : undefined;

        const stats = await getAdminStatsOptimized(
          crewId,
          targetYear,
          targetMonth
        );
        return NextResponse.json(stats);
      } catch (error) {
        //console.error("통계 데이터 조회 오류:", error);
        return NextResponse.json(
          { error: "통계 데이터를 가져오는데 실패했습니다." },
          { status: 500 }
        );
      }
    }

    // 달력 데이터 요청 (출석 관리용) - 기본값
    if (type === "calendar" || !type) {
      if (!year || !month) {
        return NextResponse.json(
          { error: "달력 데이터 요청 시 year, month가 필요합니다." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "type 파라미터는 'stats' 또는 'calendar'여야 합니다." },
        { status: 400 }
      );
    }

    const {
      summary,
      detailData,
      error: attendanceError,
    } = await getMonthlyAttendanceData(crewId, parseInt(year), parseInt(month));

    if (attendanceError) {
      //console.error("출석 데이터 조회 오류:", attendanceError);
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
    //console.error("Attendance API 오류:", error);
    return NextResponse.json(
      { error: "데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
