import { createClient } from '@/lib/supabase/server';
import {
    이탈위험인가,
    온보딩위험인가,
} from '@/lib/domain/crew-health/policies';

export interface KpiSnapshot {
    todayWau: number;
    todayMau: number;
    todaySessionCount: number;
    todayAttendanceCount: number;
    /** 7일 전 같은 시점 대비 WAU 증감률 (예: 0.12 = +12%). null이면 비교 불가. */
    wauDeltaRate: number | null;
}

export interface HeatmapCell {
    day: number; // 0=일 ~ 6=토
    hour: number; // 0~23
    count: number;
}

export interface LocationLeaderItem {
    label: string | null;
    sessionCount: number;
    attendanceCount: number;
    centerLat: number;
    centerLng: number;
}

export interface MemberPatternItem {
    userId: string;
    userName: string;
    profileImageUrl: string | null;
    last30dAttendance: number;
    weeklyCounts: number[];
}

export interface ChurnRiskMember {
    userId: string;
    userName: string;
    profileImageUrl: string | null;
    weeklyCounts: number[];
    weeksSinceJoined: number;
}

export interface HealthDashboardVM {
    kpi: KpiSnapshot;
    heatmap: HeatmapCell[];
    leaderboard: LocationLeaderItem[];
    memberPatterns: MemberPatternItem[];
    churnRisk: ChurnRiskMember[];
    onboardingRisk: ChurnRiskMember[];
}

interface CrewRules {
    churnBaselineWeeks: number;
    churnMinBaselineRate: number;
    churnObservationWeeks: number;
    onboardingWindowWeeks: number;
    onboardingMinCount: number;
}

const DEFAULT_RULES: CrewRules = {
    churnBaselineWeeks: 4,
    churnMinBaselineRate: 0.5,
    churnObservationWeeks: 2,
    onboardingWindowWeeks: 4,
    onboardingMinCount: 2,
};

function _주차_index(daysAgo: number): number {
    return Math.floor(daysAgo / 7);
}

/**
 * 헬스 대시보드 ViewModel.
 *
 * - 오늘 KPI: crew_health_daily 최신 행
 * - 히트맵: 최근 30일 attendance_records의 요일×시간대 히트맵
 * - 위치 리더보드: 최근 30일 sessions의 라벨/위치별 집계
 * - 멤버 패턴: 최근 30일 출석한 멤버의 주간 패턴
 * - 이탈/온보딩 위험: member_activity_daily + crews 룰 적용
 */
