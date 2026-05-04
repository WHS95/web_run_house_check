# 감지 기반 출석 시스템 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 모임 사전 등록 없이 출석 시점에 자동으로 모임을 감지(클러스터링)하는 출석 시스템 + 운영진 보정 화면 + 크루 헬스 대시보드를 구현한다.

**Architecture:** BFF 4계층 (page.tsx RSC → actions.ts → lib/domain → Supabase RLS). 클러스터링은 Postgres trigger + 단순 threshold 기반(±15분/±100m). 마스터(전역)/크루(per-crew) 2계층 settings 분리. 모든 임계값은 코드 배포 없이 운영 가능.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RPC + pg_cron), TypeScript, Vitest, RunHouse 디자인 토큰(`--rh-*`), Tailwind, Framer Motion (`AnimatedList`/`FadeIn`).

**Design Doc:** [`2026-05-05-attendance-detection-design.md`](./2026-05-05-attendance-detection-design.md)

**작업 모드:** Subagent-Driven 권장. 각 Task별 작업 → `code-reviewer` 리뷰 → 통과 시 다음.

---

## Phase 개요

| Phase | 영역 | Task 수 | 주요 산출물 |
|-------|------|--------|------------|
| **Phase 1** | 설정 인프라 (마스터/크루 분리) | 7 | system_settings, crews 컬럼, 마스터/크루 settings UI |
| **Phase 2** | 감지 출석 코어 | 6 | sessions/session_members 테이블, 클러스터링, RPC, 자동 종료 cron |
| **Phase 3** | 운영진 보정 화면 | 6 | audit_log, 보정 도메인, 세션 목록/보정 페이지, 라벨 추천, 종료 푸시 |
| **Phase 4** | 크루 헬스 대시보드 | 5 | 일별 집계, crew-health 도메인, /admin2/analyze 확장, 이탈/온보딩 알림 |

**총 24 Task.** Phase 순차 실행 권장 (의존성 있음).

---

# Phase 1 — 설정 인프라

## Task 1.1: `system_settings` 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/20260505_0001_system_settings.sql`

**Step 1: 마이그레이션 작성**

```sql
-- attendance.system_settings: 마스터 관리자가 운영하는 시스템 전역 튜닝 값
CREATE TABLE attendance.system_settings (
    key         text PRIMARY KEY,
    value       jsonb NOT NULL,
    description text,
    updated_by  uuid REFERENCES attendance.users(id),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 초기 값
INSERT INTO attendance.system_settings(key, value, description) VALUES
  ('session_window_minutes',       '15',  '클러스터링 시간 임계값 (분)'),
  ('session_radius_m',             '100', '클러스터링 거리 임계값 (m)'),
  ('session_close_minutes',        '60',  '세션 자동 종료 시간 (분)'),
  ('auto_label_min_session_count', '5',   '라벨 자동 추천 최소 세션 수');

-- RLS: 마스터만 읽기/쓰기 가능
ALTER TABLE attendance.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_master_select ON attendance.system_settings
    FOR SELECT TO authenticated
    USING (attendance.is_master_admin());

CREATE POLICY system_settings_master_modify ON attendance.system_settings
    FOR ALL TO authenticated
    USING (attendance.is_master_admin())
    WITH CHECK (attendance.is_master_admin());

-- 서버에서 출석 처리 시 read만 필요 → SECURITY DEFINER 함수 제공
CREATE OR REPLACE FUNCTION attendance.get_system_setting(p_key text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = attendance, public AS $$
    SELECT value FROM attendance.system_settings WHERE key = p_key;
$$;

GRANT EXECUTE ON FUNCTION attendance.get_system_setting(text) TO authenticated, anon;
```

**Step 2: 적용**

Run: `npx supabase db push` (또는 MCP `apply_migration`)
Expected: 테이블 생성 성공, 4개 row 삽입.

**Step 3: 검증**

```sql
SELECT key, value FROM attendance.system_settings ORDER BY key;
SELECT attendance.get_system_setting('session_close_minutes');  -- => 60
```

**Step 4: 커밋**

```bash
git add -f supabase/migrations/20260505_0001_system_settings.sql
git commit -m "feat(attendance): system_settings 테이블 + 마스터 RLS"
```

---

## Task 1.2: `system_settings_history` 테이블 + 트리거

**Files:**
- Create: `supabase/migrations/20260505_0002_system_settings_history.sql`

**Step 1: 마이그레이션**

```sql
CREATE TABLE attendance.system_settings_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key         text NOT NULL,
    old_value   jsonb,
    new_value   jsonb,
    updated_by  uuid REFERENCES attendance.users(id),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_settings_history_key
    ON attendance.system_settings_history(key, updated_at DESC);

ALTER TABLE attendance.system_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_history_master_select
    ON attendance.system_settings_history FOR SELECT TO authenticated
    USING (attendance.is_master_admin());

-- 트리거: 변경 시 히스토리 자동 기록
CREATE OR REPLACE FUNCTION attendance.log_system_settings_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = attendance, public AS $$
BEGIN
    IF NEW.value IS DISTINCT FROM OLD.value THEN
        INSERT INTO attendance.system_settings_history
            (key, old_value, new_value, updated_by)
        VALUES (NEW.key, OLD.value, NEW.value, NEW.updated_by);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_system_settings_history
    AFTER UPDATE ON attendance.system_settings
    FOR EACH ROW EXECUTE FUNCTION attendance.log_system_settings_change();
```

**Step 2: 적용 + 검증**

```sql
UPDATE attendance.system_settings
   SET value = '70', updated_by = '<some-master-uuid>'
 WHERE key = 'session_close_minutes';
SELECT * FROM attendance.system_settings_history;  -- 1 row 존재해야 함
```

**Step 3: 커밋**

```bash
git add -f supabase/migrations/20260505_0002_system_settings_history.sql
git commit -m "feat(attendance): system_settings 변경 이력 트리거"
```

---

## Task 1.3: `crews` 테이블 컬럼 추가 (크루 settings)

**Files:**
- Create: `supabase/migrations/20260505_0003_crews_attendance_settings.sql`

**Step 1: 마이그레이션**

