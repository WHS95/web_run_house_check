import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// 크루 목록 조회
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

    // 마스터 관리자 권한 확인 (role_id = 1: SUPER_ADMIN 또는 role_id = 2: ADMIN)
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

    // 모든 크루 조회
    const { data: crews, error: crewsError } = await supabase
      .schema("attendance")
      .from("crews")
      .select("*")
      .order("created_at", { ascending: false });

    if (crewsError) {
      console.error("크루 목록 조회 오류:", crewsError);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "크루 목록을 불러오는데 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: crews || [],
    });
  } catch (error) {
    console.error("크루 목록 API 오류:", error);
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

// 새 크루 생성
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
    const { name, description } = await request.json();

    // 필수 데이터 검증
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_data",
          message: "크루 이름이 필요합니다.",
        },
        { status: 400 }
      );
    }

    // 크루 이름 중복 확인
    const { data: existingCrew, error: checkError } = await supabase
      .schema("attendance")
      .from("crews")
      .select("id")
      .eq("name", name.trim())
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116은 "결과 없음" 오류로, 중복이 없다는 의미
      console.error("크루 중복 확인 오류:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "크루 생성 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (existingCrew) {
      return NextResponse.json(
        {
          success: false,
          error: "duplicate_name",
          message: "이미 존재하는 크루 이름입니다.",
        },
        { status: 409 }
      );
    }

    // 새 크루 생성
    const { data: newCrew, error: createError } = await supabase
      .schema("attendance")
      .from("crews")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("크루 생성 오류:", createError);
      return NextResponse.json(
        {
          success: false,
          error: "database_error",
          message: "크루 생성에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `크루 "${name.trim()}"이 성공적으로 생성되었습니다.`,
      data: newCrew,
    });
  } catch (error) {
    console.error("크루 생성 API 오류:", error);
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
