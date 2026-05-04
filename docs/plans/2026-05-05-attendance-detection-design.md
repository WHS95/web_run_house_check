# Attendance Detection — Design Doc

> **목적:** 출석 시스템을 "모임 등록 → 출석"이 아닌 **"감지 기반 출석(Detection-based attendance)"** 으로 재설계한다. 모임 관리는 카카오톡/소모임 등 외부 플랫폼이 담당하고, 본 시스템은 **출석 인증 + 자동 세션 그룹핑 + 운영진 보정 + 데이터 기반 운영**에만 집중한다.

**Status:** Draft (브레인스토밍 완료, 구현 계획 미작성)
**작성일:** 2026-05-05
**관련 페이지:** `/attendance`, `/admin2/settings`, `/admin2/attendance`, `/admin2/analyze`, `/master/settings/attendance-tuning` (신규)

---

## 1. 배경 및 문제 정의

### 1.1 현재 시스템 관찰
- 위치 기반 출석 토글 + 정확도 범위 + 미등록 위치 허용 토글이 있음 (`/admin2/settings?tab=location`)
- 출석 폼은 `attendance.get_attendance_form_data` RPC로 한 번에 로딩
- 카카오톡 URL 공유 모델 (PWA, 앱 설치 강요 X)
- 월간 랭킹으로 즉각적 피드백 제공

### 1.2 운영진 입장 핵심 걱정
1. **누락**: 오프라인 출석을 했는데 시스템 출석을 안 한 경우
2. **부정**: 오프라인 출석을 안 했는데 시스템 출석을 한 경우
3. **거부감**: 크루원이 출석 시스템 자체를 귀찮아함 (운영진은 엑셀 수기 입력 부담)

### 1.3 이 시스템의 역할 재정의
- 모임은 **이미 다른 플랫폼(카카오톡/소모임 등)에 올라간 상태** — 거기서 사람이 유입되고 모집됨
- 본 시스템에서까지 모임을 또 만들면 **운영진의 모임 관리가 분산**되어 채택률 저하
- → **본 시스템 = 출석만**. 모임 관리/모집/공지 기능은 의도적으로 만들지 않는다.

---

## 2. 코어 컨셉: 감지 기반 출석 (Detection-based)

### 2.1 패러다임 전환

| 기존 사고 | 새 사고 |
|---|---|
| 모임을 등록 → 그 모임에 출석 | 사람들이 출석 → 시스템이 모임을 자동 인식 |
| 모임이 출석의 전제 | 모임은 출석의 결과물 |

### 2.2 사용자 흐름

```
[크루원]
카톡으로 모임 정보 받음   →   현장 도착   →   "출석" 1탭   →   끝
(00시 00장소 벙개/정기)        (위치 + 시간 자동 매칭)

[서버]
출석 record 수신
  → 위치/시간 검증
  → 자동 세션 클러스터링 (±15분 / ±100m)
  → 첫 출석자가 세션 생성, 이후 동일 세션에 attach

[운영진]
세션 종료 후 푸시 수신
  → 보정 화면 1탭 진입
  → 누락 멤버 1탭 추가 / 부정 의심 1탭 제거
```

### 2.3 핵심 원칙
- **사전 모임 등록 0**: 운영진/주최자가 모임을 만들지 않는다.
- **호스트 개념 없음**: 첫 출석자가 세션을 만들지만, 권한/특권/책임은 없다. 모두 동등.
- **운영진의 사전 행위 = 권한/위치/임계값 설정**, **사후 행위 = 라벨 + 보정 + 데이터 분석**.

---

## 3. 섹션 1 — 감지 기반 출석 코어

### 3.1 컴포넌트

#### A. 출석 트리거 (크루원 측)
- 앱 열고 "출석" 1탭
- GPS 즉시 캡처 + 디바이스 시간/서버 시간 drift 검증 (시간 조작 방지)
- payload: `{ user_id, crew_id, captured_at, lat, lng, accuracy_m }`

#### B. 위치/시간 검증 (서버)

**위치 매칭:**
- 등록 위치 ± `accuracy_range_m` 안 → OK
- `allow_unregistered_location` ON → 위치 무관 OK

