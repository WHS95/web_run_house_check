'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import { getPostHogServer, flushPostHog } from '@/lib/posthog/server';
import { crew_grade_업데이트_페이로드_빌드 } from '@/lib/domain/grade/policies';
import type {
    CrewGradeRow,
    GradeRecommendationRow,
} from '@/lib/domain/grade/types';
import type { AdminActionResult } from '@/lib/domain/admin/types';

const REVALIDATE_PATH = '/admin2/settings/grade';

/**
 * 자기 크루의 등급 목록 조회. /api/admin/grades GET 대체.
 */
export async function getCrewGradesAction(input: {
    crewId: string;
}): Promise<AdminActionResult<CrewGradeRow[]>> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crewId가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('attendance')
        .from('crew_grades')
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
        .eq('crew_id', input.crewId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '등급 목록 조회에 실패했습니다.',
        };
    }

    return { success: true, data: (data ?? []) as unknown as CrewGradeRow[] };
}

/**
 * 등급 신규 생성. /api/admin/grades POST 대체.
 */
export async function createCrewGradeAction(input: {
    crewId: string;
    gradeId: number;
    nameOverride?: string | null;
    descriptionOverride?: string | null;
    minAttendanceCount?: number | null;
    minHostingCount?: number | null;
    promotionPeriodType?: string | null;
    sortOrder?: number | null;
    canHost?: boolean | null;
}): Promise<AdminActionResult<CrewGradeRow>> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    if (!input.crewId || !input.gradeId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crewId와 gradeId가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('attendance')
        .from('crew_grades')
        .insert({
            crew_id: input.crewId,
            grade_id: input.gradeId,
            name_override: input.nameOverride ?? null,
            description_override: input.descriptionOverride ?? null,
            min_attendance_count: input.minAttendanceCount ?? null,
            min_hosting_count: input.minHostingCount ?? null,
            promotion_period_type: input.promotionPeriodType ?? null,
            sort_order: input.sortOrder ?? null,
            can_host: input.canHost ?? null,
        })
        .select()
        .single();

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '등급 생성에 실패했습니다.',
        };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: data as unknown as CrewGradeRow };
}

/**
 * 등급 수정. /api/admin/grades PATCH 대체.
 * camelCase → snake_case 매핑은 도메인 정책 함수에서 처리한다.
 */
export async function updateCrewGradeAction(input: {
    gradeId: number;
    crewId: string;
    nameOverride?: string | null;
    descriptionOverride?: string | null;
    minAttendanceCount?: number | null;
    minHostingCount?: number | null;
    promotionPeriodType?: string | null;
    sortOrder?: number | null;
    canHost?: boolean | null;
    isActive?: boolean | null;
}): Promise<AdminActionResult<CrewGradeRow>> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    const { gradeId, crewId, ...fields } = input;

    if (!gradeId || !crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'gradeId와 crewId가 필요합니다.',
        };
    }
    if (crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const updateData = crew_grade_업데이트_페이로드_빌드(
        fields as Record<string, unknown>
    );

    if (Object.keys(updateData).length === 0) {
        return {
            success: false,
            error: 'no_fields',
            message: '업데이트할 필드가 없습니다.',
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('attendance')
        .from('crew_grades')
        .update(updateData)
        .eq('id', gradeId)
        .eq('crew_id', crewId)
        .select()
        .single();

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '등급 수정에 실패했습니다.',
        };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: data as unknown as CrewGradeRow };
}

/**
 * 등급 비활성화 (soft delete). /api/admin/grades DELETE 대체.
 */
export async function deactivateCrewGradeAction(input: {
    gradeId: number;
    crewId: string;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    if (!input.gradeId || !input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'gradeId와 crewId가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .schema('attendance')
        .from('crew_grades')
        .update({ is_active: false })
        .eq('id', input.gradeId)
        .eq('crew_id', input.crewId);

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '등급 비활성화에 실패했습니다.',
        };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: '등급이 비활성화되었습니다.' };
}

/**
 * 사용자 등급 수동 지정. /api/admin/grades/assign PATCH 대체.
 * - user_crews.grade_override=true, grade_updated_at=now()
 * - grade_promotion_logs에 manual 로그 기록
 * - PostHog server_grade_assigned 이벤트
 */
