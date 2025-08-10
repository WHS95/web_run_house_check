import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    // attendance 스키마에서 사용자 정보와 크루 상태 조회
    const { data: userData, error: userError } = await supabase
      .schema("attendance")
      .from("users")
      .select(
        `
        id,
        first_name,
        status,
        suspended_at,
        suspension_reason,
        user_crews!inner (
          status,
          suspended_at,
          suspension_reason
        )
      `
      )
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("사용자 상태 조회 오류:", userError);
      return NextResponse.json(
        {
          success: false,
          error: "user_not_found",
          message: "사용자 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 사용자 계정 상태 확인 (users 테이블의 status)
    const userStatus = userData.status?.toLowerCase();
    const userCrewStatus = userData.user_crews?.[0]?.status?.toLowerCase();

    // 상태 판단 로직
    let isActive = true;
    let statusMessage = "";
    let suspensionReason = "";

    // 1. 사용자 계정이 정지된 경우
    if (userStatus === "suspended") {
      isActive = false;
      statusMessage = "계정이 정지된 상태입니다.";
      suspensionReason =
        userData.suspension_reason || "운영진에게 문의바랍니다.";
    }
    // 2. 사용자 계정이 비활성화된 경우
    else if (userStatus === "inactive") {
      isActive = false;
      statusMessage = "계정이 비활성화된 상태입니다.";
      suspensionReason = "운영진에게 문의바랍니다.";
    }
    // 3. 크루 내에서 정지된 경우
    else if (userCrewStatus === "suspended") {
      isActive = false;
      statusMessage = "크루 내 활동이 정지된 상태입니다.";
      suspensionReason =
        userData.user_crews[0].suspension_reason || "운영진에게 문의바랍니다.";
    }
    // 4. 크루 내에서 비활성화된 경우
    else if (userCrewStatus === "inactive") {
      isActive = false;
      statusMessage = "크루 내 활동이 비활성화된 상태입니다.";
      suspensionReason = "운영진에게 문의바랍니다.";
    }
    // 5. 크루에서 탈퇴한 경우
    else if (userCrewStatus === "withdrawn") {
      isActive = false;
      statusMessage = "크루에서 탈퇴된 상태입니다.";
      suspensionReason = "운영진에게 문의바랍니다.";
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: userData.id,
        userName: userData.first_name,
        isActive,
        statusMessage,
        suspensionReason,
        userStatus: userStatus || "active",
        crewStatus: userCrewStatus || "active",
      },
    });
  } catch (error) {
    console.error("사용자 상태 확인 중 오류:", error);
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
