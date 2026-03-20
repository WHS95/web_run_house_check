import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: 인증된 사용자의 크루 장소 조회 (활성 장소만)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 인증 확인
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

        // 사용자의 크루 ID 가져오기
        const { searchParams } = new URL(request.url);
        let crewId = searchParams.get("crew_id");

        if (!crewId) {
            // crew_id가 없으면 users 테이블의 verified_crew_id에서 가져오기
            const { data: userData } = await supabase
                .from("users")
                .select("verified_crew_id, is_crew_verified")
                .eq("id", user.id)
                .single();

            if (!userData?.is_crew_verified || !userData?.verified_crew_id) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "크루에 소속되어 있지 않습니다.",
                    },
                    { status: 404 }
                );
            }

            crewId = userData.verified_crew_id;
        }

        // 활성 장소만 조회
        const { data, error } = await supabase
            .schema("attendance")
            .from("crew_locations")
            .select("*")
            .eq("crew_id", crewId)
            .eq("is_active", true)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error("크루 장소 조회 API 오류:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
