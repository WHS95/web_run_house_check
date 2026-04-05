import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "unauthorized",
          message: "인증되지 않은 사용자입니다.",
        },
        { status: 401 }
      );
    }

    // 요청 데이터 파싱
    // users: Array<{ userId: string; isHost: boolean }>
    const { crewId, users, attendanceTimestamp, locationId, exerciseTypeId } =
      await request.json();

    // 필수 데이터 검증
    if (
      !crewId ||
      !users ||
      !Array.isArray(users) ||
      users.length === 0 ||
      users.some(
        (u: unknown) =>
          !u ||
          typeof (u as { userId?: unknown }).userId !== "string" ||
          typeof (u as { isHost?: unknown }).isHost !== "boolean"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_data",
          message: "필수 데이터가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    if (!attendanceTimestamp || !locationId || !exerciseTypeId) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_data",
          message: "출석 시간·장소·운동 종류를 모두 선택해주세요.",
        },
        { status: 400 }
      );
    }

    // 장소명 조회 (location_id를 location name으로 변환)
    const { data: locationData, error: locationError } = await supabase
      .schema("attendance")
      .from("crew_locations")
      .select("name")
      .eq("id", parseInt(locationId))
      .single();

    if (locationError || !locationData) {
      // console.log("locationError", locationError);
      // console.log("locationData", locationData);
      return NextResponse.json(
        {
          success: false,
          error: "invalid_location",
          message: "유효하지 않은 장소입니다.",
        },
        { status: 400 }
      );
    }

    // 운동 종류 유효성 검증 (크루에 등록된 운동 종류인지 확인)
    const parsedExerciseTypeId = parseInt(String(exerciseTypeId), 10);
    if (isNaN(parsedExerciseTypeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_exercise_type",
          message: "유효하지 않은 운동 종류입니다.",
        },
        { status: 400 }
      );
    }

    const { data: crewExerciseType, error: crewExerciseTypeError } =
      await supabase
        .schema("attendance")
        .from("crew_exercise_types")
        .select("exercise_type_id")
        .eq("crew_id", crewId)
        .eq("exercise_type_id", parsedExerciseTypeId)
        .single();

    if (crewExerciseTypeError || !crewExerciseType) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_exercise_type",
          message: "크루에 등록되지 않은 운동 종류입니다.",
        },
        { status: 400 }
      );
    }

    // 관리자 권한 확인 (user_crews 테이블 사용)
    const { data: roleCheck, error: roleError } = await supabase
      .schema("attendance")
      .from("user_crews")
      .select("crew_role")
      .eq("user_id", user.id)
      .eq("crew_id", crewId)
      .eq("crew_role", "CREW_MANAGER")
      .single();

    if (roleError || !roleCheck) {
      return NextResponse.json(
        {
          success: false,
          error: "forbidden",
          message: "크루 운영진 권한이 필요합니다.",
        },
        { status: 403 }
      );
    }
    // console.log("attendanceTimestamp", attendanceTimestamp);

    // 일괄 출석 기록 생성
    const attendanceRecords = (
      users as Array<{ userId: string; isHost: boolean }>
    ).map((u) => ({
      user_id: u.userId,
      crew_id: crewId,
      attendance_timestamp: attendanceTimestamp, // attendance_timestamp 사용
      location: locationData.name, // location은 text 타입으로 장소명 저장
      exercise_type_id: parsedExerciseTypeId,
      is_host: u.isHost,
    }));

    const { data: insertResult, error: insertError } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .insert(attendanceRecords)
      .select("id, user_id");

    if (insertError) {
      // //console.error("일괄 출석 기록 생성 오류:", insertError);

      // 중복 출석 체크 (같은 날짜에 이미 출석한 경우)
      if (insertError.code === "23505") {
        // unique_violation
        return NextResponse.json(
          {
            success: false,
            error: "duplicate_attendance",
            message:
              "이미 해당 날짜에 출석 기록이 있는 사용자가 포함되어 있습니다.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "출석 기록 생성 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    // 성공적으로 생성된 기록 수 확인
    const createdCount = insertResult?.length || 0;

    return NextResponse.json({
      success: true,
      message: `${createdCount}명의 출석 기록이 성공적으로 생성되었습니다.`,
      data: {
        createdCount,
        createdRecords: insertResult,
      },
    });
  } catch (error) {
    // //console.error("일괄 출석 처리 중 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "internal_error",
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
