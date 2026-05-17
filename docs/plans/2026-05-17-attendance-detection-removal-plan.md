# 감지 기반 출석 고도화 제거 계획

- 작성일: 2026-05-17
- 작성자: planning agent (Phase 2)
- 브랜치: `feat/dev-test-auth` (origin 대비 52 커밋 앞섬)
- 관련 매핑(Phase 1): 본 문서 "배경" 섹션 + 인라인 인용
- 관련 원본 설계: `docs/plans/2026-05-05-attendance-detection-design.md`, `docs/plans/2026-05-05-attendance-detection-plan.md`

---

## 1. 목표 & 비목표

### 목표
2026-05-05 ~ 2026-05-09 사이에 머지된 "감지 기반 출석 고도화"(자동 클러스터링, 세션 보정, 크루 헬스 대시보드, 이탈/온보딩 위험 알림, 마스터 출석 튜닝) 전체를 제거하고, **사용자가 폼에 location/exercise/host를 선택해 등록 → attendance_records에 1행 INSERT → 운영진에게 푸시 알림 발송** 만 남는 단순 출석 플로우로 회귀한다. 운영 DB는 해당 마이그레이션을 적용한 적이 없으므로(운영은 `20260502_0002_recent_active_meet_rpc`에서 멈춤) 코드 + 개발 DB 롤백만 수행하면 된다.

### 비목표
- attendance_records의 기존 칼럼 중 단순 출석에 필요한 것(`location`, `exercise_type_id`, `is_host`, `attendance_timestamp`, `crew_id`, `user_id`)은 **건들지 않는다**.
- `app/admin2/analyze/` 하위 중 **기존 통계(YearMonthSelector, DayBarChart, PlaceBarChart, OverallCard, day-detail, place-detail, overall-detail)**는 **유지**한다. Phase 1 매핑 "analyze 전체"는 부정확 — 실제 제거 대상은 **헬스 대시보드 서브시스템**(`_components/*`, `_vm/loadHealthDashboardVM.ts`, `analyze/page.tsx`의 `HealthDashboardServer` 섹션)만이다.
- 푸시 알림 인프라(`/lib/push/send-notification`, `sendNotification`)는 단순 출석 통보용으로 그대로 사용한다.
- 단체 사진 합성, RLS, 마스터 어드민 기타 기능은 전혀 손대지 않는다.
- 운영 DB(`sazfajslhnvzhpaianhl`)에 어떠한 SQL도 직접 실행하지 않는다.

---

## 2. 제거 후 살아남는 출석 흐름

```
[클라이언트]
  ClientAttendancePage
    └ 폼: date/time/location/exerciseType/isHost
    └ submit → submitAttendance(form)
        (GPS 캡처 제거, capturedLat/Lng 제거)

[서버 액션: app/attendance/actions.ts]
  submitAttendance(input)
    1) attendanceSubmissionSchema 검증 (capturedLat/Lng 필드 제외)
    2) 출석정책.유효한가() — 시간 범위 검증
    3) 사용자_컨텍스트_조회 + access policy guard
    4) crew_exercise_types 화이트리스트 확인
    5) crews(allow_unregistered_location, location_based_attendance) 조회
    6) locationId === 'unregistered' OR crew_locations 조회 (기존 그대로)
    7) supabase.from('attendance_records').insert({
          user_id, crew_id, attendance_timestamp,
          location, exercise_type_id, is_host,
          location_id /* 유지 결정 시 */
       })
    8) waitUntil(...): 운영진 푸시 + PostHog
    9) revalidatePath('/attendance')

[DB]
  attendance_records 단일 INSERT (RPC 없음)
```

핵심 변경:
- `register_attendance_v2` RPC 호출 → 단순 `insert()` 로 대체.
- 클라이언트 navigator.geolocation 호출 제거.
- `session_id / captured_lat / captured_lng / status` 컬럼 미사용.

---

## 3. 경계 판정 권장안

### 3-1. `attendance_records.location_id` 유지 vs 제거

**권장: 유지 (커밋 `f00590f3` 으로 추가된 컬럼을 그대로 둔다)**

근거:
- 이 컬럼은 2026-05-16에 별도 커밋 `fix(attendance): attendance_records.location_id 컬럼 추가 마이그레이션`으로 들어왔고, **단순 출석에서도 의미가 있는 정규화**다. 기존 `location text` 필드는 미등록 장소 출석을 표현하기 위해 남기되, 등록된 장소의 경우 `location_id` FK도 함께 INSERT하면 통계 페이지(`analyze/place-detail`)가 향후 이름 변경/오타에 강해진다.
- `ON DELETE SET NULL` 정책이라 운영 부담이 없다.
- 제거하려면 (a) 마이그레이션 추가, (b) 단순 출석 INSERT에서 location_id를 빼야 하는데, **잃을 게 없는데 굳이 빼지 않는다**.
- 운영 DB에는 아직 적용되지 않은 상태이므로(20260516_0001 가 운영 push가 안 됨), 단순 출석 코드에서 INSERT 시 location_id를 함께 넣으면 dev/prod 양쪽 모두 정상 동작한다 (운영은 컬럼이 없으니 마이그레이션을 prod에 별도 push해야 함 — 7번 섹션 참조).