```sql
ALTER TABLE attendance.crews
  ADD COLUMN IF NOT EXISTS time_window_mode text
      CHECK (time_window_mode IN ('cluster_first','active_hours','anytime'))
      DEFAULT 'cluster_first',
  ADD COLUMN IF NOT EXISTS active_hours jsonb NULL,
  ADD COLUMN IF NOT EXISTS churn_baseline_weeks       int     DEFAULT 4,
  ADD COLUMN IF NOT EXISTS churn_min_baseline_rate    decimal DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS churn_observation_weeks    int     DEFAULT 2,
  ADD COLUMN IF NOT EXISTS onboarding_window_weeks    int     DEFAULT 4,
  ADD COLUMN IF NOT EXISTS onboarding_min_count       int     DEFAULT 2;

COMMENT ON COLUMN attendance.crews.time_window_mode IS
  'cluster_first: 군집 우선 / active_hours: 활성 시간대 / anytime: 24시간';
COMMENT ON COLUMN attendance.crews.active_hours IS
  '[{day:"mon",from:"18:00",to:"22:00"}, ...]';
```

**Step 2: 적용 + 커밋**

```bash
git add -f supabase/migrations/20260505_0003_crews_attendance_settings.sql
git commit -m "feat(attendance): crews 테이블에 시간/이탈/온보딩 룰 컬럼 추가"
```

---

## Task 1.4: 마스터 settings 도메인 (`lib/domain/system-settings/`)

@superpowers:test-driven-development 적용.

**Files:**
- Create: `lib/domain/system-settings/types.ts`
- Create: `lib/domain/system-settings/validators.ts`
- Create: `lib/domain/system-settings/validators.test.ts`
- Create: `lib/domain/system-settings/policies.ts`
- Create: `lib/domain/system-settings/policies.test.ts`

**Step 1: types**

```ts
// lib/domain/system-settings/types.ts
export type SystemSettingKey =
    | 'session_window_minutes'
    | 'session_radius_m'
    | 'session_close_minutes'
    | 'auto_label_min_session_count';

export interface SystemSettings {
    session_window_minutes: number;
    session_radius_m: number;
    session_close_minutes: number;
    auto_label_min_session_count: number;
}

export const SYSTEM_SETTINGS_DEFAULT: SystemSettings = {
    session_window_minutes: 15,
    session_radius_m: 100,
    session_close_minutes: 60,
    auto_label_min_session_count: 5,
};
```

**Step 2: validators (Zod 스키마 + 범위 제한)**

```ts
// lib/domain/system-settings/validators.ts
import { z } from 'zod';

export const SystemSettingsSchema = z.object({
    session_window_minutes: z.number().int().min(1).max(120),
    session_radius_m: z.number().int().min(10).max(2000),
    session_close_minutes: z.number().int().min(5).max(360),
    auto_label_min_session_count: z.number().int().min(1).max(100),
});

export type SystemSettingsInput = z.infer<typeof SystemSettingsSchema>;
```

**Step 3: validators.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { SystemSettingsSchema } from './validators';

describe('SystemSettingsSchema', () => {
    it('디폴트 값을 통과시킨다', () => {
        const result = SystemSettingsSchema.safeParse({
            session_window_minutes: 15,
            session_radius_m: 100,
            session_close_minutes: 60,
            auto_label_min_session_count: 5,
        });
        expect(result.success).toBe(true);
    });

    it('범위 밖 값을 거부한다', () => {
        const result = SystemSettingsSchema.safeParse({
            session_window_minutes: 0,
            session_radius_m: 100,
            session_close_minutes: 60,
            auto_label_min_session_count: 5,
        });
        expect(result.success).toBe(false);
    });
});
```

Run: `npx vitest run lib/domain/system-settings/`
Expected: 2 passed.

**Step 4: policies — 변경가능여부**

```ts
// lib/domain/system-settings/policies.ts
import type { SystemSettings } from './types';

/**
 * 변경 시 위험 검사: 클러스터링 임계값을 너무 좁히면 기존 세션이 분리될 수 있음.
 */
export function 위험변경_여부(
    이전: Pick<SystemSettings, 'session_window_minutes' | 'session_radius_m'>,
    이후: Pick<SystemSettings, 'session_window_minutes' | 'session_radius_m'>,
): boolean {
    const window좁아짐 =
        이후.session_window_minutes < 이전.session_window_minutes / 2;
    const radius좁아짐 =
        이후.session_radius_m < 이전.session_radius_m / 2;
    return window좁아짐 || radius좁아짐;
}
```

**Step 5: policies.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { 위험변경_여부 } from './policies';

describe('위험변경_여부', () => {
    it('window를 절반 미만으로 줄이면 위험', () => {
        expect(위험변경_여부(
            { session_window_minutes: 15, session_radius_m: 100 },
            { session_window_minutes: 7, session_radius_m: 100 },
        )).toBe(true);
    });

    it('소폭 변경은 안전', () => {
        expect(위험변경_여부(
            { session_window_minutes: 15, session_radius_m: 100 },
            { session_window_minutes: 12, session_radius_m: 90 },
        )).toBe(false);
    });
});
```

**Step 6: 커밋**

```bash
git add lib/domain/system-settings/
git commit -m "feat(domain): system-settings 도메인 (validators + 위험변경 정책)"
```

---

## Task 1.5: 마스터 settings 페이지 (`/master/settings/attendance-tuning`)

**Files:**
- Create: `app/master/settings/attendance-tuning/page.tsx` (RSC)
- Create: `app/master/settings/attendance-tuning/actions.ts` (Server Action)
- Create: `app/master/settings/attendance-tuning/_components/AttendanceTuningForm.tsx` (Client)
- Create: `app/master/settings/attendance-tuning/_vm/loadSettingsViewModel.ts`

**Step 1: ViewModel 로더**

```ts
// _vm/loadSettingsViewModel.ts
import { createClient } from '@/lib/supabase/server';
import type { SystemSettings } from '@/lib/domain/system-settings/types';

export interface AttendanceTuningVM {
    settings: SystemSettings;
    history: Array<{
        key: string;
        old_value: unknown;
        new_value: unknown;
        updated_at: string;
        updated_by_name: string | null;
    }>;
}

export async function loadAttendanceTuningVM(): Promise<AttendanceTuningVM> {
    const supabase = await createClient();
    const { data: rows } = await supabase
        .schema('attendance')
        .from('system_settings')
        .select('key,value');
    const { data: hist } = await supabase
        .schema('attendance')
        .from('system_settings_history')
        .select('key,old_value,new_value,updated_at,users:updated_by(name)')
        .order('updated_at', { ascending: false })
        .limit(20);

    const map = Object.fromEntries(
        (rows ?? []).map((r) => [r.key, r.value]),
    ) as Record<string, number>;

    return {
        settings: {
            session_window_minutes: map.session_window_minutes ?? 15,
            session_radius_m: map.session_radius_m ?? 100,
            session_close_minutes: map.session_close_minutes ?? 60,
            auto_label_min_session_count: map.auto_label_min_session_count ?? 5,
        },
        history: (hist ?? []).map((h) => ({
            key: h.key,
            old_value: h.old_value,
            new_value: h.new_value,
            updated_at: h.updated_at,
            updated_by_name: (h.users as any)?.name ?? null,
        })),
    };
}
```

