'use server';

/**
 * 세션 보정 서버 액션 (Phase 3 Task 3.3).
 *
 * 4종 액션:
 * - removeAttendanceFromSessionAction : 세션에서 출석 제거 (soft delete)
 * - addAttendanceToSessionAction      : 세션에 멤버 추가
 * - relabelSessionAction              : 세션 라벨 변경
 * - deleteSessionAction               : 세션 자체 삭제
 *
 * 모든 액션은:
 *   1) assertAdminAction(...)로 크루 관리자 권한 확인
 *   2) 도메인 정책으로 인풋 검증
 *   3) DB 변경
 *   4) session_audit_log INSERT (감사 로그)
 *   5) revalidatePath
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import {
    라벨변경_가능한가,
    세션삭제_가능한가,
} from '@/lib/domain/session-correction/policies';
import type {
    SessionAuditAction,
} from '@/lib/domain/session-correction/types';
import type { AdminActionResult } from '@/lib/domain/admin/types';

interface AuditLogInput {
    sessionId: string | null;
    crewId: string;
    adminId: string;
    action: SessionAuditAction;
    targetUserId: string | null;
    beforeState: unknown;
    afterState: unknown;
}

/**
 * 감사 로그 기록 (내부 헬퍼).
 *
 * 실패해도 메인 작업은 롤백하지 않는다 (best-effort).
 * 단, error는 콘솔에 남긴다.
 */
async function _감사로그_기록(
    supabase: Awaited<ReturnType<typeof createClient>>,
    input: AuditLogInput,
): Promise<void> {
    const { error } = await supabase
        .schema('attendance')
        .from('session_audit_log')
        .insert({
            session_id: input.sessionId,
            crew_id: input.crewId,
            admin_id: input.adminId,
            action: input.action,
            target_user_id: input.targetUserId,
            before_state: input.beforeState ?? null,
            after_state: input.afterState ?? null,
        });
    if (error) {
        // 감사 로그 실패는 메인 작업을 롤백하지 않지만 운영자에게 알림 필요.
        // TODO(monitoring): 별도 모니터링 시스템 연동
        console.error('[session_audit_log INSERT 실패]', error);
    }
}

/**
 * 세션 소유 크루 확인 + 권한 검증.
 *
 * 1) assertAdminAction으로 크루 관리자 권한 확인.
 * 2) 세션이 실제 그 크루 소속인지 확인.
 */
async function _세션_권한_검증(
    sessionId: string,
): Promise<
    | { ok: true; crewId: string; userId: string; sessionCrewId: string }
    | { ok: false; failure: AdminActionResult }
> {
    const guard = await assertAdminAction('attendance.edit');
    if (!guard.ok) return { ok: false, failure: guard.failure };

    const supabase = await createClient();
    const { data: session, error } = await supabase
        .schema('attendance')
        .from('sessions')
        .select('id, crew_id')
        .eq('id', sessionId)
        .maybeSingle();

    if (error || !session) {
        return {
            ok: false,
            failure: {
                success: false,
                error: 'not_found',
                message: '세션을 찾을 수 없습니다.',
            },
        };
    }

    if (session.crew_id !== guard.auth.crewId) {
        return {
            ok: false,
            failure: {
                success: false,
                error: 'forbidden',
                message: '권한이 없습니다.',
            },
        };
    }

    return {
        ok: true,
        crewId: guard.auth.crewId,
        userId: guard.auth.userId,
        sessionCrewId: session.crew_id,
    };
}

/**
 * 세션에서 출석 기록 제거 (soft delete).
 *
 * - attendance_records.status = 'rejected' 로 변경
 * - attendance_records.session_id = NULL 로 분리
 * - session_members 행 제거
 * - session_audit_log INSERT
 */
