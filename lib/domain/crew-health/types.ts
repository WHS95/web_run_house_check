/**
 * 크루 헬스(이탈/온보딩) 도메인 타입.
 */

export interface MemberHealthInput {
    userId: string;
    userName: string;
    /** 가입일로부터 경과 주 수 (정수). */
    weeksSinceJoined: number;
    /**
     * 가장 최근 주가 [0]에 오는 주별 출석 횟수 배열.
     * 배열 길이는 baselineWeeks + observationWeeks 이상이어야 정확.
     */
    weeklyAttendanceCounts: number[];
    /** 최근 30일 누적 출석 수 (온보딩 평가용). */
    attendanceCountLast30d: number;
}

export interface CrewHealthRules {
    baselineWeeks: number;
    minBaselineRate: number;
    observationWeeks: number;
    onboardingWindowWeeks: number;
    onboardingMinCount: number;
}

export interface ChurnRiskResult {
    user: MemberHealthInput;
    isChurnRisk: boolean;
    isOnboardingRisk: boolean;
}
