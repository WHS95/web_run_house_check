/**
 * 크루 헬스(이탈/온보딩) 위험 정책.
 *
 * 본 모듈은 순수 함수만 포함한다 (Supabase/Next/React import 없음).
 */

export interface 이탈위험_입력 {
    baselineWeeks: number;
    minBaselineRate: number;
    observationWeeks: number;
    /** 가장 최근 주가 [0]에 오는 주별 출석 횟수 배열. */
    weeklyAttendanceCounts: number[];
}

/**
 * 이탈 위험 여부.
 *
 * 정의:
 *   - baseline 기간(observation 직전 baselineWeeks 주 동안):
 *     "출석한 주가 baselineWeeks × minBaselineRate 이상"
 *   - observation 기간(가장 최근 observationWeeks 주):
 *     "모든 주에 출석이 0회"
 *   둘 다 만족하면 이탈 위험.
 *
 * 데이터가 부족하면 false (위험 아님으로 처리, 운영자 부담 최소화).
 */
export function 이탈위험인가(args: 이탈위험_입력): boolean {
    const {
        baselineWeeks,
        minBaselineRate,
        observationWeeks,
        weeklyAttendanceCounts,
    } = args;

    if (baselineWeeks <= 0 || observationWeeks <= 0) return false;
    if (
        weeklyAttendanceCounts.length <
        baselineWeeks + observationWeeks
    ) {
        return false;
    }

    const observation = weeklyAttendanceCounts.slice(0, observationWeeks);
    const baseline = weeklyAttendanceCounts.slice(
        observationWeeks,
        observationWeeks + baselineWeeks,
    );

    const baselineRate =
        baseline.filter((c) => c > 0).length / baseline.length;
    if (baselineRate < minBaselineRate) return false;

    return observation.every((c) => c === 0);
}

export interface 온보딩위험_입력 {
    weeksSinceJoined: number;
    onboardingWindowWeeks: number;
    onboardingMinCount: number;
    /** 가입 후 누적 출석 수. */
    attendanceCount: number;
}

/**
 * 온보딩 위험 여부.
 *
 * 정의:
 *   - 가입 후 2주 이상 ~ onboardingWindowWeeks 이내인 멤버
 *   - 그 기간 내 누적 출석이 onboardingMinCount 미만
 *
 * 너무 이르거나(2주 미만) 윈도우를 지난 멤버는 false.
 */
export function 온보딩위험인가(args: 온보딩위험_입력): boolean {
    if (args.weeksSinceJoined < 2) return false;
    if (args.weeksSinceJoined > args.onboardingWindowWeeks) return false;
    return args.attendanceCount < args.onboardingMinCount;
}