export async function removeAttendanceFromSessionAction(input: {
    sessionId: string;
    recordId: string;
}): Promise<AdminActionResult> {
    const auth = await _세션_권한_검증(input.sessionId);
    if (!auth.ok) return auth.failure;

    const supabase = await createClient();

    // 기존 record 상태 조회 (audit before)
    const { data: before, error: beforeErr } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .select('id, user_id, status, session_id')
        .eq('id', input.recordId)
        .maybeSingle();

    if (beforeErr || !before) {
        return {
            success: false,
            error: 'not_found',
            message: '출석 기록을 찾을 수 없습니다.',
        };
    }

    // 상태 변경
    const { error: updErr } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .update({ status: 'rejected', session_id: null })
        .eq('id', input.recordId);

    if (updErr) {
        return {
            success: false,
            error: 'database_error',
            message: updErr.message,
        };
    }

    // session_members 제거
    await supabase
        .schema('attendance')
        .from('session_members')
        .delete()
        .eq('session_id', input.sessionId)
        .eq('user_id', before.user_id);

    await _감사로그_기록(supabase, {
        sessionId: input.sessionId,
        crewId: auth.crewId,
        adminId: auth.userId,
        action: 'remove',
        targetUserId: before.user_id,
        beforeState: before,
        afterState: { status: 'rejected', session_id: null },
    });

    revalidatePath(`/admin2/attendance/sessions/${input.sessionId}`);
    revalidatePath('/admin2/attendance/sessions');

    return {
        success: true,
        message: '출석이 세션에서 제거되었습니다.',
    };
}

/**
 * 세션에 멤버 추가 (수동 출석 보정).
 *
 * - attendance_records 새 row 삽입 (status='manual')
 * - session_members 새 row 삽입
 * - session_audit_log INSERT
 */
export async function addAttendanceToSessionAction(input: {
    sessionId: string;
    userId: string;
}): Promise<AdminActionResult> {
    const auth = await _세션_권한_검증(input.sessionId);
    if (!auth.ok) return auth.failure;

    const supabase = await createClient();

    // 세션 정보 (timestamp/위치)
    const { data: session, error: sErr } = await supabase
        .schema('attendance')
        .from('sessions')
        .select('id, crew_id, started_at, center_lat, center_lng')
        .eq('id', input.sessionId)
        .maybeSingle();

    if (sErr || !session) {
        return {
            success: false,
            error: 'not_found',
            message: '세션을 찾을 수 없습니다.',
        };
    }

    // 사용자가 이미 세션에 속해있는지 확인
    const { data: exists } = await supabase
        .schema('attendance')
        .from('session_members')
        .select('user_id')
        .eq('session_id', input.sessionId)
        .eq('user_id', input.userId)
        .maybeSingle();

    if (exists) {
        return {
            success: false,
            error: 'invalid_data',
            message: '이미 세션에 포함된 멤버입니다.',
        };
    }

    // attendance_records INSERT
    const { data: record, error: insErr } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .insert({
            user_id: input.userId,
            crew_id: auth.crewId,
            attendance_timestamp: session.started_at,
            session_id: input.sessionId,
            captured_lat: session.center_lat,
            captured_lng: session.center_lng,
            status: 'manual',
        })
        .select('id')
        .single();

    if (insErr || !record) {
        return {
            success: false,
            error: 'database_error',
            message: insErr?.message ?? '출석 기록 생성에 실패했습니다.',
        };
    }

    // session_members INSERT.
    // 실패 시(예: 다른 운영진과 동시 추가 race) 방금 만든 attendance_records를
    // 보상 삭제해 dangling 'manual' record가 남지 않게 한다.
    const { error: smErr } = await supabase
        .schema('attendance')
        .from('session_members')
        .insert({
            session_id: input.sessionId,
            user_id: input.userId,
            attendance_record_id: record.id,
            joined_at: session.started_at,
        });

    if (smErr) {
        await supabase
            .schema('attendance')
            .from('attendance_records')
            .delete()
            .eq('id', record.id);

        const isUnique = (smErr as { code?: string }).code === '23505';
        return {
            success: false,
            error: isUnique ? 'invalid_data' : 'database_error',
            message: isUnique
                ? '이미 세션에 포함된 멤버입니다.'
                : (smErr.message ?? '세션 멤버 등록에 실패했습니다.'),
        };
    }

    await _감사로그_기록(supabase, {
        sessionId: input.sessionId,
        crewId: auth.crewId,
        adminId: auth.userId,
        action: 'add',
        targetUserId: input.userId,
        beforeState: null,
        afterState: { record_id: record.id, status: 'manual' },
    });

    revalidatePath(`/admin2/attendance/sessions/${input.sessionId}`);
    revalidatePath('/admin2/attendance/sessions');

    return {
        success: true,
        message: '멤버가 세션에 추가되었습니다.',
    };
}