**Step 2: page.tsx (RSC)**

```tsx
// page.tsx
import { loadAttendanceTuningVM } from './_vm/loadSettingsViewModel';
import { AttendanceTuningForm } from './_components/AttendanceTuningForm';

export const metadata = { title: '출석 튜닝' };

export default async function Page() {
    const vm = await loadAttendanceTuningVM();
    return <AttendanceTuningForm vm={vm} />;
}
```

**Step 3: actions.ts**

```ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SystemSettingsSchema } from '@/lib/domain/system-settings/validators';
import { 사용자_컨텍스트_조회 } from '@/lib/access/user-context';

export async function updateAttendanceTuningAction(input: unknown) {
    const ctx = await 사용자_컨텍스트_조회();
    if (!ctx?.isMaster) throw new Error('마스터 권한 필요');
    const parsed = SystemSettingsSchema.parse(input);

    const supabase = await createClient();
    for (const [k, v] of Object.entries(parsed)) {
        const { error } = await supabase
            .schema('attendance')
            .from('system_settings')
            .update({ value: v, updated_by: ctx.userId, updated_at: new Date().toISOString() })
            .eq('key', k);
        if (error) throw new Error(error.message);
    }
    revalidatePath('/master/settings/attendance-tuning');
}
```

**Step 4: Form 컴포넌트**

`AttendanceTuningForm.tsx` — 슬라이더 4개 + Submit + 변경이력 테이블. RunHouse 디자인 토큰 사용 (`bg-rh-bg-surface`, `text-rh-text-primary` 등).

**Step 5: 검증 (수동)**

브라우저에서 `/master/settings/attendance-tuning` 접속 → 슬라이더 변경 → 저장 → 히스토리 갱신 확인.

**Step 6: 커밋**

```bash
git add app/master/settings/attendance-tuning/
git commit -m "feat(master): /settings/attendance-tuning 페이지 — 시스템 튜닝 UI"
```

---

## Task 1.6: 크루 settings 도메인 확장 (`lib/domain/crew-settings/`)

@superpowers:test-driven-development.

**Files:**
- Create: `lib/domain/crew-settings/types.ts`
- Create: `lib/domain/crew-settings/validators.ts` + test
- Create: `lib/domain/crew-settings/policies.ts` + test (시간윈도우_매칭여부)

**Step 1: types**

```ts
export type TimeWindowMode = 'cluster_first' | 'active_hours' | 'anytime';

export interface ActiveHoursSlot {
    day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
    from: string;  // "18:00"
    to: string;    // "22:00"
}

export interface CrewAttendanceSettings {
    time_window_mode: TimeWindowMode;
    active_hours: ActiveHoursSlot[] | null;
    churn_baseline_weeks: number;
    churn_min_baseline_rate: number;
    churn_observation_weeks: number;
    onboarding_window_weeks: number;
    onboarding_min_count: number;
}
```

**Step 2: policies — `시간윈도우_매칭여부`**

```ts
export function 시간윈도우_매칭여부(args: {
    mode: TimeWindowMode;
    activeHours: ActiveHoursSlot[] | null;
    capturedAt: Date;
    recentSessionExistsNearby: boolean;  // cluster_first 모드용
}): boolean {
    if (args.mode === 'anytime') return true;
    if (args.mode === 'cluster_first') return args.recentSessionExistsNearby || _내_활성시간_여부(args.capturedAt, args.activeHours);
    if (args.mode === 'active_hours') return _내_활성시간_여부(args.capturedAt, args.activeHours);
    return false;
}

function _내_활성시간_여부(when: Date, slots: ActiveHoursSlot[] | null): boolean {
    if (!slots || slots.length === 0) return true;  // 슬롯 없으면 제한 없음
    const dayMap = ['sun','mon','tue','wed','thu','fri','sat'] as const;
    const day = dayMap[when.getDay()];
    const hhmm = `${String(when.getHours()).padStart(2,'0')}:${String(when.getMinutes()).padStart(2,'0')}`;
    return slots.some((s) => s.day === day && hhmm >= s.from && hhmm <= s.to);
}
```

**Step 3: 테스트 (3 케이스: anytime, active_hours 안/밖, cluster_first 군집 있음/없음)**

```ts
describe('시간윈도우_매칭여부', () => {
    const tueAt19 = new Date('2026-05-05T19:00:00+09:00');  // 화요일

    it('anytime은 항상 true', () => {
        expect(시간윈도우_매칭여부({
            mode: 'anytime', activeHours: null,
            capturedAt: tueAt19, recentSessionExistsNearby: false,
        })).toBe(true);
    });

    it('active_hours 슬롯 안이면 true', () => {
        expect(시간윈도우_매칭여부({
            mode: 'active_hours',
            activeHours: [{ day: 'tue', from: '18:00', to: '22:00' }],
            capturedAt: tueAt19, recentSessionExistsNearby: false,
        })).toBe(true);
    });

    it('cluster_first에서 근처 세션 있으면 무조건 true', () => {
        expect(시간윈도우_매칭여부({
            mode: 'cluster_first', activeHours: null,
            capturedAt: tueAt19, recentSessionExistsNearby: true,
        })).toBe(true);
    });
});
```

Run: `npx vitest run lib/domain/crew-settings/`
Expected: 3 passed.

**Step 4: 커밋**

```bash
git add lib/domain/crew-settings/
git commit -m "feat(domain): crew-settings — 시간윈도우_매칭여부 정책"
```

---

## Task 1.7: 크루 settings UI 확장

**Files:**
- Modify: `app/admin2/settings/components/SettingsManagement.tsx` (탭 추가)
- Create: `app/admin2/settings/components/tabs/TimeWindowTab.tsx`
- Create: `app/admin2/settings/components/tabs/ChurnRulesTab.tsx`
- Modify: `app/admin2/settings/actions.ts` (액션 추가)

**Step 1: TimeWindowTab.tsx**

`time_window_mode` 라디오(3개) + `active_hours` 요일별 시간대 편집기.

**Step 2: ChurnRulesTab.tsx**

5개 슬라이더 (`churn_baseline_weeks`, `churn_min_baseline_rate`, `churn_observation_weeks`, `onboarding_window_weeks`, `onboarding_min_count`).

**Step 3: actions.ts에 추가**

