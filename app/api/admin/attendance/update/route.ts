import { NextRequest, NextResponse } from "next/server";
import { updateAttendanceRecord } from "@/lib/supabase/admin";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, updates } = body;

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: "recordId가 필요합니다." },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { success: false, error: "수정할 데이터가 필요합니다." },
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

    // 업데이트 데이터 검증
    const allowedFields = ["checkInTime", "location", "isHost"];
    const validUpdates: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: "수정 가능한 필드가 없습니다." },
        { status: 400 }
      );
    }

    const { success, error } = await updateAttendanceRecord(
      recordId,
      validUpdates
    );

    if (!success || error) {
      //console.error("출석 기록 수정 실패:", error);
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "출석 기록 수정에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "출석 기록이 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    //console.error("Update Attendance API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "출석 기록 수정 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
