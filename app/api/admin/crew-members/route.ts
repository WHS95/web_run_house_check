import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// 서버용 Supabase 클라이언트
const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // API 라우트에서는 쿠키 설정 불필요
        },
        remove(name: string, options: any) {
          // API 라우트에서는 쿠키 제거 불필요
        },
      },
    }
  );
};

// 크루 멤버 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get('crewId');

    if (!crewId) {
      return NextResponse.json(
        { error: "크루 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 크루 운영진 권한 확인 (user_roles 테이블 기준)
    const { data: adminCheck } = await supabase
      .schema('attendance')
      .from('user_roles')
      .select(`
        role_id,
        users!inner(verified_crew_id)
      `)
      .eq('user_id', user.id)
      .eq('role_id', 2) // ADMIN role
      .single();

    const { data: userInfo } = await supabase
      .schema('attendance')
      .from('users')
      .select('verified_crew_id')
      .eq('id', user.id)
      .single();

    if (!adminCheck || userInfo?.verified_crew_id !== crewId) {
      return NextResponse.json(
        { error: "크루 운영진 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 크루 멤버 목록 조회 (user_roles와 조인)
    const { data: members, error } = await supabase
      .schema('attendance')
      .from('users')
      .select(`
        id,
        first_name,
        email,
        phone,
        birth_year,
        profile_image_url,
        is_crew_verified,
        created_at,
        user_roles(role_id)
      `)
      .eq('verified_crew_id', crewId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('크루 멤버 조회 오류:', error);
      return NextResponse.json(
        { error: "크루 멤버 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // role_id를 평면화하여 응답
    const formattedMembers = (members || []).map(member => ({
      ...member,
      role_id: member.user_roles?.[0]?.role_id || 3, // 기본값은 USER(3)
      user_roles: undefined // 제거
    }));

    return NextResponse.json({
      success: true,
      data: formattedMembers
    });

  } catch (error) {
    console.error('크루 멤버 API 오류:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 운영진 권한 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { userId, isAdmin, crewId } = await request.json();

    if (!userId || typeof isAdmin !== 'boolean' || !crewId) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 크루 운영진 권한 확인 (user_roles 테이블 기준)
    const { data: adminCheck } = await supabase
      .schema('attendance')
      .from('user_roles')
      .select(`
        role_id,
        users!inner(verified_crew_id)
      `)
      .eq('user_id', user.id)
      .eq('role_id', 2) // ADMIN role
      .single();

    const { data: userInfo } = await supabase
      .schema('attendance')
      .from('users')
      .select('verified_crew_id')
      .eq('id', user.id)
      .single();

    if (!adminCheck || userInfo?.verified_crew_id !== crewId) {
      return NextResponse.json(
        { error: "크루 운영진 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 자기 자신의 권한은 변경할 수 없음
    if (userId === user.id) {
      return NextResponse.json(
        { error: "자기 자신의 권한은 변경할 수 없습니다." },
        { status: 400 }
      );
    }

    // 사용자의 역할 업데이트 (user_roles 테이블)
    // 먼저 기존 역할 제거
    await supabase
      .schema('attendance')
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // 새로운 역할 추가
    const newRoleId = isAdmin ? 2 : 3; // 2: ADMIN, 3: USER
    const { data, error } = await supabase
      .schema('attendance')
      .from('user_roles')
      .insert({ user_id: userId, role_id: newRoleId })
      .select()
      .single();

    if (error) {
      console.error('권한 업데이트 오류:', error);
      return NextResponse.json(
        { error: "권한 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: isAdmin ? "운영진으로 승격되었습니다." : "일반 멤버로 변경되었습니다."
    });

  } catch (error) {
    console.error('권한 업데이트 API 오류:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 크루 멤버 삭제 (추방)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const crewId = searchParams.get('crewId');

    if (!userId || !crewId) {
      return NextResponse.json(
        { error: "사용자 ID와 크루 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 크루 운영진 권한 확인 (user_roles 테이블 기준)
    const { data: adminCheck } = await supabase
      .schema('attendance')
      .from('user_roles')
      .select(`
        role_id,
        users!inner(verified_crew_id)
      `)
      .eq('user_id', user.id)
      .eq('role_id', 2) // ADMIN role
      .single();

    const { data: userInfo } = await supabase
      .schema('attendance')
      .from('users')
      .select('verified_crew_id')
      .eq('id', user.id)
      .single();

    if (!adminCheck || userInfo?.verified_crew_id !== crewId) {
      return NextResponse.json(
        { error: "크루 운영진 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 자기 자신은 추방할 수 없음
    if (userId === user.id) {
      return NextResponse.json(
        { error: "자기 자신을 추방할 수 없습니다." },
        { status: 400 }
      );
    }

    // 사용자의 크루 정보 초기화 및 역할 제거
    const { error: userUpdateError } = await supabase
      .schema('attendance')
      .from('users')
      .update({ 
        verified_crew_id: null,
        is_crew_verified: false
      })
      .eq('id', userId)
      .eq('verified_crew_id', crewId);

    // user_roles에서 역할 제거
    const { error: roleDeleteError } = await supabase
      .schema('attendance')
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    const error = userUpdateError || roleDeleteError;

    if (error) {
      console.error('멤버 추방 오류:', error);
      return NextResponse.json(
        { error: "멤버 추방에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "멤버가 크루에서 추방되었습니다."
    });

  } catch (error) {
    console.error('멤버 추방 API 오류:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}