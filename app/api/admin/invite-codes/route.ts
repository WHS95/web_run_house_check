import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 초대코드 조회 (크루별 단일 코드)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");

    if (!crewId) {
      return NextResponse.json(
        { success: false, error: "크루 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 현재 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자 권한 확인 (크루 운영진인지 확인)
    const { data: roleCheck } = await supabase
      .schema("attendance")
      .from("user_roles")
      .select("role_id")
      .eq("user_id", user.id)
      .eq("role_id", 2) // ADMIN role
      .single();

    if (!roleCheck) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 해당 크루의 초대코드 조회
    const { data: inviteCode, error } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .select("*")
      .eq("crew_id", crewId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116: 데이터가 없음
      //console.error("초대코드 조회 오류:", error);
      return NextResponse.json(
        { success: false, error: "초대코드 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inviteCode || null,
    });
  } catch (error) {
    //console.error("초대코드 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 초대코드 생성 또는 수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crewId, description, inviteCode: customInviteCode } = body;

    if (!crewId) {
      return NextResponse.json(
        { success: false, error: "크루 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 현재 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자 권한 확인 (크루 운영진인지 확인)
    const { data: roleCheck } = await supabase
      .schema("attendance")
      .from("user_roles")
      .select("role_id")
      .eq("user_id", user.id)
      .eq("role_id", 2) // ADMIN role
      .single();

    if (!roleCheck) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 기존 초대코드 확인
    const { data: existingCode } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .select("id")
      .eq("crew_id", crewId)
      .single();

    // 7자리 랜덤 초대코드 생성
    const generateInviteCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 7; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // 커스텀 초대코드 검증
    const validateCustomCode = (code: string) => {
      // 정확히 7자리, 영문 대문자와 숫자만 허용
      const regex = /^[A-Z0-9]{7}$/;
      return regex.test(code);
    };

    let newInviteCode;

    if (customInviteCode && customInviteCode.trim()) {
      // 사용자가 직접 입력한 코드 사용
      const trimmedCode = customInviteCode.trim().toUpperCase();

      if (!validateCustomCode(trimmedCode)) {
        return NextResponse.json(
          {
            success: false,
            error: "초대코드는 영문 대문자와 숫자로만 구성된 7자리여야 합니다.",
          },
          { status: 400 }
        );
      }

      // 중복 검사 (현재 크루 제외)
      const { data: duplicate } = await supabase
        .schema("attendance")
        .from("crew_invite_codes")
        .select("id, crew_id")
        .eq("invite_code", trimmedCode)
        .single();

      if (duplicate && duplicate.crew_id !== crewId) {
        return NextResponse.json(
          {
            success: false,
            error: "이미 사용 중인 초대코드입니다. 다른 코드를 선택해주세요.",
          },
          { status: 400 }
        );
      }

      newInviteCode = trimmedCode;
    } else {
      // 랜덤 코드 생성
      let attempts = 0;
      const maxAttempts = 10;

      // 중복되지 않는 코드 생성
      do {
        newInviteCode = generateInviteCode();
        const { data: duplicate } = await supabase
          .schema("attendance")
          .from("crew_invite_codes")
          .select("id")
          .eq("invite_code", newInviteCode)
          .single();

        if (!duplicate) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { success: false, error: "고유한 초대코드 생성에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    const inviteCodeData = {
      crew_id: crewId,
      invite_code: newInviteCode,
      description: description || null,
      created_by: user.id,
    };

    if (existingCode) {
      // 기존 코드 업데이트
      const { data, error } = await supabase
        .schema("attendance")
        .from("crew_invite_codes")
        .update({
          ...inviteCodeData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCode.id)
        .select()
        .single();

      if (error) {
        //console.error("초대코드 수정 오류:", error);
        return NextResponse.json(
          { success: false, error: "초대코드 수정 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
        message: "초대코드가 수정되었습니다.",
      });
    } else {
      // 새 코드 생성
      const { data, error } = await supabase
        .schema("attendance")
        .from("crew_invite_codes")
        .insert([inviteCodeData])
        .select()
        .single();

      if (error) {
        //console.error("초대코드 생성 오류:", error);
        return NextResponse.json(
          { success: false, error: "초대코드 생성 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
        message: "초대코드가 생성되었습니다.",
      });
    }
  } catch (error) {
    //console.error("초대코드 생성/수정 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 초대코드 삭제 (재생성을 위한)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get("codeId");

    if (!codeId) {
      return NextResponse.json(
        { success: false, error: "코드 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 현재 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자 권한 확인 (크루 운영진인지 확인)
    const { data: roleCheck } = await supabase
      .schema("attendance")
      .from("user_roles")
      .select("role_id")
      .eq("user_id", user.id)
      .eq("role_id", 2) // ADMIN role
      .single();

    if (!roleCheck) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 초대코드 삭제
    const { error } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .delete()
      .eq("id", parseInt(codeId));

    if (error) {
      //console.error("초대코드 삭제 오류:", error);
      return NextResponse.json(
        { success: false, error: "초대코드 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "초대코드가 삭제되었습니다.",
    });
  } catch (error) {
    //console.error("초대코드 삭제 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