```ts
export async function updateCrewTimeWindowAction(crewId: string, input: {...}) { ... }
export async function updateCrewChurnRulesAction(crewId: string, input: {...}) { ... }
```

**Step 4: 빌드**

Run: `npm run build`
Expected: pass.

**Step 5: 커밋**

```bash
git add app/admin2/settings/
git commit -m "feat(admin2/settings): 시간윈도우/이탈룰 탭 추가"
```

---

# Phase 2 — 감지 출석 코어

## Task 2.1: `sessions`, `session_members` 테이블

**Files:**
- Create: `supabase/migrations/20260505_0010_attendance_sessions.sql`

**Step 1: 마이그레이션**

```sql
CREATE TABLE attendance.sessions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id      uuid NOT NULL REFERENCES attendance.crews(id) ON DELETE CASCADE,
    started_at   timestamptz NOT NULL,
    ended_at     timestamptz NULL,
    center_lat   double precision NOT NULL,
    center_lng   double precision NOT NULL,
    radius_m     int NOT NULL,
    auto_label   text NULL,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_crew_started
    ON attendance.sessions(crew_id, started_at DESC);
CREATE INDEX idx_sessions_open
    ON attendance.sessions(crew_id) WHERE ended_at IS NULL;

CREATE TABLE attendance.session_members (
    session_id           uuid NOT NULL REFERENCES attendance.sessions(id) ON DELETE CASCADE,
    user_id              uuid NOT NULL REFERENCES attendance.users(id),
    attendance_record_id uuid NOT NULL,
    joined_at            timestamptz NOT NULL,
    PRIMARY KEY (session_id, user_id)
);

CREATE INDEX idx_session_members_user
    ON attendance.session_members(user_id);

-- RLS: 자기 크루 세션만 조회 가능
ALTER TABLE attendance.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.session_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_member_select ON attendance.sessions
    FOR SELECT TO authenticated
    USING (attendance.is_crew_member(crew_id) OR attendance.is_master_admin());

CREATE POLICY session_members_select ON attendance.session_members
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM attendance.sessions s
        WHERE s.id = session_id
          AND (attendance.is_crew_member(s.crew_id) OR attendance.is_master_admin())
    ));

-- 운영진만 직접 수정 가능 (보정 화면용)
CREATE POLICY sessions_admin_modify ON attendance.sessions
    FOR ALL TO authenticated
    USING (attendance.is_crew_admin(crew_id))
    WITH CHECK (attendance.is_crew_admin(crew_id));
```

**Step 2: 적용 + 커밋**

```bash
git add -f supabase/migrations/20260505_0010_attendance_sessions.sql
git commit -m "feat(attendance): sessions/session_members 테이블 + RLS"
```

---

## Task 2.2: `attendance_records` 컬럼 확장

**Files:**
- Create: `supabase/migrations/20260505_0011_attendance_records_session.sql`

**Step 1: 마이그레이션**

```sql
ALTER TABLE attendance.attendance_records
  ADD COLUMN IF NOT EXISTS session_id uuid NULL
      REFERENCES attendance.sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS captured_lat  double precision NULL,
  ADD COLUMN IF NOT EXISTS captured_lng  double precision NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL
      CHECK (status IN ('pending','confirmed','rejected','manual'))
      DEFAULT 'confirmed';

CREATE INDEX IF NOT EXISTS idx_attendance_records_session
    ON attendance.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_crew_captured
    ON attendance.attendance_records(crew_id, attendance_timestamp DESC);
```

**Step 2: 백필 (기존 데이터 status='confirmed'로 충전됨, captured_lat/lng는 NULL 유지)**

기존 `location` 컬럼이 있다면 후속 백필 작업으로 분리. 이번 마이그레이션은 컬럼 추가만.

**Step 3: 커밋**

```bash
git add -f supabase/migrations/20260505_0011_attendance_records_session.sql
git commit -m "feat(attendance): attendance_records에 session_id/status/좌표 컬럼"
```

---

## Task 2.3: 도메인 — 위치/시간 정책 확장 (`lib/domain/attendance/policies.ts`)

@superpowers:test-driven-development.

**Files:**
- Modify: `lib/domain/attendance/policies.ts`
- Modify: `lib/domain/attendance/policies.test.ts`

**Step 1: 추가 함수**

```ts
/**
 * 두 좌표 사이 미터 거리 (Haversine).
 */
export function 좌표거리_미터(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
): number {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sin1 = Math.sin(dLat / 2);
    const sin2 = Math.sin(dLng / 2);
    const c = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(c));
}

/**
 * 출석 좌표가 활성 세션 반경 안인가?
 */
export function 세션귀속_가능여부(
    출석좌표: { lat: number; lng: number },
    세션: { center_lat: number; center_lng: number; radius_m: number },
    임계값_m: number,
): boolean {
    const dist = 좌표거리_미터(
        출석좌표,
        { lat: 세션.center_lat, lng: 세션.center_lng },
    );
    return dist <= 임계값_m;
}
```

**Step 2: 테스트**

```ts
describe('좌표거리_미터', () => {
    it('한강 한 지점에서 100m 떨어진 지점 검증', () => {
        const d = 좌표거리_미터(
            { lat: 37.5172, lng: 126.9920 },
            { lat: 37.5181, lng: 126.9920 },
        );
        expect(d).toBeGreaterThan(95);
        expect(d).toBeLessThan(110);
    });
});

describe('세션귀속_가능여부', () => {
    const 세션 = { center_lat: 37.5172, center_lng: 126.9920, radius_m: 100 };
    it('100m 안 OK', () => {
        expect(세션귀속_가능여부(
            { lat: 37.51725, lng: 126.99205 },
            세션, 100,
        )).toBe(true);
    });
    it('500m 밖 NG', () => {
        expect(세션귀속_가능여부(
            { lat: 37.5300, lng: 126.9920 },
            세션, 100,
        )).toBe(false);
    });
});
```

Run: `npx vitest run lib/domain/attendance/policies.test.ts`
Expected: pass.

**Step 3: 커밋**

```bash
git add lib/domain/attendance/policies.ts lib/domain/attendance/policies.test.ts
git commit -m "feat(domain/attendance): 좌표거리 + 세션귀속 정책 추가"
```

---

## Task 2.4: 도메인 — 클러스터링 워크플로우 (`lib/domain/attendance/workflow.ts`)

**Files:**
- Create: `lib/domain/attendance/workflow.ts`
- Create: `lib/domain/attendance/workflow.test.ts`

**Step 1: 워크플로우 작성**

