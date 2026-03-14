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
        const { userId, crewId, gradeId } = body;

        if (!userId || !crewId || !gradeId) {
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

        // 등급 수동 지정 업데이트
        const { error: updateError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .update({
                crew_grade_id: gradeId,
                grade_override: true,
                grade_updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("crew_id", crewId);

        if (updateError) {
            return NextResponse.json(
                { error: "등급 업데이트에 실패했습니다." },
                { status: 500 }
            );
        }

        // 등급 변경 로그 기록
        const { error: logError } = await supabase
            .schema("attendance")
            .from("grade_promotion_logs")
            .insert({
                user_id: userId,
                crew_id: crewId,
                to_grade_id: gradeId,
                change_type: "manual",
                changed_by: user.id,
            });

        if (logError) {
            return NextResponse.json(
                { error: "등급 변경 로그 기록에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "등급이 수동 지정되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
