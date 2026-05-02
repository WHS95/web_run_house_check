# Dev 전용 테스트 계정 사용 가이드

## 환경 셋업

1. `.env.local`이 dev Supabase 프로젝트(`runhouse-dev`)를 가리키는지 확인
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cnjmnqevlkuxmujtmklc.supabase.co
   ```
2. `NEXT_PUBLIC_ENABLE_DEV_AUTH=true` 설정 확인
3. `npm run seed:test` 실행

## 시드 계정

모든 계정 비밀번호: `Test1234!`

| 계정 | 역할 |
| --- | --- |
| admin@test.com | CREW_MANAGER |
| member1@test.com | MEMBER |
| member2@test.com | MEMBER |
| member3@test.com | MEMBER |
| member4@test.com | MEMBER |
| member5@test.com | MEMBER |

크루명: `테스트 크루` (서울, `is_crew_verified=true`)

## 사용 방법

- `/auth/login` 진입 → 카카오 버튼 아래 `[DEV] 테스트 계정 로그인` 패널 노출
- 빠른 선택 버튼 클릭으로 즉시 로그인
- 직접 입력 필드로 임의 시드 계정 로그인 가능

## 시드 리셋

```bash
npm run seed:reset   # 테스트 크루/유저 전체 삭제
npm run seed:test    # 재시드
```

## ⚠️ 운영 안전성

- `NODE_ENV === 'production'`이면 가드가 무조건 `false` → 패널 노출 X
- `NEXT_PUBLIC_ENABLE_DEV_AUTH`가 `'true'`가 아니면 패널 노출 X
- 시드 스크립트는 운영 ref(`sazfajslhnvzhpaianhl`) 감지 시 즉시 abort

## Supabase 프로젝트 정보

| 항목 | 운영 | Dev |
| --- | --- | --- |
| Project ref | `sazfajslhnvzhpaianhl` | `cnjmnqevlkuxmujtmklc` |
| Organization | TCRC | house |
| 키 백업 | `.env.local.prod-backup` | `.env.local` |
