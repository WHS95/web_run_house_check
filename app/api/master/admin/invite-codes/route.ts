import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// 7자리 영어 대소문자 조합 코드 생성 함수
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 마스터 관리자 페이지 전용 초대 코드 생성
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

    // 마스터 관리자 권한 확인
    const { data: roleCheck, error: roleError } = await supabase
      .schema("attendance")
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleCheck || ![1].includes(roleCheck.role_id)) {
      return NextResponse.json(
        {
          success: false,
          error: "forbidden",
          message: "마스터 관리자 권한이 필요합니다.",
        },
        { status: 403 }
      );
    }

    // 요청 데이터 파싱
    const { crew_id, description } = await request.json();

    // 필수 데이터 검증
    if (!crew_id || typeof crew_id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_data",
          message: "크루 ID가 필요합니다.",
        },
        { status: 400 }
      );
    }

    // 크루 존재 확인
    const { data: crew, error: crewError } = await supabase
      .schema("attendance")
      .from("crews")
      .select("id, name")
      .eq("id", crew_id)
      .single();

    if (crewError || !crew) {
      return NextResponse.json(
        {
          success: false,
          error: "crew_not_found",
          message: "존재하지 않는 크루입니다.",
        },
        { status: 404 }
      );
    }

    // 고유한 초대 코드 생성 (최대 10회 시도)
    let inviteCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      inviteCode = generateInviteCode();

      // 코드 중복 확인
      const { data: existingCode, error: checkError } = await supabase
        .schema("attendance")
        .from("crew_invite_codes")
        .select("id")
        .eq("invite_code", inviteCode)
        .single();

      if (checkError && checkError.code === "PGRST116") {
        // 중복 없음 - 사용 가능한 코드
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        {
          success: false,
          error: "code_generation_failed",
          message: "고유한 초대 코드 생성에 실패했습니다. 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }

    // 초대 코드 생성
    const { data: newInviteCode, error: createError } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .insert({
        crew_id: crew_id,
        invite_code: inviteCode!,
        description: description?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error("초대 코드 생성 오류:", createError);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "초대 코드 생성에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `크루 "${crew.name}"의 초대 코드가 성공적으로 생성되었습니다.`,
      data: {
        ...newInviteCode,
        crew_name: crew.name,
      },
    });
  } catch (error) {
    console.error("마스터 관리자 초대 코드 생성 API 오류:", error);
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

// 마스터 관리자 페이지 전용 초대 코드 목록 조회
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

    // 마스터 관리자 권한 확인
    const { data: roleCheck, error: roleError } = await supabase
      .schema("attendance")
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleCheck || ![1].includes(roleCheck.role_id)) {
      return NextResponse.json(
        {
          success: false,
          error: "forbidden",
          message: "마스터 관리자 권한이 필요합니다.",
        },
        { status: 403 }
      );
    }

    // 크루 정보와 함께 초대 코드 목록 조회
    const { data: inviteCodes, error: codesError } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .select(
        `
                *,
                crews!inner(
                    name
                )
            `
      )
      .order("created_at", { ascending: false });

    if (codesError) {
      console.error("초대 코드 목록 조회 오류:", codesError);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "초대 코드 목록을 불러오는데 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 응답 데이터 가공 (크루 이름 추가)
    const processedCodes = (inviteCodes || []).map((code: any) => ({
      ...code,
      crew_name: code.crews?.name || null,
      crews: undefined, // 중첩 객체 제거
    }));

    return NextResponse.json({
      success: true,
      data: processedCodes,
    });
  } catch (error) {
    console.error("마스터 관리자 초대 코드 목록 API 오류:", error);
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