```ts
import { 좌표거리_미터, 세션귀속_가능여부 } from './policies';

export interface OpenSession {
    id: string;
    center_lat: number;
    center_lng: number;
    radius_m: number;
    last_joined_at: Date;
}

export interface ClusterDecision {
    type: 'attach' | 'create';
    sessionId?: string;
}

/**
 * 들어온 출석 좌표/시각이 어떤 세션에 귀속되는지 결정.
 * - 활성 세션 중 ±window_min + ±radius_m 안에 들어가면 attach
 * - 없으면 create (새 세션)
 */
export function 세션귀속_결정(args: {
    capturedAt: Date;
    capturedLat: number;
    capturedLng: number;
    openSessions: OpenSession[];
    windowMinutes: number;
    radiusM: number;
}): ClusterDecision {
    const windowMs = args.windowMinutes * 60 * 1000;
    const candidates = args.openSessions
        .filter((s) =>
            Math.abs(args.capturedAt.getTime() - s.last_joined_at.getTime())
                <= windowMs,
        )
        .filter((s) => 세션귀속_가능여부(
            { lat: args.capturedLat, lng: args.capturedLng },
            s,
            args.radiusM,
        ))
        // 가장 가까운 세션 선호
        .sort((a, b) =>
            좌표거리_미터(
                { lat: args.capturedLat, lng: args.capturedLng },
                { lat: a.center_lat, lng: a.center_lng },
            ) -
            좌표거리_미터(
                { lat: args.capturedLat, lng: args.capturedLng },
                { lat: b.center_lat, lng: b.center_lng },
            ),
        );

    if (candidates.length > 0) {
        return { type: 'attach', sessionId: candidates[0].id };
    }
    return { type: 'create' };
}
```

**Step 2: 테스트 (5 케이스)**

```ts
import { describe, it, expect } from 'vitest';
import { 세션귀속_결정, type OpenSession } from './workflow';

const baseSession: OpenSession = {
    id: 's1',
    center_lat: 37.5172,
    center_lng: 126.9920,
    radius_m: 100,
    last_joined_at: new Date('2026-05-05T19:00:00Z'),
};

describe('세션귀속_결정', () => {
    it('시간/거리 모두 안이면 attach', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:05:00Z'),
            capturedLat: 37.5172, capturedLng: 126.9920,
            openSessions: [baseSession],
            windowMinutes: 15, radiusM: 100,
        });
        expect(r).toEqual({ type: 'attach', sessionId: 's1' });
    });

    it('시간 밖이면 create', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:30:00Z'),
            capturedLat: 37.5172, capturedLng: 126.9920,
            openSessions: [baseSession],
            windowMinutes: 15, radiusM: 100,
        });
        expect(r.type).toBe('create');
    });

    it('거리 밖이면 create', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:05:00Z'),
            capturedLat: 37.5300, capturedLng: 126.9920,
            openSessions: [baseSession],
            windowMinutes: 15, radiusM: 100,
        });
        expect(r.type).toBe('create');
    });

    it('open 세션 없으면 create', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date(),
            capturedLat: 37.5172, capturedLng: 126.9920,
            openSessions: [],
            windowMinutes: 15, radiusM: 100,
        });
        expect(r.type).toBe('create');
    });

    it('여러 후보 중 가장 가까운 세션 선택', () => {
        const farther: OpenSession = { ...baseSession, id: 's2', center_lat: 37.5180 };
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:05:00Z'),
            capturedLat: 37.5173, capturedLng: 126.9920,
            openSessions: [farther, baseSession],
            windowMinutes: 15, radiusM: 200,
        });
        expect(r.sessionId).toBe('s1');  // baseSession이 더 가까움
    });
});
```

Run: `npx vitest run lib/domain/attendance/workflow.test.ts`
Expected: 5 passed.

**Step 3: 커밋**

```bash
git add lib/domain/attendance/workflow.ts lib/domain/attendance/workflow.test.ts
git commit -m "feat(domain/attendance): 세션귀속_결정 클러스터링 워크플로우"
```

---

## Task 2.5: 출석 등록 RPC 수정 (클러스터링 통합)

**Files:**
- Create: `supabase/migrations/20260505_0012_register_attendance_with_clustering.sql`

**Step 1: 마이그레이션 — RPC 작성**

```sql
CREATE OR REPLACE FUNCTION attendance.register_attendance_v2(
    p_user_id uuid,
    p_crew_id uuid,
    p_captured_at timestamptz,
    p_captured_lat double precision,
    p_captured_lng double precision,
    p_location_id int DEFAULT NULL,
    p_exercise_type_id int DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = attendance, public AS $$
DECLARE
    v_window_min int;
    v_radius_m   int;
    v_session    record;
    v_session_id uuid;
    v_record_id  uuid;
BEGIN
    -- 시스템 settings 로드
    SELECT (value)::int INTO v_window_min
      FROM attendance.system_settings WHERE key = 'session_window_minutes';
    SELECT (value)::int INTO v_radius_m
      FROM attendance.system_settings WHERE key = 'session_radius_m';

    -- 1) 활성 세션 후보 조회 (해당 크루)
    SELECT s.id, s.center_lat, s.center_lng INTO v_session
      FROM attendance.sessions s
     WHERE s.crew_id = p_crew_id
       AND s.ended_at IS NULL
       AND ABS(EXTRACT(EPOCH FROM (p_captured_at - (
             SELECT MAX(joined_at) FROM attendance.session_members
              WHERE session_id = s.id
         )))) <= v_window_min * 60
       AND (
           6371000 * 2 * asin(sqrt(
               sin(radians(s.center_lat - p_captured_lat) / 2) ^ 2
             + cos(radians(p_captured_lat))
             * cos(radians(s.center_lat))
             * sin(radians(s.center_lng - p_captured_lng) / 2) ^ 2
           ))
       ) <= v_radius_m
     ORDER BY 1
     LIMIT 1;

    -- 2) attach or create
    IF v_session.id IS NOT NULL THEN
        v_session_id := v_session.id;
    ELSE
        INSERT INTO attendance.sessions (crew_id, started_at, center_lat, center_lng, radius_m)
        VALUES (p_crew_id, p_captured_at, p_captured_lat, p_captured_lng, v_radius_m)
        RETURNING id INTO v_session_id;
    END IF;

    -- 3) 출석 record 생성
    INSERT INTO attendance.attendance_records
        (user_id, crew_id, attendance_timestamp, location_id, exercise_type_id,
         session_id, captured_lat, captured_lng, status)
    VALUES
        (p_user_id, p_crew_id, p_captured_at, p_location_id, p_exercise_type_id,
         v_session_id, p_captured_lat, p_captured_lng, 'confirmed')
    RETURNING id INTO v_record_id;

    -- 4) session_members 연결
    INSERT INTO attendance.session_members
        (session_id, user_id, attendance_record_id, joined_at)
    VALUES (v_session_id, p_user_id, v_record_id, p_captured_at)
    ON CONFLICT (session_id, user_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'record_id', v_record_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION attendance.register_attendance_v2(
    uuid, uuid, timestamptz, double precision, double precision, int, int
) TO authenticated;
```

