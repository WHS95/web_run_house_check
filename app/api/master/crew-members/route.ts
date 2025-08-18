import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// 크루 멤버 목록 조회 (마스터 관리자용)
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

    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");

    if (!crewId) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_data",
          message: "크루 ID가 필요합니다.",
        },
        { status: 400 }
      );
    }

    // 크루 멤버 목록 조회 (user_crews와 조인)
    const { data: members, error } = await supabase
      .schema("attendance")
      .from("user_crews")
      .select(
        `
        crew_role,
        users!inner(
          id,
          first_name,
          email,
          phone,
          birth_year,
          profile_image_url,
          is_crew_verified,
          created_at
        )
      `
      )
      .eq("crew_id", crewId)
      .order("users(created_at)", { ascending: false });

    if (error) {
      console.error("크루 멤버 조회 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "크루 멤버 조회에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // crew_role을 포함하여 응답 포맷팅
    const formattedMembers = (members || []).map((member) => ({
      ...member.users,
      crew_role: member.crew_role,
    }));

    return NextResponse.json({
      success: true,
      data: formattedMembers,
    });
  } catch (error) {
    console.error("크루 멤버 API 오류:", error);
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

// 운영진 권한 업데이트 (마스터 관리자용)
export async function PATCH(request: NextRequest) {
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

    const { crewId, userId, newRole } = await request.json();

    if (!crewId || !userId || !newRole) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_data",
          message: "필수 정보가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    // 유효한 역할인지 확인
    if (!["CREW_MANAGER", "MEMBER"].includes(newRole)) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_role",
          message: "유효하지 않은 역할입니다.",
        },
        { status: 400 }
      );
    }

    // 사용자의 역할 업데이트 (user_crews 테이블의 crew_role 변경)
    const { data, error } = await supabase
      .schema("attendance")
      .from("user_crews")
      .update({ crew_role: newRole })
      .eq("user_id", userId)
      .eq("crew_id", crewId)
      .select()
      .single();

    if (error) {
      console.error("권한 업데이트 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "권한 업데이트에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: newRole === "CREW_MANAGER"
        ? "운영진으로 승격되었습니다."
        : "일반 멤버로 변경되었습니다.",
    });
  } catch (error) {
    console.error("권한 업데이트 API 오류:", error);
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