export async function assignUserGradeAction(input: {
    userId: string;
    crewId: string;
    gradeId: number;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    if (!input.userId || !input.crewId || !input.gradeId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '필수 항목이 누락되었습니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();

    const { error: updateError } = await supabase
        .schema('attendance')
        .from('user_crews')
        .update({
            crew_grade_id: input.gradeId,
            grade_override: true,
            grade_updated_at: new Date().toISOString(),
        })
        .eq('user_id', input.userId)
        .eq('crew_id', input.crewId);

    if (updateError) {
        return {
            success: false,
            error: 'database_error',
            message: '등급 업데이트에 실패했습니다.',
        };
    }

    const { error: logError } = await supabase
        .schema('attendance')
        .from('grade_promotion_logs')
        .insert({
            user_id: input.userId,
            crew_id: input.crewId,
            to_grade_id: input.gradeId,
            change_type: 'manual',
            changed_by: guard.auth.userId,
        });

    if (logError) {
        return {
            success: false,
            error: 'database_error',
            message: '등급 변경 로그 기록에 실패했습니다.',
        };
    }

    const posthog = getPostHogServer();
    if (posthog) {
        posthog.capture({
            distinctId: guard.auth.userId,
            event: 'server_grade_assigned',
            properties: {
                crew_id: input.crewId,
                target_user_id: input.userId,
                grade_id: input.gradeId,
            },
        });
        await flushPostHog();
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: '등급이 수동 지정되었습니다.' };
}

/**
 * 사용자 등급 override 해제(자동 계산 모드 복원).
 * /api/admin/grades/reset-override PATCH 대체.
 */
export async function resetUserGradeOverrideAction(input: {
    userId: string;
    crewId: string;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    if (!input.userId || !input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '필수 항목이 누락되었습니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .schema('attendance')
        .from('user_crews')
        .update({ grade_override: false })
        .eq('user_id', input.userId)
        .eq('crew_id', input.crewId);

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '등급 복원에 실패했습니다.',
        };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: '자동 계산 모드로 복원되었습니다.' };
}

/**
 * 등급 승격 추천 목록 조회. /api/admin/grade-recommendations GET 대체.
 */
export async function getGradeRecommendationsAction(input: {
    crewId: string;
}): Promise<AdminActionResult<GradeRecommendationRow[]>> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '크루 ID가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('attendance')
        .rpc('calculate_grade_recommendations', {
            p_crew_id: input.crewId,
        });

    if (error) {
        console.error('등급 추천 조회 오류:', error);
        return {
            success: false,
            error: 'database_error',
            message: '등급 추천 데이터를 가져오는 중 오류가 발생했습니다.',
        };
    }

    return {
        success: true,
        data: (data ?? []) as unknown as GradeRecommendationRow[],
    };
}

/**
 * 단일 등급 추천 승인. /api/admin/grade-recommendations/approve POST 대체.
 */
export async function approveGradeRecommendationAction(input: {
    userId: string;
    crewId: string;
    newGradeId: number;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    if (!input.userId || !input.crewId || !input.newGradeId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '사용자 ID, 크루 ID, 새 등급 ID가 모두 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();

    const { error: updateError } = await supabase
        .schema('attendance')
        .from('user_crews')
        .update({
            crew_grade_id: input.newGradeId,
            grade_updated_at: new Date().toISOString(),
        })
        .eq('user_id', input.userId)
        .eq('crew_id', input.crewId);

    if (updateError) {
        console.error('등급 업데이트 오류:', updateError);
        return {
            success: false,
            error: 'database_error',
            message: '등급 업데이트 중 오류가 발생했습니다.',
        };
    }

    const { error: logError } = await supabase
        .schema('attendance')
        .from('grade_promotion_logs')
        .insert({
            user_id: input.userId,
            crew_id: input.crewId,
            to_grade_id: input.newGradeId,
            change_type: 'approved',
            changed_by: guard.auth.userId,
        });

    if (logError) {
        console.error('등급 변경 로그 기록 오류:', logError);
        return {
            success: false,
            error: 'database_error',
            message: '등급 변경 로그 기록 중 오류가 발생했습니다.',
        };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, message: '등급이 승인되었습니다.' };
}

/**
 * 모든 등급 추천 일괄 승인.
 * /api/admin/grade-recommendations/approve-all POST 대체.
 *
 * 라우트 동작 보존:
 * - 추천이 0건이면 count=0으로 성공 반환
 * - 각 사용자에 대해 update + log insert를 순차 실행하고 실패는 다음 항목으로 continue
 * - 최종 approvedCount만 반환
 */
export async function approveAllGradeRecommendationsAction(input: {
    crewId: string;
}): Promise<AdminActionResult<{ count: number }>> {
    const guard = await assertAdminAction('grade.manage');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '크루 ID가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();

    const { data: recommendations, error: rpcError } = await supabase
        .schema('attendance')
        .rpc('calculate_grade_recommendations', {
            p_crew_id: input.crewId,
        });

    if (rpcError) {
        console.error('등급 추천 조회 오류:', rpcError);
        return {
            success: false,
            error: 'database_error',
            message: '등급 추천 데이터를 가져오는 중 오류가 발생했습니다.',
        };
    }

    const recs = (recommendations ?? []) as unknown as GradeRecommendationRow[];
    if (recs.length === 0) {
        return {
            success: true,
            message: '승인할 등급 변경 추천이 없습니다.',
            data: { count: 0 },
        };
    }

    let approvedCount = 0;

    for (const rec of recs) {
        const { error: updateError } = await supabase
            .schema('attendance')
            .from('user_crews')
            .update({
                crew_grade_id: rec.recommended_grade_id,
                grade_updated_at: new Date().toISOString(),
            })
            .eq('user_id', rec.user_id)
            .eq('crew_id', input.crewId);

        if (updateError) {
            console.error(
                `사용자 ${rec.user_id} 등급 업데이트 오류:`,
                updateError
            );
            continue;
        }

        const { error: logError } = await supabase
            .schema('attendance')
            .from('grade_promotion_logs')
            .insert({
                user_id: rec.user_id,
                crew_id: input.crewId,
                to_grade_id: rec.recommended_grade_id,
                change_type: 'approved',
                changed_by: guard.auth.userId,
            });

        if (logError) {
            console.error(
                `사용자 ${rec.user_id} 등급 변경 로그 기록 오류:`,
                logError
            );
            continue;
        }

        approvedCount++;
    }

    revalidatePath(REVALIDATE_PATH);
    return {
        success: true,
        message: '모든 등급 변경이 승인되었습니다.',
        data: { count: approvedCount },
    };
}
