/**
 * 데모(/intro, /demo)용 정적 mock 데이터.
 * Supabase를 호출하지 않으며, 모든 데모 화면이 이 파일에서 import.
 *
 * 데이터는 의도적으로 "실제 운영 중인 크루처럼 보이도록" 구성:
 *  - 12명의 멤버, 한국 이름
 *  - 최근 30일 출석 (요일/장소별 현실적 분포: 평일 저녁 + 주말 아침이 많음)
 *  - 랭킹은 출석 횟수 기반
 */

export type DemoMember = {
    id: string;
    name: string;
    initial: string;
    role: "member" | "operator";
    joinedAt: string; // ISO date
};

export type DemoLocation = {
    id: string;
    name: string;
    description: string;
};

export type DemoExercise = {
    id: string;
    name: string;
};

export type DemoAttendance = {
    id: string;
    userId: string;
    userName: string;
    locationId: string;
    locationName: string;
    exerciseId: string;
    timestamp: string; // ISO
    isHost: boolean;
};

export const DEMO_CREW = {
    id: "demo-crew",
    name: "한강 러닝 크루",
    description: "매주 화/목 저녁, 토 아침 정기 러닝",
    memberCount: 12,
};

export const DEMO_MEMBERS: DemoMember[] = [
    { id: "m01", name: "김지훈", initial: "김", role: "operator", joinedAt: "2025-01-12" },
    { id: "m02", name: "박서연", initial: "박", role: "operator", joinedAt: "2025-01-15" },
    { id: "m03", name: "이도현", initial: "이", role: "member", joinedAt: "2025-02-03" },
    { id: "m04", name: "최유진", initial: "최", role: "member", joinedAt: "2025-02-10" },
    { id: "m05", name: "정하늘", initial: "정", role: "member", joinedAt: "2025-02-18" },
    { id: "m06", name: "윤서아", initial: "윤", role: "member", joinedAt: "2025-03-04" },
    { id: "m07", name: "강민준", initial: "강", role: "member", joinedAt: "2025-03-11" },
    { id: "m08", name: "조예린", initial: "조", role: "member", joinedAt: "2025-03-22" },
    { id: "m09", name: "한지우", initial: "한", role: "member", joinedAt: "2026-01-07" },
    { id: "m10", name: "임수빈", initial: "임", role: "member", joinedAt: "2026-01-19" },
    { id: "m11", name: "송태윤", initial: "송", role: "member", joinedAt: "2026-02-14" },
    { id: "m12", name: "배유나", initial: "배", role: "member", joinedAt: "2026-03-08" },
];

export const DEMO_LOCATIONS: DemoLocation[] = [
    { id: "loc-banpo", name: "반포 한강공원", description: "잠수교 남단" },
    { id: "loc-yeouido", name: "여의도 한강공원", description: "여의나루역 2번" },
    { id: "loc-ttukseom", name: "뚝섬 한강공원", description: "자벌레 앞" },
    { id: "loc-seonyu", name: "선유도 공원", description: "선유교 입구" },
];

export const DEMO_EXERCISES: DemoExercise[] = [
    { id: "ex-run", name: "러닝" },
    { id: "ex-interval", name: "인터벌" },
    { id: "ex-long", name: "장거리" },
    { id: "ex-hill", name: "언덕" },
];

/**
 * 30일 출석 기록을 결정론적으로 생성.
 * - 화/목 19:00 반포 (평일 저녁), 토 07:00 여의도 (주말 아침), 일 08:00 뚝섬 격주
 * - 매 모임마다 4~9명 참여
 */