### 3-2. `register_attendance_v2` 대체 전략

**권장: RPC를 추가/대체하지 않고, server action에서 직접 `insert()` 한다 (코드 인라인).**

근거:
- 단순 INSERT는 RPC로 감싸야 할 비즈니스 룰이 없다 (검증/권한은 이미 server action 4단계 BFF 룰의 `actions.ts`에 있다).
- v3 추가 → 잉여 마이그레이션 파일이 또 생기고, 향후 누군가 같은 실수("RPC가 있으니 비즈니스 룰을 DB에 넣자")를 반복할 가능성.
- 기존 v1 함수는 git log에 흔적이 없어 복원할 안전한 베이스가 없다.
- `register_attendance_v2` 자체는 down 마이그레이션에서 `DROP FUNCTION` 으로 제거.

### 3-3. 마이그레이션 파일 12개 처리

**권장: 12개 SQL 파일은 그대로 두고, 단일 새 down 마이그레이션(`20260517_0001_drop_attendance_detection.sql`) 추가.**

근거:
- 마이그레이션은 append-only 이력이라는 게 Supabase/Postgres 마이그레이션의 일반 원칙. 이미 dev DB는 12개를 모두 적용한 상태이므로 git에서 파일을 지워도 dev DB의 schema는 그대로다 → 일관성이 깨진다.
- 운영 DB는 아직 미적용 → 새 down 마이그레이션이 떨어져도 NOOP (CREATE … IF NOT EXISTS 후 DROP) 이므로 운영 push 시 안전.
- `git rm` 옵션을 채택하면 dev DB schema 진실값과 git 마이그레이션 폴더의 불일치 발생 + 코드 리뷰에서 12개 diff가 한꺼번에 보여 노이즈가 커진다.
- 단, `supabase/migrations/20260516_0001_attendance_records_location_id.sql` (location_id 추가) 는 단순 출석에서도 사용하므로 **유지**.

새 down 마이그레이션의 책임:
1. pg_cron job(`close_idle_sessions`, `aggregate_crew_health`, `send_churn_risk_alerts`, `send_onboarding_risk_alerts`) unschedule.
2. 함수 DROP: `register_attendance_v2`, `close_idle_sessions`, `aggregate_crew_health`, `send_churn_risk_alerts`, `send_onboarding_risk_alerts`, `suggest_session_label`, `notify_session_closed`, `get_churn_risk_user_ids`, `get_onboarding_risk_user_ids`, 그리고 `0002_system_settings_history.sql`에서 만든 트리거/함수.
3. 테이블 DROP (CASCADE 순서 안전):
   - attendance.member_activity_daily
   - attendance.crew_health_daily
   - attendance.session_audit_log
   - attendance.session_members
   - attendance.sessions
   - attendance.system_settings_history
   - attendance.system_settings
4. attendance_records 컬럼 DROP: `session_id`, `captured_lat`, `captured_lng`, `status`. **`location_id`는 유지**.
5. crews 컬럼 DROP: `time_window_mode`, `active_hours`, `churn_baseline_weeks`, `churn_min_baseline_rate`, `churn_observation_weeks`, `onboarding_window_weeks`, `onboarding_min_count`.
6. 인덱스 DROP: `idx_attendance_records_session`, 기타 0011/0010에서 만든 인덱스 (테이블 DROP 시 자동 정리되지만 attendance_records의 인덱스는 명시 DROP 필요).
7. 모든 단계 `IF EXISTS` + `BEGIN; … COMMIT;` 으로 wrap.

---

## 4. 실행 순서 (의존성 역순)

PR 단위는 작은 4개로 나누되, 1인 개발자 환경에서 PR을 안 만들고 직접 머지하는 경우 **커밋 단위는 아래 sub-task 그대로** 유지한다.

### Step 0. 안전망

먼저 `npm run env:dev` 로 dev 환경 활성화 확인.

### Step 1. UI / 페이지 / 어드민 진입점 제거 (의존성 leaf)

