import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

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

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, crewId } = body;

        if (!userId || !crewId) {
            return NextResponse.json(
                { error: "필수 항목이 누락되었습니다." },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        // 크루 매니저 권한 확인
        const { data: managerData, error: managerError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_role")
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .eq("crew_role", "CREW_MANAGER")
            .single();

        if (managerError || !managerData) {
            return NextResponse.json(
                { error: "크루 매니저 권한이 필요합니다." },
                { status: 403 }
            );
        }

        // 자동 계산 모드로 복원
        const { error: updateError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .update({
                grade_override: false,
            })
            .eq("user_id", userId)
            .eq("crew_id", crewId);

        if (updateError) {
            return NextResponse.json(
                { error: "등급 복원에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "자동 계산 모드로 복원되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
