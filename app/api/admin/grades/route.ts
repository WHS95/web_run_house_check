import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const guard = await assertAdmin("grade.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const { searchParams } = new URL(request.url);
        const crewId = searchParams.get("crewId");

        if (!crewId) {
            return NextResponse.json(
                { error: "crewId가 필요합니다." },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { error: "권한이 없습니다." },
                { status: 403 }
            );
        }

        const supabase = await createClient();

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
    const guard = await assertAdmin("grade.manage");
    if (isGuardFailure(guard)) return guard;

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

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { error: "권한이 없습니다." },
                { status: 403 }
            );
        }

        const supabase = await createClient();

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
    const guard = await assertAdmin("grade.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const body = await request.json();
        const { gradeId, crewId, ...fields } = body;

        if (!gradeId || !crewId) {
            return NextResponse.json(
                { error: "gradeId와 crewId가 필요합니다." },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { error: "권한이 없습니다." },
                { status: 403 }
            );
        }

        const supabase = await createClient();

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
            .eq("crew_id", crewId)
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
    const guard = await assertAdmin("grade.manage");
    if (isGuardFailure(guard)) return guard;

    try {
        const body = await request.json();
        const { gradeId, crewId } = body;

        if (!gradeId || !crewId) {
            return NextResponse.json(
                { error: "gradeId와 crewId가 필요합니다." },
                { status: 400 }
            );
        }

        if (crewId !== guard.crewId) {
            return NextResponse.json(
                { error: "권한이 없습니다." },
                { status: 403 }
            );
        }

        const supabase = await createClient();

        const { error } = await supabase
            .schema("attendance")
            .from("crew_grades")
            .update({ is_active: false })
            .eq("id", gradeId)
            .eq("crew_id", crewId);

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
