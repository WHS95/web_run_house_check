import type { ActiveHoursSlot, TimeWindowMode } from './types';

const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

interface TimeWindowMatchInput {
    mode: TimeWindowMode;
    activeHours: ActiveHoursSlot[] | null;
    /** UTC Date 객체. 호출자가 KST 기준으로 보고 싶으면 KST Date를 만들어 전달 */
    capturedAt: Date;
    /** cluster_first 모드에서 사용 — 근처에 활성 세션이 있으면 무조건 통과 */
    recentSessionExistsNearby: boolean;
}

/**
 * 출석 시각이 크루의 시간 윈도우 정책 안에 들어가는가?
 *
 * - anytime: 항상 true
 * - cluster_first: 근처 활성 세션 있으면 true, 없으면 active_hours 슬롯 확인
 * - active_hours: 슬롯 안이면 true (슬롯 비어있으면 사실상 제한 없음)
 */
export function 시간윈도우_매칭여부(args: TimeWindowMatchInput): boolean {
    if (args.mode === 'anytime') return true;
    if (args.mode === 'cluster_first') {
        return (
            args.recentSessionExistsNearby ||
            _내_활성시간_여부(args.capturedAt, args.activeHours)
        );
    }
    if (args.mode === 'active_hours') {
        return _내_활성시간_여부(args.capturedAt, args.activeHours);
    }
    return false;
}

function _내_활성시간_여부(
    when: Date,
    slots: ActiveHoursSlot[] | null,
): boolean {
    // 슬롯 미지정/빈 배열이면 제한 없음 (사실상 anytime)
    if (!slots || slots.length === 0) return true;

    const day = DAY_MAP[when.getDay()];
    const hh = String(when.getHours()).padStart(2, '0');
    const mm = String(when.getMinutes()).padStart(2, '0');
    const hhmm = `${hh}:${mm}`;

    return slots.some(
        (s) => s.day === day && hhmm >= s.from && hhmm <= s.to,
    );
}
