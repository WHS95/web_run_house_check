import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// 초대 코드 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 마스터 관리자 권한 확인 (role_id = 1: SUPER_ADMIN만 허용)
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
    const { invite_code, description, is_active } = await request.json();
    const codeId = parseInt(params.id);

    if (isNaN(codeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_id",
          message: "유효하지 않은 초대 코드 ID입니다.",
        },
        { status: 400 }
      );
    }

    // 초대 코드 존재 확인
    const { data: existingCode, error: checkError } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .select("*")
      .eq("id", codeId)
      .single();

    if (checkError || !existingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "code_not_found",
          message: "존재하지 않는 초대 코드입니다.",
        },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    
    if (invite_code !== undefined) {
      const trimmedCode = invite_code?.trim();
      if (!trimmedCode) {
        return NextResponse.json(
          {
            success: false,
            error: "invalid_code",
            message: "초대 코드는 비어있을 수 없습니다.",
          },
          { status: 400 }
        );
      }
      
      // 초대 코드가 변경되는 경우 중복 확인
      if (trimmedCode !== existingCode.invite_code) {
        const { data: duplicateCheck, error: duplicateError } = await supabase
          .schema("attendance")
          .from("crew_invite_codes")
          .select("id")
          .eq("invite_code", trimmedCode)
          .neq("id", codeId)
          .maybeSingle();

        if (duplicateError) {
          console.error("중복 확인 오류:", duplicateError);
          return NextResponse.json(
            {
              success: false,
              error: "database_error",
              message: "초대 코드 중복 확인에 실패했습니다.",
            },
            { status: 500 }
          );
        }

        if (duplicateCheck) {
          return NextResponse.json(
            {
              success: false,
              error: "duplicate_code",
              message: "이미 사용 중인 초대 코드입니다.",
            },
            { status: 409 }
          );
        }
      }
      
      updateData.invite_code = trimmedCode;
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    
    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    // 변경할 내용이 없는 경우
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "no_changes",
          message: "변경할 내용이 없습니다.",
        },
        { status: 400 }
      );
    }

    // 초대 코드 업데이트
    const { data: updatedCode, error: updateError } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", codeId)
      .select()
      .single();

    if (updateError) {
      console.error("초대 코드 업데이트 오류:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "초대 코드 수정에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "초대 코드가 성공적으로 수정되었습니다.",
      data: updatedCode,
    });
  } catch (error) {
    console.error("초대 코드 수정 API 오류:", error);
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

// 초대 코드 삭제 (필요시)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const codeId = parseInt(params.id);

    if (isNaN(codeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_id",
          message: "유효하지 않은 초대 코드 ID입니다.",
        },
        { status: 400 }
      );
    }

    // 초대 코드 삭제 (soft delete - is_active를 false로 변경)
    const { data: deletedCode, error: deleteError } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", codeId)
      .select()
      .single();

    if (deleteError) {
      console.error("초대 코드 삭제 오류:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "초대 코드 삭제에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "초대 코드가 성공적으로 비활성화되었습니다.",
      data: deletedCode,
    });
  } catch (error) {
    console.error("초대 코드 삭제 API 오류:", error);
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