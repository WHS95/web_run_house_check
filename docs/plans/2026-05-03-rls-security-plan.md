# RunHouse RLS 보안 적용 계획

작성일: 2026-05-03
대상: `attendance` 스키마 19개 테이블 + RPC 함수 24개
우선순위: 🔴 **Critical** — 현재 PII / 인증 데이터가 anon key 로 직접 접근 가능

---

## 1. 현재 상태 진단

### 1.1 RLS 현황 (전수)

| 테이블 (attendance 스키마) | RLS | 정책 | 민감도 |
|---|---|---|---|
| `users` | ❌ OFF | 0 | 🔴 PII (email, phone, password_hash, oauth_id) |
| `user_push_tokens` | ❌ OFF | 0 | 🔴 FCM 토큰 (사칭 가능) |
| `password_reset_tokens` | ❌ OFF | 0 | 🔴 비밀번호 재설정 토큰 |
| `notifications` | ❌ OFF | 0 | 🟡 개인 알림 |
| `attendance_records` | ❌ OFF | 0 | 🟡 출석 기록 (위변조 가능) |
| `user_crews` | ❌ OFF | 0 | 🟡 크루 멤버십 / 정지 사유 |
| `user_roles` / `roles` | ❌ OFF | 0 | 🔴 권한 escalation 가능 |
| `crew_invite_codes` | ❌ OFF | 0 | 🟡 초대 코드 |
| `crews` | ❌ OFF | 0 | 🟢 공개 크루 정보 |
| `notices`, `push_history`, `crew_locations`, `crew_grades`, `grades`, `grade_promotion_logs`, `exercise_types`, `crew_exercise_types`, `invite_code_usage_logs` | ❌ OFF | 0 | 🟡 ~ 🟢 |

**19개 테이블 전부 RLS OFF, 정책 0개**.

### 1.2 RPC 함수 현황

| 분류 | 개수 | 상태 |
|---|---|---|
| `SECURITY DEFINER` | 17개 | ✅ owner 권한 (RLS 우회 가능) |
| `SECURITY INVOKER` | 7개 | ⚠️ RLS 따라감 → RLS 켜지면 정책 필요 |

**search_path 미설정 함수 19개** (Supabase advisor WARN — search_path injection 가능)

### 1.3 보조 advisor 경고

- ⚠️ `auth_leaked_password_protection`: HaveIBeenPwned 비활성화 → 약한 비밀번호 허용

### 1.4 클라이언트 접근 패턴

- **브라우저 (anon key)**: `lib/supabase/client.ts` 사용처 22+ 파일 — `mypage/edit`, `signup`, `attendance edit`, `activity stats` 등에서 직접 `supabase.from('users').select()` 호출
- **서버 (anon key + 사용자 cookie)**: `lib/supabase/server.ts` — page.tsx, actions.ts 에서 사용
- **Admin (service_role, RLS 우회)**: `lib/supabase/admin.ts` — admin2 페이지 + 일부 일반 사용자 컴포넌트(`ActivityStats`, `ActivitySummaryCard`, `InviteCodeCreateButton` 등)에서도 사용 → **service_role 키가 클라이언트 코드 경로에 노출 위험 점검 필요**

---

## 2. 위협 모델

### 2.1 공격 시나리오

| 시나리오 | 현재 가능 여부 | 결과 |
|---|---|---|
| anon key 로 `attendance.users` 전수 SELECT | ✅ 가능 | 모든 사용자 PII 탈취 |
| 다른 사용자 출석 기록 변조/삭제 | ✅ 가능 | 랭킹 조작, 부정 출석 |
| 다른 사용자의 FCM 토큰을 본인에게 등록 | ✅ 가능 | 알림 가로채기/스팸 |
| `user_roles` 직접 INSERT 로 자신을 admin 으로 승격 | ✅ 가능 | 권한 탈취 |
| 비밀번호 재설정 토큰 SELECT | ✅ 가능 | 계정 탈취 |
| 다른 사용자의 `crew_invite_codes` 재사용 | ✅ 가능 | 무단 가입 |