**Step 2: 클라이언트 호출 변경**

`app/attendance/actions.ts` (또는 기존 출석 액션) 수정 — 새 RPC 호출. 기존 RPC는 deprecation 마킹.

**Step 3: 통합 검증 (수동)**

브라우저에서 테스트 계정으로 출석 → DB에서 sessions/session_members 채워졌는지 확인.

**Step 4: 커밋 (마이그레이션 + 액션 분리 권장)**

```bash
git add -f supabase/migrations/20260505_0012_register_attendance_with_clustering.sql
git commit -m "feat(attendance): register_attendance_v2 RPC — 자동 클러스터링"

git add app/attendance/actions.ts
git commit -m "feat(attendance): 출석 액션에 v2 RPC 연동"
```

---

## Task 2.6: 세션 자동 종료 cron

**Files:**
- Create: `supabase/migrations/20260505_0013_session_auto_close.sql`

**Step 1: 마이그레이션**

```sql
-- 마지막 joined_at 기준 N분 경과 시 ended_at 채움
CREATE OR REPLACE FUNCTION attendance.close_idle_sessions()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = attendance, public AS $$
DECLARE
    v_minutes int;
    v_count int;
BEGIN
    SELECT (value)::int INTO v_minutes
      FROM attendance.system_settings
     WHERE key = 'session_close_minutes';

    UPDATE attendance.sessions s
       SET ended_at = now()
     WHERE ended_at IS NULL
       AND COALESCE(
           (SELECT MAX(joined_at) FROM attendance.session_members
             WHERE session_id = s.id),
           s.started_at
       ) < now() - make_interval(mins => v_minutes);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- pg_cron으로 5분마다 실행
SELECT cron.schedule(
    'attendance-close-idle-sessions',
    '*/5 * * * *',
    $$SELECT attendance.close_idle_sessions()$$
);
```

**Step 2: 검증**

```sql
SELECT * FROM cron.job WHERE jobname = 'attendance-close-idle-sessions';
SELECT attendance.close_idle_sessions();  -- 수동 실행
```

**Step 3: 커밋**

```bash
git add -f supabase/migrations/20260505_0013_session_auto_close.sql
git commit -m "feat(attendance): 세션 자동 종료 cron (close_idle_sessions)"
```

---

# Phase 3 — 운영진 보정 화면

## Task 3.1: `session_audit_log` 테이블

**Files:**
- Create: `supabase/migrations/20260505_0020_session_audit_log.sql`

```sql
CREATE TABLE attendance.session_audit_log (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     uuid NULL REFERENCES attendance.sessions(id) ON DELETE SET NULL,
    crew_id        uuid NOT NULL,
    admin_id       uuid NOT NULL REFERENCES attendance.users(id),
    action         text NOT NULL CHECK (action IN ('add','remove','relabel','delete_session')),
    target_user_id uuid NULL,
    before_state   jsonb,
    after_state    jsonb,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_audit_log_session ON attendance.session_audit_log(session_id);
CREATE INDEX idx_session_audit_log_crew    ON attendance.session_audit_log(crew_id, created_at DESC);

ALTER TABLE attendance.session_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY session_audit_admin_select ON attendance.session_audit_log
    FOR SELECT TO authenticated
    USING (attendance.is_crew_admin(crew_id) OR attendance.is_master_admin());
```

```bash
git add -f supabase/migrations/20260505_0020_session_audit_log.sql
git commit -m "feat(attendance): session_audit_log 테이블"
```

---

## Task 3.2: 보정 도메인 (`lib/domain/session-correction/`)

**Files:**
- Create: `lib/domain/session-correction/policies.ts` + test
- Create: `lib/domain/session-correction/messages.ts` + test

**Step 1: policies — `보정가능한가`**

```ts
export function 보정가능한가(args: {
    isAdmin: boolean;
    sessionEnded: boolean;
}): boolean {
    return args.isAdmin;  // 종료 여부와 관계없이 운영진은 항상 보정 가능
}
```

**Step 2: messages — 푸시 템플릿**

```ts
export function 세션종료_푸시조립(args: {
    label: string | null;
    memberCount: number;
}): { title: string; body: string } {
    return {
        title: `${args.label ?? '모임'} 종료`,
        body: `${args.memberCount}명 출석 완료`,
    };
}
```

**Step 3: 테스트 + 커밋**

```bash
git add lib/domain/session-correction/
git commit -m "feat(domain): session-correction — 보정 정책/메시지"
```

---

## Task 3.3: 서버 액션 — 보정 4종

**Files:**
- Create: `app/admin2/attendance/sessions/actions.ts`

```ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { 사용자_컨텍스트_조회 } from '@/lib/access/user-context';

async function _크루관리자_검증(crewId: string) {
    const ctx = await 사용자_컨텍스트_조회();
    if (!ctx) throw new Error('인증 필요');
    if (!ctx.adminCrewIds?.includes(crewId)) throw new Error('권한 없음');
    return ctx;
}

export async function removeAttendanceFromSessionAction(
    sessionId: string, crewId: string, recordId: string,
) {
    const ctx = await _크루관리자_검증(crewId);
    const supabase = await createClient();
    // ... soft delete + audit log INSERT
    revalidatePath(`/admin2/attendance/sessions/${sessionId}`);
}

export async function addAttendanceToSessionAction(
    sessionId: string, crewId: string, userId: string,
) { ... }

export async function relabelSessionAction(
    sessionId: string, crewId: string, label: string,
) { ... }

export async function deleteSessionAction(
    sessionId: string, crewId: string,
) { ... }
```

각 액션은:
1. 권한 검증
2. DB 변경 (트랜잭션)
3. `session_audit_log` INSERT
4. revalidatePath

```bash
git add app/admin2/attendance/sessions/actions.ts
git commit -m "feat(admin2): 세션 보정 서버 액션 4종"
```

---

## Task 3.4: 세션 목록 페이지 (`/admin2/attendance/sessions`)

