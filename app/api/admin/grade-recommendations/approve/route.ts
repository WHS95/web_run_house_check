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

export async function POST(request: NextRequest) {
    try {
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

        const body = await request.json();
        const { userId, crewId, newGradeId } = body;

        if (!userId || !crewId || !newGradeId) {
            return NextResponse.json(
                { error: "사용자 ID, 크루 ID, 새 등급 ID가 모두 필요합니다." },
                { status: 400 }
            );
        }

        // 크루 매니저 권한 확인
        const { data: userCrew, error: crewError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("role")
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .single();

        if (crewError || !userCrew || userCrew.role !== "manager") {
            return NextResponse.json(
                { error: "크루 매니저 권한이 필요합니다." },
                { status: 403 }
            );
        }

        // user_crews 등급 업데이트
        const { error: updateError } = await supabase
            .schema("attendance")
            .from("user_crews")
            .update({
                crew_grade_id: newGradeId,
                grade_updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("crew_id", crewId);

        if (updateError) {
            console.error("등급 업데이트 오류:", updateError);
            return NextResponse.json(
                { error: "등급 업데이트 중 오류가 발생했습니다." },
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
                to_grade_id: newGradeId,
                change_type: "approved",
                changed_by: user.id,
            });

        if (logError) {
            console.error("등급 변경 로그 기록 오류:", logError);
            return NextResponse.json(
                { error: "등급 변경 로그 기록 중 오류가 발생했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "등급이 승인되었습니다.",
        });
    } catch (error) {
        console.error("등급 승인 API 오류:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