### 2.2 방어 원칙

1. **RLS = 2차 방어선** (서버 액션 권한 체크가 1차 — CLAUDE.md BFF 4계층과 일치)
2. **읽기·쓰기 분리**: 읽기는 본인/본 크루 한정, 쓰기는 SECURITY DEFINER RPC 또는 Server Action 으로만
3. **service_role 은 서버 코드(actions.ts) 에서만** 사용 — 클라이언트 컴포넌트에서 import 금지
4. **Public 데이터도 SELECT 정책 명시** (RLS 켜면 기본은 deny)

---

## 3. 단계별 적용 계획

> **전제**: BFF 4계층 리팩터(CLAUDE.md 참고) 와 동시 진행. 신규 Phase 별 마이그레이션 + 검증 PR 형태로 진행. 각 단계 후 `npm run build` + 실제 페이지 동작 검증 (홈/마이페이지/출석체크/관리자) 필수.

### Phase 0 — 정찰 & 헬퍼 (0.5일, 🟢 위험 낮음)

**목표**: RLS ON 하기 전, 모든 정책에서 공통으로 쓸 헬퍼 함수와 인벤토리 확보.

작업:
1. **헬퍼 함수 생성** (SECURITY DEFINER, search_path = public, attendance 고정)
   ```sql
   -- attendance.current_user_id() — auth.uid() 반환 (없으면 null)
   -- attendance.is_authenticated() — auth.role() = 'authenticated'
   -- attendance.is_crew_member(p_crew_id uuid) — 본인이 해당 크루 active 멤버인가
   -- attendance.is_crew_admin(p_crew_id uuid) — 해당 크루 admin/master 인가
   -- attendance.is_master() — 글로벌 master role 보유 여부
   ```
2. **search_path 미설정 함수 19개 패치** (advisor WARN 해소)
   ```sql
   ALTER FUNCTION attendance.<name>() SET search_path = attendance, public, pg_temp;
   ```
3. **클라이언트 접근 인벤토리 자동 생성**: `scripts/audit-supabase-client-access.ts`
   - `from('<table>').select|insert|update|delete` 호출 위치 모두 grep
   - RLS ENABLE 시 영향받을 모듈 리스트 산출

산출물: 마이그레이션 1개 + 인벤토리 마크다운

### Phase 1 — 🔴 최고 위험 테이블 우선 (1일)

대상: `users`, `user_push_tokens`, `password_reset_tokens`, `user_roles`, `roles`

#### 1-1. `users`

```sql
ALTER TABLE attendance.users ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 행만 + 본 크루 멤버끼리는 공개 컬럼만
-- (PostgREST 는 column-level 권한이 별도이므로 view 또는 별도 정책)
CREATE POLICY "users_self_select" ON attendance.users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- 같은 크루 멤버는 공개 view 통해 조회 (별도 RPC 또는 view)
-- 직접 attendance.users SELECT 는 본인만

-- UPDATE: 본인만, 그리고 민감 컬럼(status, suspended_*, verified_crew_id 등)은 변경 금지
CREATE POLICY "users_self_update" ON attendance.users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
-- + trigger 로 forbidden_columns 차단 (status/role/suspended_*)

-- INSERT: 회원가입 RPC 만 가능 (정책 미부여 → service_role 만 가능)
-- DELETE: 정책 미부여 → 탈퇴는 withdraw_user RPC(SECURITY DEFINER)로만
```

#### 1-2. `user_push_tokens`

```sql
ALTER TABLE attendance.user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_self_all" ON attendance.user_push_tokens
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- service_role(서버) 은 자동으로 우회. 발송 시 admin client 사용.
```

#### 1-3. `password_reset_tokens`

```sql
ALTER TABLE attendance.password_reset_tokens ENABLE ROW LEVEL SECURITY;
-- 정책 0 = anon/authenticated 모두 deny
-- 토큰 생성/사용은 모두 SECURITY DEFINER RPC 로만
```

