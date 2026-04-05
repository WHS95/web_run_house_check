import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

// 초대코드 조회 (크루별 단일 코드)
export async function GET(request: NextRequest) {
  const guard = await assertAdmin("inviteCode.manage");
  if (isGuardFailure(guard)) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");

    if (!crewId) {
      return NextResponse.json(
        { success: false, error: "크루 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (crewId !== guard.crewId) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // 해당 크루의 초대코드 조회
    const { data: inviteCode, error } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .select("*")
      .eq("crew_id", crewId)
      .single();

    if (error && error.code !== "PGRST116") {
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
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 초대코드 생성 또는 수정
export async function POST(request: NextRequest) {
  const guard = await assertAdmin("inviteCode.manage");
  if (isGuardFailure(guard)) return guard;

  try {
    const body = await request.json();
    const { crewId, description, inviteCode: customInviteCode } = body;

    if (!crewId) {
      return NextResponse.json(
        { success: false, error: "크루 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (crewId !== guard.crewId) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const supabase = await createClient();

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
      const regex = /^[A-Z0-9]{7}$/;
      return regex.test(code);
    };

    let newInviteCode;

    if (customInviteCode && customInviteCode.trim()) {
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
      let attempts = 0;
      const maxAttempts = 10;

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
      created_by: guard.userId,
    };

    if (existingCode) {
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
      const { data, error } = await supabase
        .schema("attendance")
        .from("crew_invite_codes")
        .insert([inviteCodeData])
        .select()
        .single();

      if (error) {
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
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 초대코드 삭제 (재생성을 위한)
export async function DELETE(request: NextRequest) {
  const guard = await assertAdmin("inviteCode.manage");
  if (isGuardFailure(guard)) return guard;

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

    // 초대코드 정보를 먼저 조회하여 crewId 확인
    const { data: codeInfo } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .select("crew_id")
      .eq("id", parseInt(codeId))
      .single();

    if (!codeInfo) {
      return NextResponse.json(
        { success: false, error: "초대코드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (codeInfo.crew_id !== guard.crewId) {
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
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