**1-1. admin2 analyze 헬스 대시보드 부분 제거**
- 삭제: `_components/{AttendanceHeatmap,ChurnRiskBanner,KpiCards,LocationLeaderboard,MemberPatternList}.tsx`, `_vm/loadHealthDashboardVM.ts`
- 수정: `app/admin2/analyze/page.tsx` 에서 HealthDashboardServer 섹션 + 관련 import 제거. **AnalyticsChartsServer, YearMonthSelector, DayBarChart, PlaceBarChart, OverallCard 는 유지**.
- 검증: `rg "loadHealthDashboardVM|HealthDashboardServer|KpiCards|AttendanceHeatmap|ChurnRiskBanner|LocationLeaderboard|MemberPatternList" app components lib` → 0건
- 커밋: `chore(admin2/analyze): 크루 헬스 대시보드 섹션 제거 (감지 기반 출석 회귀)`

**1-2. admin2 세션 보정 페이지 제거**
- 삭제: `app/admin2/attendance/sessions/` 전체
- 검증: `rg "/admin2/attendance/sessions" app components` → 0건
- 커밋: `chore(admin2/attendance): 세션 목록/보정 페이지 제거`

**1-3. admin2 settings 시간윈도우/이탈룰 탭 제거**
- 삭제: `app/admin2/settings/components/tabs/{TimeWindowTab,ChurnRulesTab}.tsx`
- 수정: `SettingsManagement.tsx`, `settings/page.tsx`, `settings/actions.ts` 에서 관련 import / TABS / props / 액션 제거
- 커밋: `chore(admin2/settings): 시간윈도우/이탈룰 탭과 액션 제거`

**1-4. master 출석 튜닝 페이지 제거**
- 삭제: `app/master/settings/attendance-tuning/` 전체
- 커밋: `chore(master/settings): 출석 튜닝 페이지 제거`

### Step 2. 도메인 모듈 제거

`check:bff` 가 .ts ↔ .test.ts 1:1 강제하므로 함께 삭제.

**2-1. lib/domain/crew-health 제거** — 커밋: `chore(domain/crew-health): 도메인 모듈 제거`
**2-2. lib/domain/session-correction 제거** — 커밋: `chore(domain/session-correction): 도메인 모듈 제거`
**2-3. lib/domain/system-settings 제거** — 커밋: `chore(domain/system-settings): 도메인 모듈 제거`
**2-4. lib/domain/attendance/workflow 제거** — 커밋: `chore(domain/attendance): 세션귀속_결정 workflow 제거`
**2-5. lib/domain/crew-settings 정리** (전체 삭제. types/validators 전부 제거되면 디렉토리째 삭제) — 커밋: `chore(domain/crew-settings): 시간윈도우/이탈룰 타입과 검증 제거`

### Step 3. 출석 핵심 흐름 정리

**3-1. attendanceSchema에서 capturedLat/Lng 제거** — 커밋: `refactor(validators/attendance): capturedLat/Lng 필드 제거`
**3-2. ClientAttendancePage에서 GPS 캡처 제거** — 커밋: `refactor(attendance): 클라이언트 GPS 캡처 제거`
**3-3. submitAttendance를 단순 INSERT로 교체**:
```ts
const insertPayload = {
    user_id: userId, crew_id: crewId,
    attendance_timestamp: attendanceTimestamp,
    location: locationName,
    location_id: typeof locationId === 'number' ? locationId : null,
    exercise_type_id: exerciseTypeId, is_host: isHost,
};
const { data: inserted, error } = await supabase
    .schema('attendance').from('attendance_records')
    .insert(insertPayload).select('id, user_id, crew_id').single();
```
커밋: `refactor(attendance/actions): RPC 클러스터링 제거 → 단순 INSERT`

### Step 4. DB 롤백 마이그레이션 작성 + dev 적용

**4-1. 신규 파일** `supabase/migrations/20260517_0001_drop_attendance_detection.sql`:
- BEGIN ... COMMIT 래핑
- pg_cron unschedule (4 jobs)
- 함수 DROP (10개)
- attendance_records 컬럼 DROP (session_id, captured_lat, captured_lng, status — **location_id 유지**)
- 테이블 DROP (자식→부모: member_activity_daily, crew_health_daily, session_audit_log, session_members, sessions, system_settings_history, system_settings)
- crews 컬럼 DROP (7개)
- 인덱스 DROP

**4-2. dev DB에 적용**: Supabase MCP `apply_migration` 또는 `supabase db push`. **운영 DB는 절대 적용 금지.**