#### 1-4. `user_roles` / `roles`

```sql
ALTER TABLE attendance.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.roles ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 권한만 (관리자 UI 는 service_role 로)
CREATE POLICY "user_roles_self_select" ON attendance.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "roles_public_select" ON attendance.roles
    FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE: 정책 0 = 모두 deny → admin RPC 만 가능
```

검증:
- 일반 사용자로 로그인 → mypage 정상 / 다른 사용자 row SELECT 시 RLS 차단 확인
- 관리자 페이지 정상 동작 (service_role 사용)

### Phase 2 — 🟡 비즈니스 핵심 (1~1.5일)

대상: `attendance_records`, `user_crews`, `notifications`, `notices`

#### 2-1. `attendance_records`

```sql
ALTER TABLE attendance.attendance_records ENABLE ROW LEVEL SECURITY;

-- SELECT: 본 크루 멤버끼리 (랭킹/통계용)
CREATE POLICY "attendance_crew_member_select" ON attendance.attendance_records
    FOR SELECT TO authenticated
    USING (attendance.is_crew_member(crew_id));

-- INSERT: 본인 + 본 크루 검증
CREATE POLICY "attendance_self_insert" ON attendance.attendance_records
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND attendance.is_crew_member(crew_id)
    );

-- UPDATE/DELETE: 본인(soft-delete) 또는 크루 admin
CREATE POLICY "attendance_self_or_admin_modify" ON attendance.attendance_records
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() OR attendance.is_crew_admin(crew_id)
    );
```

#### 2-2. `user_crews`

```sql
ALTER TABLE attendance.user_crews ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 + 같은 크루 멤버는 status 만 (suspension_reason 제외)
CREATE POLICY "user_crews_self_or_same_crew" ON attendance.user_crews
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR attendance.is_crew_member(crew_id)
    );
-- + view 로 suspension_reason 마스킹

-- INSERT/UPDATE/DELETE: 본인(자체 가입) 또는 admin RPC 만
```

#### 2-3. `notifications`

```sql
ALTER TABLE attendance.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_self_select" ON attendance.notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_self_update" ON attendance.notifications
    FOR UPDATE TO authenticated USING (user_id = auth.uid());
-- INSERT 는 서버(admin client)만
```

#### 2-4. `notices`

```sql
ALTER TABLE attendance.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_crew_member_select" ON attendance.notices
    FOR SELECT TO authenticated
    USING (
        is_active
        AND attendance.is_crew_member(crew_id)
    );
-- 작성/수정/삭제는 크루 admin RPC
```

### Phase 3 — 🟢 마스터 데이터 (0.5일)

대상: `crews`, `crew_locations`, `crew_grades`, `grades`, `exercise_types`, `crew_exercise_types`, `crew_invite_codes`, `grade_promotion_logs`, `invite_code_usage_logs`, `push_history`

```sql
-- 인증된 사용자에게 SELECT 만 공개, 쓰기는 admin RPC
ALTER TABLE attendance.crews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crews_authenticated_select" ON attendance.crews
    FOR SELECT TO authenticated USING (true);
-- 동일 패턴 적용...
```

`crew_invite_codes` 는 예외:

```sql
-- 본인이 만든 코드 + 본 크루 admin 만
ALTER TABLE attendance.crew_invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite_codes_self_or_admin" ON attendance.crew_invite_codes
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid() OR attendance.is_crew_admin(crew_id)
    );
-- 코드로 join 하는 흐름은 SECURITY DEFINER RPC 만
```

### Phase 4 — service_role 노출 정리 + 코드 측 보강 (1일)

목표: `lib/supabase/admin.ts` 사용처를 server-only 경계로 좁히기.

작업:
1. **eslint 룰 추가**: `app/**/components/**` , `components/**` 에서 `@/lib/supabase/admin` import 차단 (BFF 룰 6 격상 — 현재 warn → error)
2. **클라이언트에서 admin 호출하는 모듈 리팩터**:
   - `components/molecules/ActivityStats.tsx`, `ActivitySummaryCard.tsx`, `admin/crew/InviteCodeCreateButton.tsx` 등 → 데이터 페치를 Server Action 으로 이동
   - 클라이언트는 fetch 결과만 받음 (anon key 만 사용)