export async function loadHealthDashboardVM(
    crewId: string,
): Promise<HealthDashboardVM> {
    const supabase = await createClient();

    // 크루 룰 로드 (없으면 디폴트)
    const { data: crew } = await supabase
        .schema('attendance')
        .from('crews')
        .select(
            'churn_baseline_weeks, churn_min_baseline_rate, churn_observation_weeks, onboarding_window_weeks, onboarding_min_count',
        )
        .eq('id', crewId)
        .maybeSingle();

    const rules: CrewRules = crew
        ? {
              churnBaselineWeeks:
                  (crew.churn_baseline_weeks as number) ??
                  DEFAULT_RULES.churnBaselineWeeks,
              churnMinBaselineRate:
                  (crew.churn_min_baseline_rate as number) ??
                  DEFAULT_RULES.churnMinBaselineRate,
              churnObservationWeeks:
                  (crew.churn_observation_weeks as number) ??
                  DEFAULT_RULES.churnObservationWeeks,
              onboardingWindowWeeks:
                  (crew.onboarding_window_weeks as number) ??
                  DEFAULT_RULES.onboardingWindowWeeks,
              onboardingMinCount:
                  (crew.onboarding_min_count as number) ??
                  DEFAULT_RULES.onboardingMinCount,
          }
        : DEFAULT_RULES;

    // ---- 1) KPI 스냅샷 ----
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    const { data: latestSnapshot } = await supabase
        .schema('attendance')
        .from('crew_health_daily')
        .select(
            'date, wau, mau, session_count, attendance_count',
        )
        .eq('crew_id', crewId)
        .lte('date', todayStr)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

    const { data: prevSnapshot } = await supabase
        .schema('attendance')
        .from('crew_health_daily')
        .select('wau')
        .eq('crew_id', crewId)
        .lte('date', sevenDaysAgoStr)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

    const todayWau = (latestSnapshot?.wau as number | undefined) ?? 0;
    const prevWau = prevSnapshot?.wau as number | undefined;
    const wauDeltaRate =
        prevWau != null && prevWau > 0
            ? (todayWau - prevWau) / prevWau
            : null;

    const kpi: KpiSnapshot = {
        todayWau,
        todayMau: (latestSnapshot?.mau as number | undefined) ?? 0,
        todaySessionCount:
            (latestSnapshot?.session_count as number | undefined) ?? 0,
        todayAttendanceCount:
            (latestSnapshot?.attendance_count as number | undefined) ?? 0,
        wauDeltaRate,
    };

    // ---- 2) 히트맵 (최근 30일 attendance_records) ----
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const { data: arRows } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .select('attendance_timestamp, user_id')
        .eq('crew_id', crewId)
        .gte('attendance_timestamp', thirtyDaysAgo.toISOString())
        .in('status', ['confirmed', 'manual']);

    const heatmapMap = new Map<string, number>();
    const userAttendance = new Map<string, Date[]>();
    for (const row of arRows ?? []) {
        const ts = new Date(row.attendance_timestamp as string);
        // KST 보정 (UTC+9)
        const kst = new Date(ts.getTime() + 9 * 60 * 60 * 1000);
        const day = kst.getUTCDay();
        const hour = kst.getUTCHours();
        const key = `${day}-${hour}`;
        heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);

        const uid = row.user_id as string;
        const arr = userAttendance.get(uid) ?? [];
        arr.push(ts);
        userAttendance.set(uid, arr);
    }
    const heatmap: HeatmapCell[] = [];
    for (let d = 0; d < 7; d += 1) {
        for (let h = 0; h < 24; h += 1) {
            heatmap.push({
                day: d,
                hour: h,
                count: heatmapMap.get(`${d}-${h}`) ?? 0,
            });
        }
    }

    // ---- 3) 위치 리더보드 (최근 30일 sessions) ----
    const { data: sessions } = await supabase
        .schema('attendance')
        .from('sessions')
        .select(
            'id, auto_label, center_lat, center_lng, started_at',
        )
        .eq('crew_id', crewId)
        .gte('started_at', thirtyDaysAgo.toISOString());

    // session별 멤버 수 집계
    const sessionIds = (sessions ?? []).map((s) => s.id as string);
    const { data: smCounts } = sessionIds.length
        ? await supabase
              .schema('attendance')
              .from('session_members')
              .select('session_id')
              .in('session_id', sessionIds)
        : { data: [] };

    const memberCountMap = new Map<string, number>();
    for (const row of smCounts ?? []) {
        const sid = row.session_id as string;
        memberCountMap.set(sid, (memberCountMap.get(sid) ?? 0) + 1);
    }

    // 라벨로 그룹화
    const leaderMap = new Map<string, LocationLeaderItem>();
    for (const s of sessions ?? []) {
        const label = (s.auto_label as string | null) ?? '미분류';
        const item = leaderMap.get(label) ?? {
            label,
            sessionCount: 0,
            attendanceCount: 0,
            centerLat: s.center_lat as number,
            centerLng: s.center_lng as number,
        };
        item.sessionCount += 1;
        item.attendanceCount += memberCountMap.get(s.id as string) ?? 0;
        leaderMap.set(label, item);
    }
    const leaderboard = Array.from(leaderMap.values())
        .sort((a, b) => b.attendanceCount - a.attendanceCount)
        .slice(0, 5);

    // ---- 4) 멤버 패턴 (최근 30일 출석자) ----
    const { data: userRows } = userAttendance.size
        ? await supabase
              .schema('attendance')
              .from('users')
              .select('id, name, profile_image_url')
              .in('id', Array.from(userAttendance.keys()))
        : { data: [] };

    const userMap = new Map<
        string,
        { name: string; profile_image_url: string | null }
    >();
    for (const row of userRows ?? []) {
        userMap.set(row.id as string, {
            name: (row.name as string) ?? '알 수 없음',
            profile_image_url:
                (row.profile_image_url as string | null) ?? null,
        });
    }

    const memberPatterns: MemberPatternItem[] = Array.from(
        userAttendance.entries(),
    )
        .map(([userId, dates]) => {
            const weeklyCounts = [0, 0, 0, 0]; // 최근 4주
            const last30d = dates.length;
            for (const d of dates) {
                const daysAgo = Math.floor(
                    (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
                );
                const w = _주차_index(daysAgo);
                if (w >= 0 && w < weeklyCounts.length) {
                    weeklyCounts[w] += 1;
                }
            }
            const u = userMap.get(userId);
            return {
                userId,
                userName: u?.name ?? '알 수 없음',
                profileImageUrl: u?.profile_image_url ?? null,
                last30dAttendance: last30d,
                weeklyCounts,
            };
        })
        .sort((a, b) => b.last30dAttendance - a.last30dAttendance)
        .slice(0, 20);

    // ---- 5) 이탈/온보딩 위험 ----
    // 가입일 + 주간 출석 횟수 (최근 baseline+observation 주)
    const totalWeeks =
        rules.churnBaselineWeeks + rules.churnObservationWeeks;
    const weeklyStartDate = new Date(today);
    weeklyStartDate.setDate(
        today.getDate() - (totalWeeks * 7 + 1),
    );

    const { data: ucRows } = await supabase
        .schema('attendance')
        .from('user_crews')
        .select('user_id, joined_at, status')
        .eq('crew_id', crewId)
        .eq('status', 'ACTIVE');

    const { data: madRows } = await supabase
        .schema('attendance')
        .from('member_activity_daily')
        .select('user_id, date, attended')
        .eq('crew_id', crewId)
        .gte('date', weeklyStartDate.toISOString().slice(0, 10));

    const memberWeekly = new Map<string, number[]>();
    for (const row of madRows ?? []) {
        if (!row.attended) continue;
        const uid = row.user_id as string;
        const date = new Date((row.date as string) + 'T00:00:00Z');
        const daysAgo = Math.floor(
            (today.getTime() - date.getTime()) /
                (1000 * 60 * 60 * 24),
        );
        const w = _주차_index(daysAgo);
        if (w < 0 || w >= totalWeeks) continue;
        const arr = memberWeekly.get(uid) ?? Array(totalWeeks).fill(0);
        arr[w] = (arr[w] ?? 0) + 1;
        memberWeekly.set(uid, arr);
    }

    // 활성 멤버에 대해 user 정보 보강
    const allMemberIds = (ucRows ?? []).map((r) => r.user_id as string);
    const { data: allUserRows } = allMemberIds.length
        ? await supabase
              .schema('attendance')
              .from('users')
              .select('id, name, profile_image_url')
              .in('id', allMemberIds)
        : { data: [] };

    const allUserMap = new Map<
        string,
        { name: string; profile_image_url: string | null }
    >();
    for (const row of allUserRows ?? []) {
        allUserMap.set(row.id as string, {
            name: (row.name as string) ?? '알 수 없음',
            profile_image_url:
                (row.profile_image_url as string | null) ?? null,
        });
    }

    const churnRisk: ChurnRiskMember[] = [];
    const onboardingRisk: ChurnRiskMember[] = [];

    for (const uc of ucRows ?? []) {
        const userId = uc.user_id as string;
        const joinedAt = uc.joined_at as string | null;
        const weeklyCounts =
            memberWeekly.get(userId) ?? Array(totalWeeks).fill(0);

        const weeksSinceJoined = joinedAt
            ? Math.floor(
                  (today.getTime() -
                      new Date(joinedAt).getTime()) /
                      (1000 * 60 * 60 * 24 * 7),
              )
            : 9999;

        const u = allUserMap.get(userId);
        const baseEntry: ChurnRiskMember = {
            userId,
            userName: u?.name ?? '알 수 없음',
            profileImageUrl: u?.profile_image_url ?? null,
            weeklyCounts,
            weeksSinceJoined,
        };

        if (
            이탈위험인가({
                baselineWeeks: rules.churnBaselineWeeks,
                minBaselineRate: rules.churnMinBaselineRate,
                observationWeeks: rules.churnObservationWeeks,
                weeklyAttendanceCounts: weeklyCounts,
            })
        ) {
            churnRisk.push(baseEntry);
        }

        const totalAttendance = weeklyCounts.reduce(
            (acc, c) => acc + c,
            0,
        );
        if (
            온보딩위험인가({
                weeksSinceJoined,
                onboardingWindowWeeks: rules.onboardingWindowWeeks,
                onboardingMinCount: rules.onboardingMinCount,
                attendanceCount: totalAttendance,
            })
        ) {
            onboardingRisk.push(baseEntry);
        }
    }

    return {
        kpi,
        heatmap,
        leaderboard,
        memberPatterns,
        churnRisk: churnRisk.slice(0, 30),
        onboardingRisk: onboardingRisk.slice(0, 30),
    };
}