**시간 윈도우 매칭** (crew_settings로 모드 선택):
- `active_hours`: 크루가 정의한 활성 시간대 (예: 평일 18-22시 / 토 6-12시)
- `anytime`: 24시간 허용
- `cluster_first` (**디폴트**): 다른 크루원이 최근 30분 이내 같은 위치에서 출석했으면 무조건 OK. **군집 우선.**

#### C. 자동 세션 클러스터링
- 출석 record 수신 시 즉시 실행
- 룰:
    - **±`session_window_minutes`** (default 15분) **+ ±`session_radius_m`** (default 100m) 안에 활성 세션이 있으면 그 세션에 attach
    - 없으면 **신규 세션 생성** (이 출석자가 첫 멤버, 단 호스트 권한 없음)
- 마지막 출석 후 **+`session_close_minutes`** (default 60분) → 세션 자동 closed
- 알고리즘: 단순 threshold 기반 (DBSCAN 등 over-engineering 회피)

### 3.2 데이터 모델

```sql
-- 기존 attendance.records 확장
ALTER TABLE attendance.records
  ADD COLUMN session_id      uuid NULL,
  ADD COLUMN captured_lat    double precision,
  ADD COLUMN captured_lng    double precision,
  ADD COLUMN status          text CHECK (status IN ('pending','confirmed','rejected','manual')) DEFAULT 'confirmed';

-- 신규: 자동 클러스터링된 세션
CREATE TABLE attendance.sessions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id      uuid NOT NULL REFERENCES attendance.crews(id),
    started_at   timestamptz NOT NULL,
    ended_at     timestamptz NULL,        -- close 처리 후 채움
    center_lat   double precision NOT NULL,
    center_lng   double precision NOT NULL,
    radius_m     int NOT NULL,
    auto_label   text NULL,                -- "한강 정기" 등 위치 라벨 (운영진 승인/수정)
    created_at   timestamptz DEFAULT now()
);

CREATE TABLE attendance.session_members (
    session_id           uuid REFERENCES attendance.sessions(id) ON DELETE CASCADE,
    user_id              uuid REFERENCES attendance.users(id),
    attendance_record_id uuid REFERENCES attendance.records(id),
    joined_at            timestamptz NOT NULL,
    PRIMARY KEY (session_id, user_id)
    -- role 컬럼 없음 (모두 동등)
);

CREATE INDEX idx_sessions_crew_started ON attendance.sessions(crew_id, started_at DESC);
CREATE INDEX idx_session_members_user ON attendance.session_members(user_id);
```

---

## 4. 섹션 2 — 운영진 보정 화면

### 4.1 목표
세션 종료 직후, 운영진이 **누락 추가 + 부정 의심 제거**를 한 화면에서 1탭으로 끝낸다. 의심 후보 자동 추출은 **이번 레이어에 포함하지 않음** (후속 과제).

### 4.2 진입
- 자동 세션 종료 시 운영진에게 푸시: `"한강 모임 종료 — 5명 출석"`
- 1탭 → 보정 화면
- 또는 `/admin2/attendance/sessions` → 세션 카드 1탭

### 4.3 화면 구조

```
[헤더]  한강 정기(라벨)  /  화 19:08~20:24  /  5명
        [라벨 수정] [세션 삭제]
─────────────────────────────────────
출석자 5명
  ☑ 김철수    19:08  등록위치
  ☑ 박영희    19:11  등록위치
  ☑ 이민수    19:13  미등록위치(±450m)
  ...
[+ 출석자 수동 추가]   ← 검색 → 1탭 추가
```

### 4.4 핵심 동작

| 액션 | 동작 |
|------|------|
| **출석자 1탭 제거** | `records.status = 'rejected'` (soft delete) + audit log |
| **수동 추가** | 멤버 검색 → 1탭 추가 → `records.status = 'manual'` 생성, 세션에 attach |
| **라벨 자동 추천** | 같은 좌표 ±100m에서 N회(default 5회) 이상 세션 발생 시 라벨 제안. 운영진 1탭 승인/수정 |
| **세션 삭제** | 잘못 클러스터된 경우. attached records의 status는 유지, session_id NULL |