3. **`SUPABASE_SERVICE_ROLE_KEY` 가 클라이언트 번들에 포함되지 않는지 검증**: `npm run build` 후 `.next/static/**/*.js` 에서 grep
4. **leaked-password-protection 활성화** (Supabase Dashboard → Auth)
5. **SECURITY DEFINER 함수에 권한 위임 검증 코드 추가** (각 함수 안에서 `auth.uid()` 체크)

### Phase 5 — 회귀 방지 (지속) (0.5일 + α)

1. **CI 게이트**: 새 테이블 생성 시 RLS ENABLE 강제
   ```ts
   // scripts/check-rls.ts — pg_class 조회로 RLS off 테이블 발견 시 build fail
   ```
2. **policy 단위 테스트**: pgTAP 또는 vitest + supabase-js 로 정책별 allow/deny 시나리오
3. **`get_advisors` 주기 실행**: 매주 cron 으로 새 경고 감지

---

## 4. 일정 / 마일스톤

| Phase | 기간 | PR 수 | 위험도 | 완료 기준 |
|---|---|---|---|---|
| 0 | 0.5일 | 1 | 🟢 | 헬퍼 함수 4개 + search_path 패치 + 인벤토리 |
| 1 | 1일 | 1~2 | 🟡 | 5개 민감 테이블 RLS ON, 일반 시나리오 통과 |
| 2 | 1.5일 | 2 | 🟡 | 4개 비즈니스 테이블 RLS ON |
| 3 | 0.5일 | 1 | 🟢 | 마스터 데이터 RLS ON |
| 4 | 1일 | 1~2 | 🟡 | service_role 경계 정리 + ESLint 강화 |
| 5 | 0.5일 + α | 1 | 🟢 | CI 게이트 + 정책 테스트 |

**합계: 5일 (실작업 4.5일)**

---

## 5. 즉시 실행 가능한 작업 (오늘부터)

1. **`scripts/audit-supabase-client-access.ts` 생성** — 인벤토리 산출 (Phase 0 의 1단계)
2. **헬퍼 함수 마이그레이션 작성** — `supabase/migrations/20260503_0002_rls_helpers.sql`
3. **search_path 패치 마이그레이션** — `supabase/migrations/20260503_0003_function_search_path.sql`
4. **첫 RLS 적용**: `user_push_tokens` (가장 작은 영향, 방금 작업한 테이블 → 검증 쉬움)

---

## 6. 검증 시나리오

각 Phase 머지 후 다음을 수동 검증:

| 시나리오 | 기대 동작 |
|---|---|
| 일반 사용자 로그인 → 홈 | 정상 |
| 본인 mypage / 출석체크 / 랭킹 | 정상 |
| 다른 사용자 정보 조회 (URL 변조) | 차단 |
| 관리자 페이지 (admin2) | 정상 (service_role) |
| 마스터 페이지 (master) | 정상 |
| 토큰 등록/해제 | 정상 |
| 모바일 PWA 푸시 수신 | 정상 |

---

## 7. 롤백 전략

- 각 Phase 마이그레이션은 단일 트랜잭션으로 묶고, 롤백 마이그레이션 페어 작성
- 문제 발생 시 즉시 `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` (5초 내 복구)
- 단, **production 데이터 노출이 이미 발생한 가정 하에** Phase 1 이후엔 키 rotation + 감사 로그 점검 병행

---

## 8. 참고

- Supabase RLS 가이드: https://supabase.com/docs/guides/database/postgres/row-level-security
- BFF 4계층 아키텍처: `docs/plans/2026-04-28-bff-refactor-design.md`
- 현재 Phase A 본보기 (attendance) 와 충돌 없음 — RLS 는 BFF 와 직교
