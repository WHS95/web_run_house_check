import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyCrewInviteCode } from "@/lib/supabase/crew-auth";

export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 초대 코드 추출
    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { success: false, message: "초대 코드가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 현재 인증된 사용자 가져오기
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "인증된 사용자를 찾을 수 없습니다." },
        { status: 401 }
      );
    }

    // 사용자가 이미 크루에 인증되어 있는지 확인
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("is_crew_verified, verified_crew_id")
      .eq("id", user.id)
      .single();

    if (userDataError) {
      return NextResponse.json(
        {
          success: false,
          message: "사용자 정보를 가져오는 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (userData.is_crew_verified) {
      return NextResponse.json(
        { success: false, message: "이미 크루에 인증된 사용자입니다." },
        { status: 409 }
      );
    }

    // 초대 코드 유효성 검증
    const {
      isValid,
      reason,
      data: codeData,
    } = await verifyCrewInviteCode(inviteCode);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: reason },
        { status: 400 }
      );
    }

    // 사용자 크루 인증 처리
    const { error: updateError } = await supabase
      .from("users")
      .update({
        verified_crew_id: codeData?.crewId,
        is_crew_verified: true,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message: "사용자 인증 업데이트 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    // 사용자-크루 매핑 테이블에 추가 (이미 있으면 무시)
    const { error: mappingError } = await supabase.rpc("upsert_user_crew", {
      p_user_id: user.id,
      p_crew_id: codeData?.crewId,
    });

    if (mappingError) {
      return NextResponse.json(
        { success: false, message: "사용자-크루 매핑 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 코드 사용 로그 기록
    const userIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const { error: logError } = await supabase
      .from("invite_code_usage_logs")
      .insert({
        invite_code_id: codeData?.id,
        user_id: user.id,
        user_ip: userIP,
        user_agent: userAgent,
      });

    if (logError) {
      console.error("코드 사용 로그 기록 중 오류:", logError);
      // 로그 기록 실패는 전체 프로세스를 실패시키지 않음
    }

    return NextResponse.json({
      success: true,
      message: "크루 인증이 완료되었습니다.",
      crew: {
        id: codeData?.crewId,
        name: codeData?.crewName,
      },
    });
  } catch (error) {
    console.error("크루 인증 처리 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 사용자의 크루 인증 상태 확인 API
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 인증된 사용자 가져오기
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "인증된 사용자를 찾을 수 없습니다." },
        { status: 401 }
      );
    }

    // 사용자의 크루 인증 상태 조회
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select(
        "is_crew_verified, verified_crew_id, crews:verified_crew_id(id, name)"
      )
      .eq("id", user.id)
      .single();

    if (userDataError) {
      return NextResponse.json(
        {
          success: false,
          message: "사용자 정보를 가져오는 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isVerified: userData.is_crew_verified,
      crew: userData.is_crew_verified ? userData.crews : null,
    });
  } catch (error) {
    console.error("크루 인증 상태 확인 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
