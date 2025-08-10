import { NextRequest, NextResponse } from "next/server";
import { deleteAttendanceRecord } from "@/lib/supabase/admin";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: "recordId가 필요합니다." },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recordId)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 recordId 형식입니다." },
        { status: 400 }
      );
    }

    const { success, error } = await deleteAttendanceRecord(recordId);

    if (!success || error) {
      //console.error("출석 기록 삭제 실패:", error);
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "출석 기록 삭제에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "출석 기록이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    //console.error("Delete Attendance API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "출석 기록 삭제 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
