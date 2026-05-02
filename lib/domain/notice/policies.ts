/**
 * 공지/푸시 도메인 정책.
 *
 * /api/admin/notices, /api/admin/notices/[id]/push,
 * /api/push/test 라우트에 흩어져 있던 비-DB 비즈니스 로직을 모은다.
 */

import type { NoticeType, PushTargetMode } from "./types";

/**
 * 허용되는 공지 타입 목록 (기존 route의 VALID_TYPES와 동일).
 */
const VALID_NOTICE_TYPES: readonly NoticeType[] = [
    "공지",
    "일반",
    "중요",
] as const;

/**
 * 입력값이 유효한 공지 타입인가?
 *
 * 클라이언트에서 임의 문자열을 보내도 type guard로 좁히기 위해 사용.
 * 라우트의 `type && VALID_TYPES.includes(type as NoticeType)` 가드와 호환.
 */
export function 유효한_공지타입(type: unknown): type is NoticeType {
    return (
        typeof type === "string" &&
        VALID_NOTICE_TYPES.includes(type as NoticeType)
    );
}

/**
 * 공지 타입 정규화 — 유효하지 않은 입력은 기본값 "일반"으로 폴백.
 *
 * /api/admin/notices POST 라우트의 폴백 로직을 도메인으로 추출.
 */
export function 공지타입_정규화(type: unknown): NoticeType {
    return 유효한_공지타입(type) ? type : "일반";
}

/**
 * Supabase ilike 검색용 쿼리 escape.
 *
 * `%`와 `,`만 escape — 둘은 Supabase or() filter 문법에서 구분자/와일드카드로
 * 처리되므로 사용자 입력에 그대로 들어가면 안 된다.
 *
 * 기존 /api/admin/notices GET의 inline escape와 동일한 동작.
 */
export function ilike_쿼리_escape(q: string): string {
    return q.replace(/[%,]/g, (m) => (m === "%" ? "\\%" : "\\,"));
}

/**
 * 입력값이 유효한 푸시 대상 모드인가?
 *
 * /api/push/test 라우트의 `targetMode?: "all" | "select"` 타입 가드용.
 */
export function 유효한_푸시대상모드(mode: unknown): mode is PushTargetMode {
    return mode === "all" || mode === "select";
}

/**
 * Notice 푸시 발송 시 알림 타이틀을 만든다.
 * `[타입] 제목` 또는 (제목이 없을 시) `[타입] 본문 30자`.
 *
 * /api/admin/notices/[id]/push POST 라우트에서 `[${noticeType}] ${noticeTitle}`
 * 로직을 도메인으로 추출.
 */
export function 공지_푸시_타이틀(args: {
    title: string | null;
    type: string | null;
    content: string;
}): string {
    const fallbackTitle = args.title?.trim() || args.content.slice(0, 30);
    const type = args.type ?? "일반";
    return `[${type}] ${fallbackTitle}`;
}

/**
 * Notice 푸시 발송 시 알림 본문 — 본문 100자 슬라이스.
 *
 * /api/admin/notices/[id]/push POST 라우트의 슬라이스 로직.
 */
export function 공지_푸시_본문(content: string): string {
    return content.slice(0, 100);
}