### 4.5 감사 로그

```sql
CREATE TABLE attendance.session_audit_log (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     uuid NULL,
    admin_id       uuid NOT NULL REFERENCES attendance.users(id),
    action         text NOT NULL CHECK (action IN ('add','remove','relabel','delete_session')),
    target_user_id uuid NULL,
    before_state   jsonb,
    after_state    jsonb,
    created_at     timestamptz DEFAULT now()
);
```

### 4.6 UX 룰
- 1탭 = 1결정 (멀티스텝 X)
- 제거/삭제는 5초 Undo 토스트
- 모든 보정 행위 audit log 기록 (사후 분쟁 방지)

### 4.7 권한
- 운영진(또는 등급 ≥ X)만 접근. RLS 보조.

---

## 5. 섹션 3 — 자동 세션 리포트 + 크루 헬스 대시보드

### 5.1 목표
**"이 시스템 쓰면 우리 크루가 자라고 있는지 데이터로 보인다."** 킬링 포인트의 가시화.

### 5.2 A. 세션 자동 리포트

#### A-1. 세션 종료 푸시
- 트리거: 마지막 출석 후 +`session_close_minutes` 경과 (세션 closed)
- 운영진에게 푸시: `"한강 모임 종료 — 5명 출석"`
- 1탭 → 섹션 2 보정 화면

#### A-2. 세션 히스토리 페이지 (`/admin2/attendance/sessions`)
- 시간 역순 세션 카드 리스트
- 각 카드: 라벨 / 일시 / 위치 / 출석자 수 / 미라벨 표시
- 필터: 기간, 위치 라벨, 출석자 수 범위
- 무한 스크롤 + 가상화

### 5.3 B. 크루 헬스 대시보드 (`/admin2/analyze` 확장)

#### B-1. 핵심 KPI (상단 카드)
- **활성 크루원**: WAU / MAU
- **이번 달 출석 횟수**: 전월 대비 증감
- **세션 수**: 자동 클러스터된 모임 횟수
- **평균 세션 규모**: 세션당 평균 인원

#### B-2. 시간/요일 히트맵
- 7일 × 24시간 셀, 출석 빈도로 색 농도
- "이 크루는 화/목 19시 + 토 8시가 메인" 한눈에
- 자동 클러스터 결과를 그대로 활용

#### B-3. 위치별 인기도
- 자동 라벨 + 수동 라벨 위치 리스트
- 각 위치별: 세션 수 / 평균 출석자 / 마지막 모임일

#### B-4. 멤버별 출석 패턴
- 멤버 리스트 + 최근 4주 출석률 / 누적 출석 / 마지막 출석일
- 정렬: 출석률 ↓, 최근 출석 ↓
- 클릭 → 개별 멤버 상세

### 5.4 C. 이탈 위험 자동 알림

#### 룰 (운영진 튜닝)
- 베이스라인 기간(default 4주) 평균 출석률 ≥ X%(default 50%)
- 최근 관찰 기간(default 2주) 출석 0회
- → "이탈 위험" 플래그

#### 알림
- 매주 월요일 아침 운영진에게 푸시: `"이탈 위험 멤버 N명"`
- 대시보드 상단 배너 → 멤버 리스트 → 전화/카톡 1탭 콘택트

#### 운영진 액션
- **"연락함"** 마킹 → 일시적 알림 제외 (재발 시 다시 표시)
- **"이탈 인정"** → 통계에서 제외 (탈퇴 처리는 별개)

### 5.5 D. 신입 온보딩 점수

#### 룰
- 가입 후 첫 `onboarding_window_weeks`(default 4) 출석 횟수 추적
- 점수 < `onboarding_min_count`(default 2)이면 "온보딩 위험"

#### 알림
- 가입 +2주 시점 자동 평가
- 점수 낮으면 운영진에게 `"이 신입 챙겨주세요"` 푸시

### 5.6 데이터 모델 (집계 캐시)

대부분 `attendance.records` + `attendance.sessions`에서 derive. 매번 계산 비싸므로 일별 집계 테이블 도입:

