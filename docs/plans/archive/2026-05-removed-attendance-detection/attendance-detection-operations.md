# 감지 기반 출석(Attendance Detection) 운영 정책

- 작성일: 2026-05-05
- 관련 페이지: `/attendance`, `/admin2/settings`, `/admin2/attendance/sessions`, `/admin2/analyze`, `/master/settings/attendance-tuning`
- 관련 설계: [`docs/plans/2026-05-05-attendance-detection-design.md`](../plans/2026-05-05-attendance-detection-design.md)
- 관련 실행 계획: [`docs/plans/2026-05-05-attendance-detection-plan.md`](../plans/2026-05-05-attendance-detection-plan.md)

---

## 1. 패러다임

본 시스템은 **모임을 등록한 뒤 출석하는 모델이 아니다.** 사람들이 출석하면 시스템이 자동으로 모임(세션)을 인식한다. 모임 모집/공지는 카카오톡·소모임 등 외부 플랫폼이 담당하고, 본 시스템은 **출석 인증 + 자동 세션 그룹핑 + 운영진 보정 + 데이터 기반 운영**에만 집중한다.

| 기존 사고 | 새 사고 |
|---|---|
| 모임을 등록 → 그 모임에 출석 | 사람들이 출석 → 시스템이 모임을 자동 인식 |
| 모임이 출석의 전제 | 모임은 출석의 결과물 |

호스트 개념은 없다. 첫 출석자가 세션을 만들지만 권한·특권·책임은 없다.

## 2. 설정 계층 분리

> **분리 기준:** "이 값을 잘못 설정해도 크루마다 다르게 안 잡혀야 하나?"
> Yes → 마스터 (시스템 안정성/알고리즘 일관성 영역)
> No → 크루 (운영 스타일 차이 반영 영역)

### 2.1 마스터 영역 (`/master/settings/attendance-tuning`)

| 키 | 디폴트 | 의미 | 허용 범위 |
|---|---|---|---|
| `session_window_minutes` | 15분 | 클러스터링 시간 임계값 | 1~120 |
| `session_radius_m` | 100m | 클러스터링 거리 임계값 | 10~2000 |
| `session_close_minutes` | 60분 | 마지막 출석 후 세션 자동 종료 | 5~360 |
| `auto_label_min_session_count` | 5 | 라벨 자동 추천 최소 세션 수 | 1~100 |

- 변경 시 `system_settings_history` 트리거가 변경자/이전값/이후값/시각을 자동 기록.
- 임계값을 절반 미만으로 줄이는 변경은 진행 중인 세션을 분리시킬 수 있어 폼에서 사전 경고 + 확인 다이얼로그.
- RLS는 마스터(`role_id=1`)만 select/update. 액션 레이어에서 `마스터_권한_보장`로 1차 방어.

### 2.2 크루 운영진 영역 (`/admin2/settings`)

| 항목 | 컬럼 | 디폴트 | 의미 |
|---|---|---|---|
| 시간 윈도우 모드 | `time_window_mode` | `cluster_first` | `cluster_first` / `active_hours` / `anytime` |
| 활성 시간대 | `active_hours` | NULL | 요일별 시간대 (mode=active_hours일 때) |
| 이탈 베이스라인 기간 | `churn_baseline_weeks` | 4주 | 평균 출석 산정 기간 |
| 이탈 베이스라인 출석률 | `churn_min_baseline_rate` | 0.5 | 50% 이상 출석 시 베이스라인 멤버로 인정 |
| 이탈 관찰 기간 | `churn_observation_weeks` | 2주 | 0회 출석 시 이탈 위험 |
| 신입 윈도우 | `onboarding_window_weeks` | 4주 | 가입 후 평가 기간 |
| 신입 최소 출석 | `onboarding_min_count` | 2회 | 미달 시 온보딩 위험 |

- `time_window_mode = cluster_first` 동작: 다른 크루원이 최근 30분 이내 같은 위치에서 출석했으면 시간대 무관 OK. **군집 우선.**
- 모든 변경은 다음 출석부터 즉시 반영.

## 3. 자동 클러스터링 룰

출석 시점에 즉시 실행:

1. 활성(미종료) 세션 중 ±`session_window_minutes` + ±`session_radius_m` 안에 들어가는 가장 가까운 세션을 attach.
2. 후보 없으면 **신규 세션 생성** (이 출석자가 첫 멤버, 단 권한 없음).
3. `attendance_records.captured_lat/lng`이 NULL이면 클러스터링 불가 → 출석은 기록되지만 `session_id = NULL`. 운영진 보정 화면에서 처리.

거리 계산: Haversine, R = 6371000m. 중심 좌표는 첫 멤버의 좌표가 그대로 세션의 center가 된다(현재는 평균 갱신 안 함 — 단순성 우선).

## 4. 세션 자동 종료 룰

