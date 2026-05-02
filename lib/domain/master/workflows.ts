import type { CrewActivityStatus, CrewOverviewRow, CrewListItem } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ACTIVE_THRESHOLD_DAYS = 14;
const IDLE_THRESHOLD_DAYS = 30;

/**
 * 크루의 마지막 출석 시점 → 활동 상태 산출.
 * - last_attendance_at이 null/undefined → 'dormant'
 * - 14일 이내 → 'active'
 * - 14~30일 → 'idle'
 * - 30일 초과 → 'dormant'
 */
export function 크루_활동상태_산출(
    last_attendance_at: string | null | undefined,
    now: Date = new Date()
): CrewActivityStatus {
    if (!last_attendance_at) return 'dormant';
    const last = new Date(last_attendance_at);
    if (Number.isNaN(last.getTime())) return 'dormant';

    const diffDays = (now.getTime() - last.getTime()) / MS_PER_DAY;
    if (diffDays < 0) return 'active';
    if (diffDays <= ACTIVE_THRESHOLD_DAYS) return 'active';
    if (diffDays <= IDLE_THRESHOLD_DAYS) return 'idle';
    return 'dormant';
}

/**
 * CrewOverviewRow → CrewListItem 변환.
 * 내부에서 크루_활동상태_산출 호출.
 */
export function 크루목록_조립(
    rows: CrewOverviewRow[],
    now: Date = new Date()
): CrewListItem[] {
    return rows.map((row) => ({
        ...row,
        activity_status: 크루_활동상태_산출(row.last_attendance_at, now),
    }));
}

/**
 * 크루 목록을 활동 상태별로 그룹화한 카운트 산출.
 */
export function 활동상태_집계(
    rows: CrewListItem[]
): { active: number; idle: number; dormant: number } {
    const result = { active: 0, idle: 0, dormant: 0 };
    for (const row of rows) {
        result[row.activity_status] += 1;
    }
    return result;
}