```sql
CREATE TABLE attendance.crew_health_daily (
    date              date NOT NULL,
    crew_id           uuid NOT NULL REFERENCES attendance.crews(id),
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
```

이탈 위험/온보딩 점수는 매번 위 테이블에서 SQL로 derive — 별도 저장 X (룰 변경 시 즉시 반영).

### 5.7 페이지 매핑
| 페이지 | 내용 |
|---|---|
| `/admin2/analyze` (기존 확장) | 대시보드 (B), 이탈/온보딩 알림 카드 |
| `/admin2/attendance/sessions` (신규) | 세션 히스토리 (A-2) |
| `/admin2/analyze/members` 또는 `/admin2/user` 확장 | 멤버별 패턴 (B-4) |

---

## 6. 설정 계층 분리 (CRITICAL)

### 6.1 분리 기준
> **"이 값을 잘못 설정해도 크루마다 다르게 안 잡혀야 하나?"**
> Yes → **마스터** (시스템 안정성/알고리즘 일관성 영역)
> No → **크루** (운영 스타일 차이 반영 영역)

### 6.2 마스터 관리자 영역 (`/master/settings/attendance-tuning` 신규)

```sql
CREATE TABLE attendance.system_settings (
    key         text PRIMARY KEY,
    value       jsonb NOT NULL,
    updated_by  uuid REFERENCES attendance.users(id),
    updated_at  timestamptz DEFAULT now()
);

-- 초기 값
INSERT INTO attendance.system_settings(key, value) VALUES
  ('session_window_minutes',       '15'),
  ('session_radius_m',             '100'),
  ('session_close_minutes',        '60'),
  ('auto_label_min_session_count', '5');

CREATE TABLE attendance.system_settings_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key         text NOT NULL,
    old_value   jsonb,
    new_value   jsonb,
    updated_by  uuid,
    updated_at  timestamptz DEFAULT now()
);
```

| 키 | 디폴트 | 의미 |
|---|---|---|
| `session_window_minutes` | 15 | 클러스터링 시간 임계값 |
| `session_radius_m` | 100 | 클러스터링 거리 임계값 |
| `session_close_minutes` | 60 | 세션 자동 종료 시간 |
| `auto_label_min_session_count` | 5 | 라벨 자동 추천 최소 세션 수 |

**서버 캐시:** 5분 TTL 메모리 캐시로 매 출석마다 DB 조회 회피.

### 6.3 크루 운영진 영역 (`/admin2/settings` 확장)

```sql
-- 기존 crews 또는 별도 crew_settings 테이블에 추가
ALTER TABLE attendance.crews
  -- 위치/시간 정책
  ADD COLUMN time_window_mode text
      CHECK (time_window_mode IN ('cluster_first','active_hours','anytime'))
      DEFAULT 'cluster_first',
  ADD COLUMN active_hours jsonb NULL,
  -- 이탈/온보딩 룰
  ADD COLUMN churn_baseline_weeks       int     DEFAULT 4,
  ADD COLUMN churn_min_baseline_rate    decimal DEFAULT 0.5,
  ADD COLUMN churn_observation_weeks    int     DEFAULT 2,
  ADD COLUMN onboarding_window_weeks    int     DEFAULT 4,
  ADD COLUMN onboarding_min_count       int     DEFAULT 2;

-- 기존 컬럼 유지: accuracy_range_m, allow_unregistered_location
```

| 항목 | 영역 | UI |
|---|---|---|
| `accuracy_range_m` | 위치 | 기존 |
| `allow_unregistered_location` | 위치 | 기존 |
| `time_window_mode` | 시간 | 라디오 (cluster_first/active_hours/anytime) |
| `active_hours` | 시간 | 요일별 시간대 편집기 (mode=active_hours일 때만) |
| `churn_*` | 이탈 룰 | 슬라이더 / 인풋 |
| `onboarding_*` | 신입 룰 | 슬라이더 / 인풋 |

### 6.4 향후 (YAGNI)
크루별 override가 필요해지면 그때 `crews.session_close_minutes_override nullable` 추가. 지금은 마스터 단일.

---

## 7. 종합 데이터 흐름

