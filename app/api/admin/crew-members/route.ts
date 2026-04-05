import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidateTag } from "next/cache";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

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
                set(name: string, value: string, options: any) {},
                remove(name: string, options: any) {},
            },
        }
    );
};

// 크루 멤버 목록 조회
export async function GET(request: NextRequest) {
    const guard = await assertAdmin("user.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const crewId = searchParams.get("crewId");

        if (!crewId) {
            return NextResponse.json(
                { success: false, message: "크루 ID가 필요합니다." },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { success: false, message: "권한이 없습니다." },
                { status: 403 }
            );
        }

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
            return NextResponse.json(
                { success: false, message: "크루 멤버 조회에 실패했습니다." },
                { status: 500 }
            );
        }

        const formattedMembers = (members || []).map((member) => ({
            ...member.users,
            role_id: member.crew_role === "CREW_MANAGER" ? 2 : 3,
            crew_role: member.crew_role,
        }));

        return NextResponse.json({
            success: true,
            data: formattedMembers,
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 운영진 권한 업데이트
export async function PATCH(request: NextRequest) {
    const guard = await assertAdmin("user.changeRole");
    if (isGuardFailure(guard)) return guard;

    try {
        const supabase = await createSupabaseServerClient();
        const { userId, isAdmin, crewId } = await request.json();

        if (!userId || typeof isAdmin !== "boolean" || !crewId) {
            return NextResponse.json(
                { success: false, message: "필수 정보가 누락되었습니다." },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { success: false, message: "권한이 없습니다." },
                { status: 403 }
            );
        }

        if (userId === guard.userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "자기 자신의 권한은 변경할 수 없습니다.",
                },
                { status: 400 }
            );
        }

        const newCrewRole = isAdmin ? "CREW_MANAGER" : "MEMBER";
        const { data, error } = await supabase
            .schema("attendance")
            .from("user_crews")
            .update({ crew_role: newCrewRole })
            .eq("user_id", userId)
            .eq("crew_id", crewId)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, message: "권한 업데이트에 실패했습니다." },
                { status: 500 }
            );
        }

        revalidateTag(`admin:users:${guard.crewId}`);

        return NextResponse.json({
            success: true,
            data,
            message: isAdmin
                ? "운영진으로 승격되었습니다."
                : "일반 멤버로 변경되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 크루 멤버 삭제 (추방)
export async function DELETE(request: NextRequest) {
    const guard = await assertAdmin("user.remove");
    if (isGuardFailure(guard)) return guard;

    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const crewId = searchParams.get("crewId");

        if (!userId || !crewId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "사용자 ID와 크루 ID가 필요합니다.",
                },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { success: false, message: "권한이 없습니다." },
                { status: 403 }
            );
        }

        if (userId === guard.userId) {
            return NextResponse.json(
                { success: false, message: "자기 자신을 추방할 수 없습니다." },
                { status: 400 }
            );
        }

        const { error: userUpdateError } = await supabase
            .schema("attendance")
            .from("users")
            .update({
                verified_crew_id: null,
                is_crew_verified: false,
            })
            .eq("id", userId)
            .eq("verified_crew_id", crewId);

        const { error: crewMemberDeleteError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .delete()
            .eq("user_id", userId)
            .eq("crew_id", crewId);

        const error = userUpdateError || crewMemberDeleteError;

        if (error) {
            return NextResponse.json(
                { success: false, message: "멤버 추방에 실패했습니다." },
                { status: 500 }
            );
        }

        revalidateTag(`admin:users:${guard.crewId}`);

        return NextResponse.json({
            success: true,
            message: "멤버가 크루에서 추방되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