`pg_cron`으로 5분마다 `attendance.close_idle_sessions()` 실행:
- 마지막 멤버 합류 시각 기준 +`session_close_minutes` 경과한 활성 세션을 종료.
- 종료 시 `auto_label`이 NULL이면 `suggest_session_label`로 추천값 자동 채움.
- 운영진에게 `notify_session_closed` 후크 호출(푸시 인프라 미구현 시 `RAISE NOTICE`만).

`pg_cron` 확장이 비활성화된 환경에서는 마이그레이션이 NOTICE로 안내하고 cron 등록을 skip한다. 필요 시 Supabase 대시보드 → Database → Extensions에서 활성화 후 마이그레이션의 `cron.schedule` 부분만 재실행.

## 5. 운영진 보정 화면 (`/admin2/attendance/sessions`)

### 5.1 진입 경로

- 자동 종료 푸시(인프라 구축 후 활성화) → 1탭
- 직접 `/admin2/attendance/sessions` 진입 → 세션 카드 1탭

### 5.2 보정 액션 4종

| 액션 | 동작 | 감사 로그 |
|---|---|---|
| **출석자 1탭 제거** | `attendance_records.status = 'rejected'` (soft delete). 세션 멤버에서도 제거 | `action='remove'` |
| **수동 추가** | 멤버 검색 → 1탭 → `status='manual'` 새 record 생성 + session_members INSERT | `action='add'` |
| **라벨 수정** | `sessions.auto_label` 업데이트 | `action='relabel'` |
| **세션 삭제** | `sessions` row 삭제. attached records의 `session_id`는 ON DELETE SET NULL | `action='delete_session'` |

- 모든 보정 행위는 `attendance.session_audit_log`에 자동 기록 (사후 분쟁 방지).
- 1탭 = 1결정. 멀티스텝 없음.
- **30일 가드:** 세션 시작 후 30일 경과한 세션은 삭제 차단(도메인 `세션삭제_가능한가`). UI/액션 양쪽 검사.

### 5.3 권한

- `assertAdminAction('attendance.edit')` — CREW_MANAGER 이상 또는 마스터.
- RLS는 2차 방어: `is_crew_admin(crew_id) OR is_master()`.

## 6. 라벨 자동 추천 룰

같은 크루 + 같은 좌표 ±100m + `auto_label IS NOT NULL`인 다른 세션을 그룹핑해서, 빈도가 마스터 설정 `auto_label_min_session_count` 이상인 라벨 중 최빈값을 추천. 운영진은 1탭 승인 또는 수정.

## 7. 크루 헬스 대시보드 (`/admin2/analyze`)

### 7.1 데이터 소스

- `attendance.crew_health_daily` — 일별 WAU/MAU/세션 수/출석 수/활성 멤버 ID 배열
- `attendance.member_activity_daily` — 일별 멤버별 출석 여부

`pg_cron` 매일 00:05 UTC (=09:05 KST)에 `aggregate_crew_health(어제)`로 일별 집계. 라이브 쿼리 대비 비용 95% 감소.

### 7.2 KPI

- WAU(최근 7일) / MAU(최근 30일) — 어제 vs 그제 델타
- 이번 달 출석 수
- 자동 클러스터된 세션 수
- 평균 세션 규모

### 7.3 이탈/온보딩 알림

- 매주 월요일 09:00 KST: 크루 이탈 위험 멤버 수 푸시(`send_churn_risk_alerts`).
- 매일 09:00 KST: 신입 온보딩 위험 멤버 알림(`send_onboarding_risk_alerts`).
- 푸시 인프라(`push_outbox` 테이블) 미존재 시 `RAISE NOTICE`로 로그만 남김. 인프라 추가 후 본 함수의 INSERT 분기가 자동 활성화.

### 7.4 운영진 액션 모델

- "연락함" 마킹 → 일시적 알림 제외 (재발 시 다시 표시) — 향후 과제
- "이탈 인정" → 통계에서 제외 (탈퇴 처리는 별개) — 향후 과제

## 8. DB 마이그레이션 적용 절차

마이그레이션 파일 위치: `supabase/migrations/20260505_*`

### 8.1 적용 순서 (의존성 그래프)

```
0001 system_settings
0002 system_settings_history (← 0001)
0003 crews_attendance_settings
0010 attendance_sessions
0011 attendance_records_session (← 0010)
0012 register_attendance_with_clustering (← 0001, 0010, 0011)
0013 session_auto_close (← 0001, 0010)
0020 session_audit_log (← 0010)
0021 session_close_notify (← 0001, 0010, 0013)
0030 crew_health_daily
0031 aggregate_crew_health (← 0010, 0011, 0030)
0032 health_alerts (← 0003, 0030)
```

### 8.2 적용 전 체크

- [ ] `attendance.is_master()` 헬퍼 존재 확인 (`20260503_0002_rls_helpers.sql`)
- [ ] `pg_cron` 확장 활성화 (Supabase 대시보드 → Extensions). 비활성 시 `0013/0031/0032`가 NOTICE 출력 후 skip — 후속 활성화 후 cron 부분만 재실행 가능.
- [ ] 운영 환경 백업