/**
 * 세션 라벨 변경.
 *
 * - sessions.auto_label 업데이트
 * - session_audit_log INSERT
 */
export async function relabelSessionAction(input: {
    sessionId: string;
    label: string;
}): Promise<AdminActionResult> {
    const auth = await _세션_권한_검증(input.sessionId);
    if (!auth.ok) return auth.failure;

    if (!라벨변경_가능한가({ isAdmin: true, label: input.label })) {
        return {
            success: false,
            error: 'invalid_data',
            message: '라벨은 1~50자로 입력해야 합니다.',
        };
    }

    const supabase = await createClient();

    const { data: before } = await supabase
        .schema('attendance')
        .from('sessions')
        .select('auto_label')
        .eq('id', input.sessionId)
        .maybeSingle();

    const newLabel = input.label.trim();
    const { error: updErr } = await supabase
        .schema('attendance')
        .from('sessions')
        .update({ auto_label: newLabel })
        .eq('id', input.sessionId);

    if (updErr) {
        return {
            success: false,
            error: 'database_error',
            message: updErr.message,
        };
    }

    await _감사로그_기록(supabase, {
        sessionId: input.sessionId,
        crewId: auth.crewId,
        adminId: auth.userId,
        action: 'relabel',
        targetUserId: null,
        beforeState: { auto_label: before?.auto_label ?? null },
        afterState: { auto_label: newLabel },
    });

    revalidatePath(`/admin2/attendance/sessions/${input.sessionId}`);
    revalidatePath('/admin2/attendance/sessions');

    return {
        success: true,
        message: '세션 라벨이 변경되었습니다.',
    };
}

/**
 * 세션 삭제.
 *
 * - sessions DELETE (CASCADE로 session_members까지 삭제)
 * - 연결된 attendance_records의 session_id는 SET NULL로 분리됨 (FK 정의에 따라)
 * - 30일 초과 세션은 거부
 * - session_audit_log INSERT (session_id는 NULL — 이미 삭제됨)
 */
export async function deleteSessionAction(input: {
    sessionId: string;
}): Promise<AdminActionResult> {
    const auth = await _세션_권한_검증(input.sessionId);
    if (!auth.ok) return auth.failure;

    const supabase = await createClient();

    const { data: session } = await supabase
        .schema('attendance')
        .from('sessions')
        .select('id, crew_id, started_at, auto_label')
        .eq('id', input.sessionId)
        .maybeSingle();

    if (!session) {
        return {
            success: false,
            error: 'not_found',
            message: '세션을 찾을 수 없습니다.',
        };
    }

    if (
        !세션삭제_가능한가({
            isAdmin: true,
            startedAt: new Date(session.started_at),
            now: new Date(),
        })
    ) {
        return {
            success: false,
            error: 'invalid_data',
            message:
                '시작 후 30일이 지난 세션은 통계 무결성을 위해 삭제할 수 없습니다.',
        };
    }

    // 감사 로그를 먼저 (session_id는 곧 사라짐)
    await _감사로그_기록(supabase, {
        sessionId: null, // 이미 삭제 예정
        crewId: auth.crewId,
        adminId: auth.userId,
        action: 'delete_session',
        targetUserId: null,
        beforeState: session,
        afterState: null,
    });

    const { error: delErr } = await supabase
        .schema('attendance')
        .from('sessions')
        .delete()
        .eq('id', input.sessionId);

    if (delErr) {
        return {
            success: false,
            error: 'database_error',
            message: delErr.message,
        };
    }

    revalidatePath('/admin2/attendance/sessions');

    return {
        success: true,
        message: '세션이 삭제되었습니다.',
    };
}