**Files:**
- Create: `app/admin2/attendance/sessions/page.tsx`
- Create: `app/admin2/attendance/sessions/_vm/loadSessionListVM.ts`
- Create: `app/admin2/attendance/sessions/_components/SessionList.tsx`

ViewModel: 페이지네이션 + 필터 (기간, 라벨, 인원). `AnimatedList` + `AnimatedItem` 사용.

```bash
git commit -m "feat(admin2/attendance): 세션 목록 페이지"
```

---

## Task 3.5: 세션 보정 페이지 (`/admin2/attendance/sessions/[id]`)

**Files:**
- Create: `app/admin2/attendance/sessions/[id]/page.tsx`
- Create: `app/admin2/attendance/sessions/[id]/_vm/loadSessionDetailVM.ts`
- Create: `app/admin2/attendance/sessions/[id]/_components/SessionCorrectionPanel.tsx`
- Create: `app/admin2/attendance/sessions/[id]/_components/MemberSearchDialog.tsx`

화면: 디자인 doc §4.3 그대로.
- 상단 헤더 (라벨/일시/인원)
- 출석자 목록 (1탭 제거 + Undo 토스트)
- 멤버 추가 다이얼로그 (검색 → 1탭)
- 라벨 수정 모달
- 세션 삭제 확인

```bash
git commit -m "feat(admin2/attendance): 세션 보정 페이지"
```

---

## Task 3.6: 라벨 자동 추천 + 종료 푸시

**Files:**
- Create: `supabase/migrations/20260505_0021_session_close_notify.sql`

**Step 1: 라벨 자동 추천 함수**

```sql
CREATE OR REPLACE FUNCTION attendance.suggest_session_label(p_session_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = attendance, public AS $$
DECLARE
    v_min int;
    v_label text;
BEGIN
    SELECT (value)::int INTO v_min
      FROM attendance.system_settings WHERE key = 'auto_label_min_session_count';

    -- 같은 좌표 ±100m에서 N회 이상 발생한 라벨 중 가장 흔한 것
    SELECT s.auto_label INTO v_label
      FROM attendance.sessions s
     WHERE s.crew_id = (SELECT crew_id FROM attendance.sessions WHERE id = p_session_id)
       AND s.id <> p_session_id
       AND s.auto_label IS NOT NULL
       AND 6371000 * 2 * asin(sqrt(
             sin(radians(s.center_lat - (SELECT center_lat FROM attendance.sessions WHERE id = p_session_id)) / 2) ^ 2
           + cos(radians(s.center_lat)) * cos(radians((SELECT center_lat FROM attendance.sessions WHERE id = p_session_id)))
           * sin(radians(s.center_lng - (SELECT center_lng FROM attendance.sessions WHERE id = p_session_id)) / 2) ^ 2
         )) <= 100
     GROUP BY s.auto_label
    HAVING COUNT(*) >= v_min
     ORDER BY COUNT(*) DESC
     LIMIT 1;

    RETURN v_label;
END;
$$;
```

**Step 2: 종료 시 자동 라벨 + 푸시 트리거**

`close_idle_sessions()` 확장 — 종료 시 라벨이 NULL이면 추천값으로 채우고, 운영진에게 push.

(푸시는 기존 푸시 시스템 함수 호출. 푸시 시스템 미구현이면 이 단계에서 skip + TODO 주석.)

```bash
git commit -m "feat(attendance): 라벨 자동 추천 + 세션 종료 푸시"
```

---

# Phase 4 — 크루 헬스 대시보드

## Task 4.1: 일별 집계 테이블

**Files:**
- Create: `supabase/migrations/20260505_0030_crew_health_daily.sql`

```sql
CREATE TABLE attendance.crew_health_daily (
    date              date NOT NULL,
    crew_id           uuid NOT NULL REFERENCES attendance.crews(id) ON DELETE CASCADE,
    wau               int NOT NULL DEFAULT 0,
    mau               int NOT NULL DEFAULT 0,
    session_count     int NOT NULL DEFAULT 0,
    attendance_count  int NOT NULL DEFAULT 0,
    active_member_ids uuid[] NOT NULL DEFAULT '{}',
    PRIMARY KEY (date, crew_id)
);

CREATE TABLE attendance.member_activity_daily (
    date     date NOT NULL,
    user_id  uuid NOT NULL,
    crew_id  uuid NOT NULL,
    attended boolean NOT NULL,
    PRIMARY KEY (date, user_id, crew_id)
);

CREATE INDEX idx_member_activity_user_date
    ON attendance.member_activity_daily(user_id, date DESC);
CREATE INDEX idx_member_activity_crew_date
    ON attendance.member_activity_daily(crew_id, date DESC);

ALTER TABLE attendance.crew_health_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.member_activity_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY crew_health_admin_select ON attendance.crew_health_daily
    FOR SELECT TO authenticated
    USING (attendance.is_crew_admin(crew_id) OR attendance.is_master_admin());

CREATE POLICY member_activity_admin_select ON attendance.member_activity_daily
    FOR SELECT TO authenticated
    USING (attendance.is_crew_admin(crew_id) OR attendance.is_master_admin());
```

```bash
git commit -m "feat(attendance): crew_health_daily/member_activity_daily 테이블"
```

---

## Task 4.2: 일별 집계 cron

**Files:**
- Create: `supabase/migrations/20260505_0031_aggregate_crew_health.sql`

```sql
CREATE OR REPLACE FUNCTION attendance.aggregate_crew_health(p_date date DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = attendance, public AS $$
BEGIN
    -- member_activity_daily
    INSERT INTO attendance.member_activity_daily (date, user_id, crew_id, attended)
    SELECT p_date, ar.user_id, ar.crew_id, true
      FROM attendance.attendance_records ar
     WHERE ar.attendance_timestamp::date = p_date
       AND ar.status IN ('confirmed','manual')
    GROUP BY ar.user_id, ar.crew_id
    ON CONFLICT (date, user_id, crew_id) DO UPDATE SET attended = true;

    -- crew_health_daily (WAU = 최근 7일 active, MAU = 최근 30일)
    INSERT INTO attendance.crew_health_daily
        (date, crew_id, wau, mau, session_count, attendance_count, active_member_ids)
    SELECT
        p_date,
        c.id,
        COUNT(DISTINCT mad7.user_id),
        COUNT(DISTINCT mad30.user_id),
        (SELECT COUNT(*) FROM attendance.sessions s
          WHERE s.crew_id = c.id AND s.started_at::date = p_date),
        (SELECT COUNT(*) FROM attendance.attendance_records ar
          WHERE ar.crew_id = c.id
            AND ar.attendance_timestamp::date = p_date
            AND ar.status IN ('confirmed','manual')),
        ARRAY(SELECT DISTINCT user_id FROM attendance.member_activity_daily
               WHERE crew_id = c.id AND date = p_date)
      FROM attendance.crews c
      LEFT JOIN attendance.member_activity_daily mad7
        ON mad7.crew_id = c.id AND mad7.date BETWEEN p_date - 6 AND p_date
      LEFT JOIN attendance.member_activity_daily mad30
        ON mad30.crew_id = c.id AND mad30.date BETWEEN p_date - 29 AND p_date
     GROUP BY c.id
    ON CONFLICT (date, crew_id) DO UPDATE SET
        wau = EXCLUDED.wau,
        mau = EXCLUDED.mau,
        session_count = EXCLUDED.session_count,
        attendance_count = EXCLUDED.attendance_count,
        active_member_ids = EXCLUDED.active_member_ids;
END;
$$;

SELECT cron.schedule(
    'attendance-aggregate-daily',
    '5 0 * * *',  -- 매일 00:05 UTC = 09:05 KST
    $$SELECT attendance.aggregate_crew_health()$$
);
```