### 8.3 적용 방법

```bash
# Supabase CLI (권장)
supabase db push

# 또는 supabase MCP 도구로 파일별 apply_migration
# 또는 Supabase 대시보드 → SQL Editor에 직접 붙여넣기
```

모든 마이그레이션은 **재실행 안전(idempotent)**으로 작성되어 있어 부분 실패 후 재실행 가능.

### 8.4 적용 후 검증

```sql
-- 1) 시스템 settings 4개 row 확인
SELECT key, value FROM attendance.system_settings ORDER BY key;

-- 2) RLS가 켜져있는지
SELECT tablename, rowsecurity FROM pg_tables
 WHERE schemaname = 'attendance' AND tablename LIKE 'session%' OR tablename LIKE 'crew_health%';

-- 3) cron 등록 확인 (pg_cron 활성 시)
SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'attendance-%';

-- 4) RPC 호출 테스트 (테스트 user/crew로)
SELECT attendance.register_attendance_v2(
    '<user-uuid>'::uuid, '<crew-uuid>'::uuid, now(),
    37.5172, 126.9920, NULL, NULL, false, '한강'
);

-- 5) close_idle_sessions 수동 1회 호출
SELECT attendance.close_idle_sessions();
```

## 9. 보안 / RLS

- 모든 신규 테이블 RLS ENABLE. 정책: `is_crew_member` 또는 `is_master`(SELECT) / `is_crew_admin` 또는 `is_master`(ALL).
- `system_settings`는 마스터만 모든 권한.
- `register_attendance_v2` / `close_idle_sessions` / `aggregate_crew_health` / `notify_session_closed` 등은 `SECURITY DEFINER`로 RLS 우회 — 호출자 권한과 무관하게 작동. 함수에 explicit GRANT EXECUTE.
- 좌표 정보(`captured_lat/lng`, `sessions.center_lat/lng`)는 본인 크루 멤버에게만 노출.

## 10. 알려진 한계 및 향후 과제

| 항목 | 사유 / 우회 |
|---|---|
| 푸시 발송 미구현 | `notify_session_closed` 등이 NOTICE만 남김. `push_outbox` 테이블 추가하면 자동 활성. |
| 회전 코드 / 단체 인증샷 | 부정 방지 강화 — 별도 layer로 분리 |
| 누락/부정 의심 자동 추출 | 운영진 보정 화면 강화 — 별도 과제 |
| DBSCAN 등 고급 클러스터링 | 단순 threshold로 충분한 규모. 운영 데이터 누적 후 재평가 |
| 크루별 settings override | 마스터 단일 운영 중. 필요 시 `crews.session_close_minutes_override nullable` 패턴 추가 |
| `searchCrewMembersForSessionAction` query 미사용 | 보정 화면 멤버 검색이 첫 20명만 반환 — 100명+ 크루는 검색 query 적용 필요(향후 RPC) |
| 세션 목록 `minMembers` 필터 post-pagination | 페이지 합계가 정확하지 않을 수 있음 — RPC로 HAVING 처리 시 정밀도 향상 |

## 11. 의도적으로 만들지 않는 것 (YAGNI)

본 시스템 정체성을 지키기 위해 명시적으로 빼는 항목:

- ❌ 모임 생성/등록 화면 (정기/벙개 모두)
- ❌ RSVP / "갈게요" 버튼
- ❌ 모임 모집용 카톡 공유 카드
- ❌ 정기모임 자동 생성 / 모임 시작 1시간 전 푸시
- ❌ 모임별 deep link

이 항목들은 카카오톡·소모임이 이미 더 잘한다. 본 시스템은 출석 인증과 데이터에만 집중.

## 12. 변경 시 주의사항

- 마스터 settings 임계값 변경은 다음 출석부터 **즉시** 반영. 한 번에 절반 미만으로 줄이지 말 것 (진행 중 세션 분리 위험).
- 도메인 함수(`lib/domain/attendance/`, `lib/domain/system-settings/`, `lib/domain/crew-settings/`, `lib/domain/session-correction/`, `lib/domain/crew-health/`)는 Supabase/Next/React import 금지. 한글 메소드명 컨벤션 유지.
- 새 cron 등록 시 PL/pgSQL `PERFORM`은 `WHERE`를 받지 못하므로 반드시 `IF EXISTS THEN PERFORM ... END IF;` 블록 사용.
- jsonb → int 직접 캐스트는 throw하므로 항상 `(value::text)::int` 경유.
- 새 마이그레이션은 `IF NOT EXISTS` / `DROP IF EXISTS … CREATE` / `INSERT … ON CONFLICT` 패턴으로 idempotent하게.

## 13. 변경 이력

| 날짜 | 변경 | 사유 |
|---|---|---|
| 2026-05-05 | 초안 작성 | 감지 기반 출석 시스템 출시 |
