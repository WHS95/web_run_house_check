import { NextRequest, NextResponse } from "next/server";
import { deleteAttendanceRecord } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const guard = await assertAdmin("attendance.delete");
  if (isGuardFailure(guard)) return guard;

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

    const { success, error } = await deleteAttendanceRecord(recordId);
    if (success) {
      revalidateTag(`admin:attendance:${guard.crewId}`);
    }

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
