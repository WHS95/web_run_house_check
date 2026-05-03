# RLS 운영 배포 체크리스트

작성일: 2026-05-03
대상: RunHouse `attendance` 스키마 19개 테이블

---

## 1. 배포 전 (운영 DB)

### 1.1 마이그레이션 일괄 적용 순서

`supabase/migrations/20260503_*.sql` 9개 파일을 순서대로 적용한다 (파일명 정렬 그대로):

```
20260503_0001_user_push_tokens_token_unique.sql
20260503_0002_rls_helpers.sql
20260503_0003_function_search_path.sql
20260503_0004_rls_user_push_tokens.sql
20260503_0005_rls_password_reset_tokens.sql
20260503_0006_rls_user_roles_and_roles.sql
20260503_0007_rls_users.sql
20260503_0008_rls_phase_2.sql
20260503_0009_rls_phase_3.sql
```

각 파일은 단일 트랜잭션 (`BEGIN/COMMIT`) 으로 묶여 있어 실패 시 자동 롤백된다.

### 1.2 master 사용자 시드 점검

`is_master()` 헬퍼는 두 컨벤션을 모두 인정:
- `roles.name = 'master'`
- `user_roles.role_id = 1` (현 코드 컨벤션)

운영 DB 의 master 사용자가 어느 쪽으로 시드돼 있는지 확인. 둘 다 비어있으면 master 권한이 필요한 모든 정책이 차단됨 (admin/master 페이지 깨짐).

```sql
SELECT ur.user_id, u.email, ur.role_id, r.name
FROM attendance.user_roles ur
JOIN attendance.users u ON u.id = ur.user_id
LEFT JOIN attendance.roles r ON r.id = ur.role_id
WHERE r.name = 'master' OR ur.role_id = 1;
```

### 1.3 dashboard 토글 (자동화 불가)

Supabase Dashboard 에서 직접 ON 해야 하는 보안 옵션:

- **Auth → Providers → Email → "Prevent signups with leaked passwords"** ON
  - HaveIBeenPwned 체크. advisor lint 0010 해소.

---

## 2. 배포 후 (검증)

### 2.1 supabase advisor 재확인

```
mcp__supabase__get_advisors --type=security
```

기대: `function_search_path_mutable` 0건, `auth_leaked_password_protection` 0건 (dashboard 토글 후).

### 2.2 RLS 동작 검증 (수동)

| 시나리오 | 기대 |
|---|---|
| anon 으로 `/rest/v1/users?select=*` 호출 | 401 또는 빈 결과 |
| 일반 사용자 본인 `/mypage` 정상 진입 | OK |
| 일반 사용자 다른 사용자 mypage URL 변조 | redirect 또는 빈 결과 |
| 관리자 `/admin2` 정상 (멤버 리스트) | OK |
| 관리자 멤버 추방 (admin2/settings/members) | OK |
| master `/master` 정상 | OK |
| 푸시 알림 토글 ON/OFF | OK (Phase 1a) |
| 출석체크 흐름 | OK (Phase 2) |

### 2.3 클라이언트 번들 service_role 노출 검증

```bash
npm run build
grep -rln "service_role\|SUPABASE_SERVICE_ROLE_KEY" .next/static
# 기대: 0 hits
```

---

## 3. 알려진 후속 cleanup (별도 PR)

### 3.1 components 의 admin client 함수 import (3건)

```
components/admin/crew/CrewCreateButton.tsx     → createCrew
components/admin/crew/RemoveMemberButton.tsx   → removeUserFromCrew
components/admin/crew/InviteCodeCreateButton.tsx → createCrewInviteCode
```