```bash
git commit -m "feat(attendance): 일별 집계 cron (aggregate_crew_health)"
```

---

## Task 4.3: 도메인 — `lib/domain/crew-health/`

@superpowers:test-driven-development.

**Files:**
- Create: `lib/domain/crew-health/policies.ts` + test (`이탈위험인가`, `온보딩위험인가`)
- Create: `lib/domain/crew-health/types.ts`

**Step 1: policies**

```ts
export function 이탈위험인가(args: {
    baselineWeeks: number;
    minBaselineRate: number;
    observationWeeks: number;
    weeklyAttendanceCounts: number[];  // 가장 최근 주가 [0]
}): boolean {
    const { baselineWeeks, minBaselineRate, observationWeeks, weeklyAttendanceCounts } = args;
    const baseline = weeklyAttendanceCounts.slice(observationWeeks, observationWeeks + baselineWeeks);
    if (baseline.length < baselineWeeks) return false;  // 데이터 부족
    const baselineRate = baseline.filter((c) => c > 0).length / baseline.length;
    if (baselineRate < minBaselineRate) return false;
    const observation = weeklyAttendanceCounts.slice(0, observationWeeks);
    return observation.every((c) => c === 0);
}

export function 온보딩위험인가(args: {
    weeksSinceJoined: number;
    onboardingWindowWeeks: number;
    onboardingMinCount: number;
    attendanceCount: number;
}): boolean {
    if (args.weeksSinceJoined < 2) return false;  // 너무 이름
    if (args.weeksSinceJoined > args.onboardingWindowWeeks) return false;  // 윈도우 지남
    return args.attendanceCount < args.onboardingMinCount;
}
```

**Step 2: 테스트 (각 함수 3+ 케이스)**

```bash
git commit -m "feat(domain/crew-health): 이탈/온보딩 위험 정책"
```

---

## Task 4.4: `/admin2/analyze` 확장

**Files:**
- Modify: `app/admin2/analyze/page.tsx`
- Create: `app/admin2/analyze/_vm/loadHealthDashboardVM.ts`
- Create: `app/admin2/analyze/_components/KpiCards.tsx`
- Create: `app/admin2/analyze/_components/AttendanceHeatmap.tsx`
- Create: `app/admin2/analyze/_components/LocationLeaderboard.tsx`
- Create: `app/admin2/analyze/_components/MemberPatternList.tsx`
- Create: `app/admin2/analyze/_components/ChurnRiskBanner.tsx`

ViewModel: `crew_health_daily` + `member_activity_daily` + `sessions` 조합.

```bash
git commit -m "feat(admin2/analyze): 크루 헬스 대시보드 (KPI/히트맵/위치/멤버/이탈)"
```

---

## Task 4.5: 이탈/온보딩 알림 cron + 푸시

**Files:**
- Create: `supabase/migrations/20260505_0032_health_alerts.sql`

```sql
CREATE OR REPLACE FUNCTION attendance.send_churn_risk_alerts()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = attendance, public AS $$
DECLARE
    v_count int := 0;
BEGIN
    -- 각 크루별로 이탈 위험 멤버 수 계산 → 운영진에게 푸시
    -- (실제 푸시 호출은 push 시스템 함수 사용)
    -- ...
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION attendance.send_onboarding_risk_alerts()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER ... AS $$ ... $$;

-- 매주 월요일 09:00 KST = 00:00 UTC
SELECT cron.schedule('attendance-churn-alerts', '0 0 * * 1',
    $$SELECT attendance.send_churn_risk_alerts()$$);

-- 매일 09:00 KST = 00:00 UTC
SELECT cron.schedule('attendance-onboarding-alerts', '0 0 * * *',
    $$SELECT attendance.send_onboarding_risk_alerts()$$);
```

```bash
git commit -m "feat(attendance): 이탈/온보딩 알림 cron"
```

---

# 검증 체크리스트 (전체 완료 후)

- [ ] `npm run build` 통과 (lint + typecheck + check:bff + vitest + next build)
- [ ] 모든 도메인 함수 1:1 vitest 테스트 존재
- [ ] 마이그레이션 13개 적용 + 롤백 가능 확인
- [ ] RLS 정책 활성화 — 비인가 접근 차단 확인
- [ ] 마스터 settings 변경 → 다음 출석부터 즉시 반영
- [ ] 크루 settings 변경 → 다음 출석부터 즉시 반영
- [ ] 출석 1탭 → 세션 자동 생성/귀속 확인 (수동 시나리오)
- [ ] 60분(또는 settings값) 후 세션 자동 종료 확인
- [ ] 보정 화면에서 1탭 추가/제거 + audit log 기록 확인
- [ ] `/admin2/analyze` KPI/히트맵/이탈/온보딩 카드 렌더링 확인
- [ ] 모바일 viewport에서 모든 신규 페이지 정상 동작 확인

---

# 의존성 그래프

```
Phase 1 (settings) ──────┐
                          ├─→ Phase 2 (코어)
                          │     │
                          │     ├─→ Phase 3 (보정)
                          │     │
                          │     └─→ Phase 4 (대시보드)
                          │
                          └─ (Phase 4도 settings 사용)
```

Phase 1 → Phase 2 → (Phase 3, Phase 4 병렬 가능)

---

## 변경 이력
| 날짜 | 변경 | 사유 |
|------|------|------|
| 2026-05-05 | 초안 작성 | design doc 기반 구현 계획 |