```
[크루원] 출석 1탭 (위치 + 시간 캡처)
   ↓
[서버] 위치/시간 검증 (섹션 3.1-B)
   ↓
[서버] 자동 세션 클러스터링 (섹션 3.1-C)
   ↓
[크루원] 즉시 피드백 (랭킹/스트릭/공유카드 — 본 디자인 외, 후속 과제)
   ↓
[system_settings.session_close_minutes 후] 세션 자동 closed
   ↓
[운영진] 푸시 → 보정 화면 (섹션 4)
   ↓
[야간 배치] crew_health_daily / member_activity_daily 갱신
   ↓
[운영진] 대시보드/이탈알림/온보딩 (섹션 5)
```

---

## 8. 구현 영역 (BFF 4계층 매핑)

### 8.1 도메인 (`lib/domain/attendance/`)
- `policies.ts`: 출석가능여부, 위치매칭여부, 시간윈도우매칭여부, 세션귀속여부
- `workflow.ts`: 세션생성, 세션귀속, 세션종료처리
- `validators.ts`: 출석페이로드검증
- `types.ts`: AttendanceRecord, Session, SessionMember 등

### 8.2 도메인 (`lib/domain/crew-health/` 신규)
- `policies.ts`: 이탈위험인가, 온보딩위험인가
- `workflow.ts`: 일별집계계산, KPI계산
- `messages.ts`: 푸시 메시지 템플릿

### 8.3 페이지/액션 (BFF)
- `app/attendance/{page.tsx, actions.ts}` (기존 확장)
- `app/admin2/attendance/sessions/{page.tsx, actions.ts}` (신규)
- `app/admin2/analyze/{page.tsx}` (기존 확장)
- `app/master/settings/attendance-tuning/{page.tsx, actions.ts}` (신규)

### 8.4 백그라운드 작업
- 세션 자동 종료 cron (분 단위 폴링 또는 PG trigger)
- `crew_health_daily` / `member_activity_daily` 매일 자정 집계 cron
- 이탈/온보딩 알림 푸시 cron (월요일 아침 / 가입 +2주 시점)

---

## 9. 의도적으로 만들지 않는 것 (YAGNI)

본 시스템의 정체성을 지키기 위해 **명시적으로 빼는 항목**:

- ❌ 모임 생성/등록 화면 (정기/벙개 모두)
- ❌ RSVP / "갈게요" 버튼
- ❌ 모임 모집용 카톡 공유 카드
- ❌ 정기모임 자동 생성 / 모임 시작 1시간 전 푸시
- ❌ 모임별 deep link
- ❌ 회전 코드 (이번 레이어에서 제외 — 부정 의심 자동 탐지와 함께 후속 과제)
- ❌ 단체 인증샷 (이번 레이어에서 제외)
- ❌ 사후 자가 보정 (이번 레이어에서 제외)
- ❌ 누락/부정 의심 자동 추출 (이번 레이어에서 제외)
- ❌ DBSCAN 등 고급 클러스터링 알고리즘 (단순 threshold로 충분)

이 항목들은 카카오톡/소모임 같은 **외부 모임 플랫폼이 이미 더 잘 한다**. 본 시스템은 출석 인증과 데이터에만 집중한다.

---

## 10. 향후 과제 (out of scope)

- 회전 코드 / 단체 인증샷 / 사후 자가 보정 (부정 방지 강화)
- 누락/부정 의심 자동 추출 (운영진 보정 화면 강화)
- 출석 직후 공유 카드 + 스트릭 (참여 동기 강화 — 섹션 4 영역)
- 이탈 위험 멤버 자동 메시지 발송
- 크루별 settings override

---

## 11. 다음 단계

이 design doc 승인 후 `superpowers:writing-plans` 스킬로 구현 계획 (`docs/plans/2026-05-05-attendance-detection-plan.md`) 작성. Phase별 마이그레이션·도메인 함수·페이지·백그라운드 작업 순으로 분할.

---

## 변경 이력
| 날짜 | 변경 | 사유 |
|------|------|------|
| 2026-05-05 | 초안 작성 | 브레인스토밍 완료 후 design doc 화 |
