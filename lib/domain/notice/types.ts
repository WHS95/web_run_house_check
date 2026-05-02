/**
 * 공지/푸시 도메인 타입.
 *
 * 기존 라우트(/api/admin/notices, /api/admin/push-history,
 * /api/push/test)에서 흩어져 있던 row/타입을 한 곳에 모은다.
 */

/**
 * 공지 타입.
 * - 공지: 일반 공지
 * - 일반: 평범한 안내
 * - 중요: 강조 공지 (UI에서 별도 처리)
 */
export type NoticeType = "공지" | "일반" | "중요";

/**
 * 공지 작성자 정보 (Supabase 조인 응답).
 * Supabase 타입 추론이 단일 객체/배열 모두를 허용하므로
 * 도메인에서 통일된 형태로 보관한다.
 */
export type NoticeAuthor =
    | { first_name: string | null }
    | { first_name: string | null }[]
    | null;

/**
 * notices 테이블 SELECT 결과 row.
 * /api/admin/notices GET, /api/admin/notices/[id] GET 양쪽 사용.
 */
export interface NoticeRow {
    id: number;
    crew_id: string;
    title: string | null;
    type: NoticeType | null;
    content: string;
    is_active: boolean;
    author_id: string;
    created_at: string;
    author?: NoticeAuthor;
}

/**
 * push_history 테이블 SELECT 결과 row.
 * /api/admin/push-history GET 사용.
 */
export interface PushHistoryRow {
    id: string;
    title: string;
    target_mode: string;
    target_count: number;
    success_count: number;
    failure_count: number;
    created_at: string;
}

/**
 * 푸시 발송 대상 모드.
 * - all: 크루 전체
 * - select: 선택된 사용자만
 */
export type PushTargetMode = "all" | "select";

/**
 * /api/push/test POST 응답 — 테스트 푸시 발송 결과.
 */
export interface PushTestResult {
    success: true;
    targetCount: number;
    tokenCount: number;
    successCount: number;
    failureCount: number;
    history: PushHistoryRow | null;
}
