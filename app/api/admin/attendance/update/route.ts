import { NextRequest, NextResponse } from "next/server";
import { updateAttendanceRecord } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  const guard = await assertAdmin("attendance.edit");
  if (isGuardFailure(guard)) return guard;

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

    // 대상 레코드의 crew_id 확인 (tenant 격리)
    const supabase = await createClient();
    const { data: rec } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .select("crew_id")
      .eq("id", recordId)
      .maybeSingle();
    if (!rec || rec.crew_id !== guard.crewId) {
      return NextResponse.json(
        { success: false, message: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const { success, error } = await updateAttendanceRecord(
      recordId,
      validUpdates
    );
    if (success) {
      revalidateTag(`admin:attendance:${guard.crewId}`);
    }

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