**현재 상태**:
- ESLint warn (`.eslintrc.json` 의 components/** 규칙)
- service_role 키 자체는 client 번들에 노출되지 않음 (next 가 strip)
- 하지만 함수 본문은 client 번들에 포함 → 런타임 호출 시 `process.env.SUPABASE_SERVICE_ROLE_KEY` 가 undefined 라 실패

**fix 방향**: 각 컴포넌트에서 admin 함수 직접 호출 → Server Action 으로 wrap → client 는 action 만 호출.

### 3.2 ESLint 룰 격상 (warn → error)

CLAUDE.md 의 BFF 룰 5/6 참고. Phase A 본보기 머지 후 cleanup PR 에서:
- 룰 5 (page.tsx `'use client'` 금지) → error
- 룰 6 (app/** 의 `@/lib/supabase/admin` import) → error
- 신규 룰 (components/hooks 의 `@/lib/supabase/admin` 함수 import) → error

### 3.3 invite_code 검증 SECURITY DEFINER RPC 화

현재 `crew_invite_codes` 는 authenticated 모두 SELECT 가능. invite_code 는 random string 이라 enumerate 비용이 높지만, 더 안전한 패턴은:

```sql
CREATE FUNCTION attendance.verify_invite_code(p_code text)
RETURNS TABLE(crew_id uuid, valid boolean) ...
SECURITY DEFINER
```

→ signup/verify-crew 에서 SELECT 대신 RPC 호출. 그 후 `crew_invite_codes_authenticated_select` 정책 제거.

### 3.4 컬럼 단위 GRANT 화이트리스트 (`users` 테이블)

본인 UPDATE 가 status / suspended_* / oauth_* / hashed_password 등 admin/시스템 전용 컬럼을 변경하지 못하게 GRANT 화이트리스트 적용.

```sql
REVOKE UPDATE ON attendance.users FROM authenticated;
GRANT UPDATE (
    first_name, birth_year, email, phone, profile_image_url,
    verified_crew_id, is_crew_verified,
    last_activity_at,
    privacy_consent_agreed, privacy_consent_agreed_at,
    terms_of_service_agreed, terms_of_service_agreed_at,
    username
) ON attendance.users TO authenticated;
```

(테스트 환경에서 검증 후 운영 적용)

---

## 4. 롤백 절차

특정 테이블 RLS 즉시 비활성화:

```sql
ALTER TABLE attendance.<table> DISABLE ROW LEVEL SECURITY;
```

전체 롤백 (권장하지 않음, 보안 위험 노출):

```sql
DO $$ DECLARE r record;
BEGIN
    FOR r IN SELECT relname FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'attendance' AND c.relkind = 'r'
    LOOP
        EXECUTE format(
            'ALTER TABLE attendance.%I DISABLE ROW LEVEL SECURITY',
            r.relname
        );
    END LOOP;
END $$;
```

---

## 5. 회귀 방지 (CI)

`npm run build` 가 다음을 자동으로 수행한다:

- `npm run check:rls` — `attendance.__check_rls_status__()` RPC 호출하여
  RLS off 테이블이 화이트리스트 외에 발견되면 build fail.
  - 화이트리스트는 `scripts/check-rls.ts` 의 `RLS_OFF_ALLOWED` (현재 비어있음).
  - 신규 테이블 추가 시 RLS ENABLE 누락 → 빌드 단계에서 즉시 차단.
  - 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) 없으면
    스킵 (로컬 개발에서 잠시 끊긴 상태도 통과시키기 위함).

CI 환경에서는 두 환경변수를 secret 으로 주입할 것.

권장: 매주 cron 으로 `mcp__supabase__get_advisors` 또는 supabase CLI
`supabase db lint` 실행하여 새 보안 경고 감지.

## 6. 참고

- 보안 계획 전체: `docs/plans/2026-05-03-rls-security-plan.md`
- 클라이언트 접근 인벤토리: `docs/audits/supabase-client-access-2026-05-03.md`
- RLS 헬퍼 함수: `supabase/migrations/20260503_0002_rls_helpers.sql`
- RLS 상태 RPC: `supabase/migrations/20260503_0010_rls_status_rpc.sql`
- 회귀 방지 스크립트: `scripts/check-rls.ts`
