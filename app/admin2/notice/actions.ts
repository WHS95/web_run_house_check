'use server';

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import { sendNotification } from '@/lib/push/send-notification';
import * as 공지정책 from '@/lib/domain/notice/policies';
import type { NoticeRow } from '@/lib/domain/notice/types';
import type { AdminActionResult } from '@/lib/domain/admin/types';

const NOTICE_SELECT =
    'id, crew_id, title, type, content, is_active, author_id, ' +
    'created_at, author:author_id(first_name)';

const NOTICES_LIMIT = 100;

/**
 * 자기 크루 공지 목록 조회 (선택: 제목/내용 검색).
 * /api/admin/notices GET 대체.
 */
export async function getCrewNoticesAction(input: {
    crewId: string;
    q?: string | null;
}): Promise<AdminActionResult<NoticeRow[]>> {
    const guard = await assertAdminAction('notice.create');
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
    let query = supabase
        .schema('attendance')
        .from('notices')
        .select(NOTICE_SELECT)
        .eq('crew_id', input.crewId)
        .order('created_at', { ascending: false })
        .limit(NOTICES_LIMIT);

    const q = input.q?.trim();
    if (q) {
        const escaped = 공지정책.ilike_쿼리_escape(q);
        query = query.or(
            `title.ilike.%${escaped}%,content.ilike.%${escaped}%`
        );
    }

    const { data, error } = await query;
    if (error) {
        console.error('[getCrewNoticesAction] query failed:', error);
        return {
            success: false,
            error: 'database_error',
            message: '공지 조회에 실패했습니다.',
        };
    }

    return { success: true, data: (data ?? []) as unknown as NoticeRow[] };
}

/**
 * 새 공지 작성. 기존 활성 공지를 비활성화하고 새 공지를 삽입.
 * /api/admin/notices POST 대체. 푸시 발송은 별도 액션에서 처리.
 */
export async function createNoticeAction(input: {
    crewId: string;
    title: string;
    content: string;
    type?: string | null;
}): Promise<AdminActionResult<NoticeRow>> {
    const guard = await assertAdminAction('notice.create');
    if (!guard.ok) return guard.failure;

    if (!input.crewId || !input.title?.trim() || !input.content?.trim()) {
        return {
            success: false,
            error: 'invalid_data',
            message: '크루 ID, 제목, 공지 내용이 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const noticeType = 공지정책.공지타입_정규화(input.type);

    const supabase = await createClient();

    // 기존 활성 공지 비활성화 (최신 1개만 활성)
    await supabase
        .schema('attendance')
        .from('notices')
        .update({ is_active: false })
        .eq('crew_id', input.crewId)
        .eq('is_active', true);

    // 새 공지 삽입
    const { data, error } = await supabase
        .schema('attendance')
        .from('notices')
        .insert({
            crew_id: input.crewId,
            author_id: guard.auth.userId,
            title: input.title.trim(),
            type: noticeType,
            content: input.content.trim(),
        })
        .select()
        .single();

    if (error) {
        console.error('[createNoticeAction] insert failed:', error);
        return {
            success: false,
            error: 'database_error',
            message: '공지 등록에 실패했습니다.',
        };
    }

    revalidateTag(`admin:notices:${guard.auth.crewId}`);

    return { success: true, data: data as NoticeRow };
}

/**
 * 공지 비활성화 (논리 삭제).
 * /api/admin/notices DELETE 대체.
 *
 * 주의: 기존 라우트는 PATCH/UPDATE를 별도 라우트로 분리하지 않고
 * is_active=false 처리만 한다. 라우트 호환성 위해 동일 동작 유지.
 */
export async function deleteNoticeAction(input: {
    noticeId: number;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('notice.delete');
    if (!guard.ok) return guard.failure;

    if (!input.noticeId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '공지 ID가 필요합니다.',
        };
    }

    const supabase = await createClient();

    // 대상 공지가 현재 관리자 소속 크루인지 검증
    const { data: target } = await supabase
        .schema('attendance')
        .from('notices')
        .select('crew_id')
        .eq('id', input.noticeId)
        .maybeSingle();

    if (!target || target.crew_id !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const { error } = await supabase
        .schema('attendance')
        .from('notices')
        .update({ is_active: false })
        .eq('id', input.noticeId);

    if (error) {
        console.error('[deleteNoticeAction] update failed:', error);
        return {
            success: false,
            error: 'database_error',
            message: '공지 삭제에 실패했습니다.',
        };
    }

    revalidateTag(`admin:notices:${guard.auth.crewId}`);

    return { success: true };
}

/**
 * 공지 단건 조회.
 * /api/admin/notices/[id] GET 대체.
 *
 * 라우트와 동일하게 자기 크루의 공지만 조회 가능.
 */
export async function getNoticeByIdAction(input: {
    noticeId: number;
}): Promise<AdminActionResult<NoticeRow>> {
    const guard = await assertAdminAction('notice.update');
    if (!guard.ok) return guard.failure;

    if (!input.noticeId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '공지 ID가 필요합니다.',
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('attendance')
        .from('notices')
        .select(NOTICE_SELECT)
        .eq('id', input.noticeId)
        .eq('crew_id', guard.auth.crewId)
        .maybeSingle();

    if (error) {
        console.error('[getNoticeByIdAction] query failed:', error);
        return {
            success: false,
            error: 'database_error',
            message: '공지 조회에 실패했습니다.',
        };
    }
    if (!data) {
        return {
            success: false,
            error: 'not_found',
            message: '공지를 찾을 수 없습니다.',
        };
    }

    return { success: true, data: data as unknown as NoticeRow };
}

/**
 * 공지 푸시 발송. 작성 완료 모달 "확인" 클릭 시 호출.
 * /api/admin/notices/[id]/push POST 대체.
 *
 * 크루원 전체에게 FCM 푸시 발송. sendNotification은 fire-and-forget이지만
 * 호출 실패(네트워크/Firebase 에러 등)는 throw하므로 try/catch로 감싼다.
 */
export async function pushNoticeAction(input: {
    noticeId: number;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('notice.create');
    if (!guard.ok) return guard.failure;

    if (!input.noticeId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '공지 ID가 필요합니다.',
        };
    }

    const supabase = await createClient();
    const { data: notice, error } = await supabase
        .schema('attendance')
        .from('notices')
        .select('id, crew_id, title, type, content')
        .eq('id', input.noticeId)
        .eq('crew_id', guard.auth.crewId)
        .maybeSingle();

    if (error) {
        console.error('[pushNoticeAction] fetch failed:', error);
        return {
            success: false,
            error: 'database_error',
            message: '공지 조회에 실패했습니다.',
        };
    }
    if (!notice) {
        return {
            success: false,
            error: 'not_found',
            message: '공지를 찾을 수 없습니다.',
        };
    }

    const title = 공지정책.공지_푸시_타이틀({
        title: notice.title as string | null,
        type: notice.type as string | null,
        content: notice.content as string,
    });
    const body = 공지정책.공지_푸시_본문(notice.content as string);

    try {
        await sendNotification(guard.auth.crewId, null, null, {
            type: 'announcement',
            title,
            body,
            data: {
                crewId: guard.auth.crewId,
                url: `/notifications/notice/${notice.id}`,
            },
        });
    } catch (e) {
        console.error('[pushNoticeAction] send failed:', e);
        return {
            success: false,
            error: 'push_failed',
            message: '푸시 발송에 실패했습니다.',
        };
    }

    return { success: true };
}
