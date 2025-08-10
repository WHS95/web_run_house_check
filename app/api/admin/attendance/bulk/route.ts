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
    const { crewId, userIds, attendanceTimestamp, locationId } =
      await request.json();

    // 필수 데이터 검증
    if (
      !crewId ||
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length === 0
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

    if (!attendanceTimestamp || !locationId) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_data",
          message: "출석 시간과 장소를 선택해주세요.",
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

    // // 기본 운동 종류 조회 (첫 번째 운동 종류를 기본값으로 사용)
    // const { data: exerciseType, error: exerciseError } = await supabase
    //   .schema("attendance")
    //   .from("exercise_types")
    //   .select("id")
    //   .limit(1)
    //   .single();

    // if (exerciseError || !exerciseType) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "no_exercise_type",
    //       message: "운동 종류를 찾을 수 없습니다.",
    //     },
    //     { status: 500 }
    //   );
    // }

    // 관리자 권한 확인 (user_roles 테이블 사용)
    const { data: roleCheck, error: roleError } = await supabase
      .schema("attendance")
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleCheck || roleCheck.role_id !== 2) {
      // role_id 2 = ADMIN
      return NextResponse.json(
        {
          success: false,
          error: "forbidden",
          message: "관리자 권한이 필요합니다.",
        },
        { status: 403 }
      );
    }

    // 사용자가 해당 크루에 속해 있는지 확인
    const { data: crewMemberCheck, error: crewError } = await supabase
      .schema("attendance")
      .from("user_crews")
      .select("crew_id")
      .eq("user_id", user.id)
      .eq("crew_id", crewId)
      .single();

    if (crewError || !crewMemberCheck) {
      return NextResponse.json(
        {
          success: false,
          error: "forbidden",
          message: "해당 크루에 접근 권한이 없습니다.",
        },
        { status: 403 }
      );
    }
    // console.log("attendanceTimestamp", attendanceTimestamp);

    // 일괄 출석 기록 생성
    const attendanceRecords = userIds.map((userId: string) => ({
      user_id: userId,
      crew_id: crewId,
      attendance_timestamp: attendanceTimestamp, // attendance_timestamp 사용
      location: locationData.name, // location은 text 타입으로 장소명 저장
      exercise_type_id: 1, //exerciseType.id, // 필수 필드 TODO 지금은 러닝만 고정으로 해서 나중에 고도화때 운동타입도 선택가능하게
      is_host: false, // 일괄 처리에서는 기본적으로 false
    }));

    const { data: insertResult, error: insertError } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .insert(attendanceRecords)
      .select("id, user_id");

    if (insertError) {
      // console.error("일괄 출석 기록 생성 오류:", insertError);

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
    // console.error("일괄 출석 처리 중 오류:", error);
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