**4-3. 검증 쿼리** (모두 0행 반환되어야 함, 단 location_id는 1행):
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='attendance' AND table_name IN ('sessions','session_members','session_audit_log','crew_health_daily','member_activity_daily','system_settings','system_settings_history');
SELECT column_name FROM information_schema.columns WHERE table_schema='attendance' AND table_name='attendance_records' AND column_name IN ('session_id','captured_lat','captured_lng','status');
SELECT column_name FROM information_schema.columns WHERE table_schema='attendance' AND table_name='attendance_records' AND column_name='location_id'; -- 살아있어야 함
```
커밋: `chore(supabase/migrations): 감지 기반 출석 스키마/함수/cron 일괄 DROP`

### Step 5. 기존 12개 마이그레이션 파일 처리

**그대로 유지** (3-3 결정 참조). 추가 작업 없음.

### Step 6. 문서 정리

`docs/plans/archive/2026-05-removed-attendance-detection/` 디렉토리로 이동:
- `docs/plans/2026-05-05-attendance-detection-design.md`
- `docs/plans/2026-05-05-attendance-detection-plan.md`
- `docs/policies/attendance-detection-operations.md`

`docs/plans/2026-05-17-attendance-detection-removal-plan.md` (본 문서) 추가.

`CLAUDE.md` 에서 "감지 기반 출석" 관련 언급 grep 후 제거.

커밋: `docs: 감지 기반 출석 설계/운영 문서 아카이브 + 제거 계획 추가`

### Step 7. 빌드 + 회귀 검증

```bash
npm run check:bff && npm run check:rls && npm run test && npm run lint && npm run typecheck && npm run build
```

**수동 회귀 (dev 환경)**:
1. `npm run dev:dev` → `/attendance` 폼 등록 → 토스트 + DB INSERT 확인
2. `/admin2/attendance` 캘린더 정상
3. `/admin2/analyze` 기존 차트 정상 (헬스 대시보드 부재)
4. `/admin2/settings` 탭 3개(장소/운영진/초대코드)만 표시
5. 운영진 푸시 도착 확인

---

## 5. 위험 / 함정

| # | 위험 | 대응 |
|---|---|---|
| 1 | `analyze/page.tsx` 통째 삭제하면 기존 통계 사라짐 | Step 1-1 에서 헬스 대시보드 섹션만 제거. `analyze/components/*`, `analyze/{day,place,overall}-detail/*` 유지 |
| 2 | `analyze/components/YearMonthSelector` 가 UltraFastRankingTemplate 등 6곳에서 import | 절대 삭제 금지. 언더스코어 `analyze/_components/` 만 삭제 |
| 3 | 운영 DB에 `location_id` 컬럼 없음 → INSERT 시 42703 | 운영 push 전 `20260516_0001_attendance_records_location_id.sql` 운영에 먼저 적용 |
| 4 | system_settings_history 트리거 함수 이름 불확실 | down 마이그레이션 작성 전 `20260505_0002_*.sql` 원문 확인 후 정확한 이름 사용 |
| 5 | `check:rls` 가 잔존 RLS OFF 테이블 발견 시 fail | Step 4 (drop) → Step 7 (빌드) 순서 유지 |
| 6 | `CrewAttendanceSettings` 가 dynamic import 될 가능성 | typecheck + build 통과로 확인 |
| 7 | offline 큐 데이터에 capturedLat/Lng 없는지 | 확인 완료. `useOfflineAttendance` 변경 불요 |
| 10 | git branch origin 52 커밋 앞섬 → push 충돌 | 1인 dev 면 `--force-with-lease` |

---

## 6. 검증 체크리스트

- [ ] `npm run check:bff` 통과
- [ ] `npm run check:rls` 통과
- [ ] `npm run test` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run typecheck` 통과
- [ ] `npm run build` 통과
- [ ] `rg "register_attendance_v2|session_id|captured_lat|captured_lng|crew_health_daily|member_activity_daily|session_audit_log|attendance\.system_settings|time_window_mode|churn_baseline|onboarding_window|attendance\.sessions|session_members"` → 새 down 마이그레이션 외 0건
- [ ] dev DB SQL 검증 쿼리 (Step 4-3) 모두 0행 (location_id 제외)
- [ ] `/attendance` 폼 등록 수동 회귀 PASS
- [ ] `/admin2/attendance` 정상 PASS
- [ ] `/admin2/analyze` 기존 차트 정상 PASS
- [ ] `/admin2/settings` 3개 탭만 PASS
- [ ] 운영진 푸시 도착 PASS

---

## 7. 운영 DB 후속 작업 메모

본 PR은 운영 DB schema에 영향 없음 (운영은 0505 마이그레이션 미적용). 운영 push 시점에 운영 DB에 다음만 별도 적용:

```
supabase/migrations/20260516_0001_attendance_records_location_id.sql
```

운영 DB에 절대 적용 금지:
- `20260505_0001` ~ `20260505_0032` (12개)
- `20260517_0001_drop_attendance_detection.sql` (운영에는 drop할 게 없음)

`supabase migration list --linked` 로 운영 history에 12개 미적용 사전 확인.
