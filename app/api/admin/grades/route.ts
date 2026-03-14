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

async function checkAdminAuth(supabase: any, crewId: string) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            error: NextResponse.json(
                { error: "인증이 필요합니다." },
                { status: 401 }
            ),
        };
    }

    const { data: adminCheck } = await supabase
        .schema("attendance")
        .from("user_crews")
        .select("crew_role")
        .eq("user_id", user.id)
        .eq("crew_id", crewId)
        .eq("crew_role", "CREW_MANAGER")
        .single();

    if (!adminCheck) {
        return {
            error: NextResponse.json(
                { error: "크루 운영진 권한이 필요합니다." },
                { status: 403 }
            ),
        };
    }

    return { user };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const crewId = searchParams.get("crewId");

        if (!crewId) {
            return NextResponse.json(
                { error: "crewId가 필요합니다." },
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

        const { data: adminCheck } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_role")
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .eq("crew_role", "CREW_MANAGER")
            .single();
        if (!adminCheck) {
            return NextResponse.json(
                { error: "크루 운영진 권한이 필요합니다." },
                { status: 403 }
            );
        }

        const { data: grades, error } = await supabase
            .schema("attendance")
            .from("crew_grades")
            .select(
                `
                id,
                crew_id,
                grade_id,
                name_override,
                description_override,
                min_attendance_count,
                min_hosting_count,
                promotion_period_type,
                sort_order,
                can_host,
                is_active,
                grades:grade_id (name)
            `
            )
            .eq("crew_id", crewId)
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (error) {
            return NextResponse.json(
                { error: "등급 목록 조회에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: grades });
    } catch (error) {
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            crewId,
            gradeId,
            nameOverride,
            descriptionOverride,
            minAttendanceCount,
            minHostingCount,
            promotionPeriodType,
            sortOrder,
            canHost,
        } = body;

        if (!crewId || !gradeId) {
            return NextResponse.json(
                { error: "crewId와 gradeId가 필요합니다." },
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

        const { data: adminCheck } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_role")
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .eq("crew_role", "CREW_MANAGER")
            .single();
        if (!adminCheck) {
            return NextResponse.json(
                { error: "크루 운영진 권한이 필요합니다." },
                { status: 403 }
            );
        }

        const { data: newGrade, error } = await supabase
            .schema("attendance")
            .from("crew_grades")
            .insert({
                crew_id: crewId,
                grade_id: gradeId,
                name_override: nameOverride || null,
                description_override: descriptionOverride || null,
                min_attendance_count: minAttendanceCount,
                min_hosting_count: minHostingCount,
                promotion_period_type: promotionPeriodType,
                sort_order: sortOrder,
                can_host: canHost,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "등급 생성에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: newGrade });
    } catch (error) {
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { gradeId, crewId, ...fields } = body;

        if (!gradeId || !crewId) {
            return NextResponse.json(
                { error: "gradeId와 crewId가 필요합니다." },
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

        const { data: adminCheck } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_role")
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .eq("crew_role", "CREW_MANAGER")
            .single();
        if (!adminCheck) {
            return NextResponse.json(
                { error: "크루 운영진 권한이 필요합니다." },
                { status: 403 }
            );
        }

        const fieldMap: Record<string, string> = {
            nameOverride: "name_override",
            descriptionOverride: "description_override",
            minAttendanceCount: "min_attendance_count",
            minHostingCount: "min_hosting_count",
            promotionPeriodType: "promotion_period_type",
            sortOrder: "sort_order",
            canHost: "can_host",
            isActive: "is_active",
        };

        const updateData: Record<string, any> = {};
        for (const [key, value] of Object.entries(fields)) {
            const dbColumn = fieldMap[key];
            if (dbColumn) {
                updateData[dbColumn] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "업데이트할 필드가 없습니다." },
                { status: 400 }
            );
        }

        const { data: updatedGrade, error } = await supabase
            .schema("attendance")
            .from("crew_grades")
            .update(updateData)
            .eq("id", gradeId)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "등급 수정에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: updatedGrade });
    } catch (error) {
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { gradeId, crewId } = body;

        if (!gradeId || !crewId) {
            return NextResponse.json(
                { error: "gradeId와 crewId가 필요합니다." },
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

        const { data: adminCheck } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_role")
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .eq("crew_role", "CREW_MANAGER")
            .single();
        if (!adminCheck) {
            return NextResponse.json(
                { error: "크루 운영진 권한이 필요합니다." },
                { status: 403 }
            );
        }

        const { error } = await supabase
            .schema("attendance")
            .from("crew_grades")
            .update({ is_active: false })
            .eq("id", gradeId);

        if (error) {
            return NextResponse.json(
                { error: "등급 비활성화에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "등급이 비활성화되었습니다.",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