function generateAttendances(): DemoAttendance[] {
    const records: DemoAttendance[] = [];
    // 기준일: 2026-04-26 (오늘) - CLAUDE.md 시스템 컨텍스트
    // 모든 시각 연산은 UTC로 수행 — SSR(서버 TZ)과 CSR(브라우저 TZ)에서
    // 동일한 timestamps가 나와야 hydration mismatch가 발생하지 않는다.
    const today = new Date(Date.UTC(2026, 3, 26));

    // 시드 기반 의사난수: 같은 입력에 같은 출력
    let seed = 7;
    const rand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    const sessions: Array<{ daysAgo: number; hour: number; minute: number; loc: DemoLocation; ex: DemoExercise; targetCount: number }> = [];

    for (let d = 0; d < 30; d++) {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() - d);
        const dow = date.getUTCDay();
        // 0=일 1=월 2=화 3=수 4=목 5=금 6=토
        if (dow === 2 || dow === 4) {
            sessions.push({
                daysAgo: d, hour: 19, minute: 0,
                loc: DEMO_LOCATIONS[0],
                ex: dow === 2 ? DEMO_EXERCISES[1] : DEMO_EXERCISES[0],
                targetCount: 6 + Math.floor(rand() * 4),
            });
        }
        if (dow === 6) {
            sessions.push({
                daysAgo: d, hour: 7, minute: 0,
                loc: DEMO_LOCATIONS[1],
                ex: DEMO_EXERCISES[2],
                targetCount: 8 + Math.floor(rand() * 3),
            });
        }
        if (dow === 0 && d % 14 < 7) {
            sessions.push({
                daysAgo: d, hour: 8, minute: 0,
                loc: DEMO_LOCATIONS[2],
                ex: DEMO_EXERCISES[3],
                targetCount: 4 + Math.floor(rand() * 4),
            });
        }
    }

    let recordId = 0;
    sessions.forEach((s, sessionIdx) => {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() - s.daysAgo);
        date.setUTCHours(s.hour, s.minute, 0, 0);

        // 멤버를 셔플하여 targetCount만큼 선택
        const shuffled = [...DEMO_MEMBERS].sort(() => rand() - 0.5);
        const attendees = shuffled.slice(0, s.targetCount);
        // 운영진이 개설 (있을 때)
        const operator = attendees.find((m) => m.role === "operator") ?? attendees[0];

        attendees.forEach((m) => {
            records.push({
                id: `att-${recordId++}`,
                userId: m.id,
                userName: m.name,
                locationId: s.loc.id,
                locationName: s.loc.name,
                exerciseId: s.ex.id,
                timestamp: date.toISOString(),
                isHost: m.id === operator.id,
            });
        });
    });

    return records;
}

export const DEMO_ATTENDANCES = generateAttendances();

/* ── 파생 통계 ── */

export type DemoRanking = {
    rank: number;
    member: DemoMember;
    count: number;
};

export const DEMO_RANKINGS: DemoRanking[] = (() => {
    const counts = new Map<string, number>();
    DEMO_ATTENDANCES.forEach((a) => {
        counts.set(a.userId, (counts.get(a.userId) ?? 0) + 1);
    });
    const sorted = DEMO_MEMBERS
        .map((m) => ({ member: m, count: counts.get(m.id) ?? 0 }))
        .sort((a, b) => b.count - a.count);
    return sorted.map((s, i) => ({ rank: i + 1, ...s }));
})();

export type DayStat = { shortName: string; rate: number };
export const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export const DEMO_DAY_STATS: DayStat[] = (() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    DEMO_ATTENDANCES.forEach((a) => {
        const dow = new Date(a.timestamp).getUTCDay();
        counts[dow]++;
    });
    const total = DEMO_ATTENDANCES.length;
    // 월화수목금토일 순서 (앱과 동일)
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((i) => ({
        shortName: DAY_NAMES[i],
        rate: total > 0 ? Math.round((counts[i] / total) * 100) : 0,
    }));
})();

export type PlaceStat = { name: string; rate: number };

export const DEMO_PLACE_STATS: PlaceStat[] = (() => {
    const counts = new Map<string, number>();
    DEMO_ATTENDANCES.forEach((a) => {
        counts.set(a.locationName, (counts.get(a.locationName) ?? 0) + 1);
    });
    const total = DEMO_ATTENDANCES.length;
    return Array.from(counts.entries())
        .map(([name, c]) => ({
            name,
            rate: total > 0 ? Math.round((c / total) * 100) : 0,
        }))
        .sort((a, b) => b.rate - a.rate);
})();

export const DEMO_OVERALL = {
    totalMembers: DEMO_MEMBERS.length,
    attendedMembers: new Set(DEMO_ATTENDANCES.map((a) => a.userId)).size,
    totalSessions: new Set(
        DEMO_ATTENDANCES.map((a) => a.timestamp.slice(0, 13)),
    ).size,
    totalRecords: DEMO_ATTENDANCES.length,
    get attendanceRate() {
        return Math.round(
            (this.attendedMembers / this.totalMembers) * 100,
        );
    },
};

/** 최근 N일 일자별 출석자 수 */
export const DEMO_DAILY_TREND: { date: string; count: number }[] = (() => {
    const map = new Map<string, number>();
    DEMO_ATTENDANCES.forEach((a) => {
        const day = a.timestamp.slice(0, 10);
        map.set(day, (map.get(day) ?? 0) + 1);
    });
    return Array.from(map.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
})();
