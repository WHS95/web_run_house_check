# 운영 ↔ 개발 환경 전환 가이드

## 개요

RunHouse는 **운영(prod)**과 **개발(dev)** Supabase 프로젝트를 분리해서 사용합니다.
환경 전환은 `npm run env:prod` / `npm run env:dev` 한 줄로 끝납니다.

| 항목 | 운영 | 개발 |
| --- | --- | --- |
| Supabase project ref | `sazfajslhnvzhpaianhl` | `cnjmnqevlkuxmujtmklc` |
| Supabase project 이름 | `runhouse` | `runhouse-dev` |
| 키 저장 파일 | `.env.prod` | `.env.dev` |
| 테스트 계정 패널 | ❌ 미노출 | ✅ 노출 |
| 카카오 OAuth | ✅ 활성 | ⚠️ 비활성 (Dashboard에서 켜야 함) |

---

## 파일 구조

```
.env.example      ← 키 없는 placeholder (커밋됨)
.env.prod         ← 운영 Supabase 키 (gitignored)
.env.dev          ← 개발 Supabase 키 (gitignored)
.env.local        ← Next.js가 자동 로드하는 활성 env (gitignored, 스위치 대상)
```

> Next.js는 `.env.local`을 자동으로 최우선 로드합니다.
> 따라서 환경 전환은 `.env.prod` / `.env.dev` 중 하나를 `.env.local`로 복사하는 방식입니다.

---

## 환경 전환

### 운영으로 전환
```bash
npm run env:prod   # .env.prod → .env.local
npm run dev        # 서버 재시작
```

### 개발로 전환
```bash
npm run env:dev    # .env.dev → .env.local
npm run dev        # 서버 재시작
```

### 한 번에 (전환 + 서버 시작)
```bash
npm run dev:prod   # 운영으로 전환하고 dev 서버 실행
npm run dev:dev    # 개발로 전환하고 dev 서버 실행
```

### 현재 활성 env 확인
```bash
npm run env:show
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_ENABLE_DEV_AUTH=...
```

---

## 처음 셋업 (새 개발자)

1. 팀에서 `.env.prod`와 `.env.dev` 파일을 받아 프로젝트 루트에 둡니다.
2. 기본 활성 env 선택:
   ```bash
   npm run env:dev    # 개발 환경으로 시작 (권장)
   ```
3. `npm run dev`로 서버 실행.

> `.env.example`은 키가 비어있는 placeholder입니다. 실제 키 값은 팀 내부 비밀 저장소에서 받으세요.

---

## 테스트 계정 초기화 (개발 환경에서만)

```bash
npm run env:dev      # 먼저 dev 환경으로 전환
npm run seed:reset   # 테스트 크루/유저 전체 삭제
npm run seed:test    # 재시드 (exercise_types·장소 포함)
```

자세한 시드 계정 목록은 [`docs/dev-test-auth.md`](dev-test-auth.md) 참조.

---

## `NEXT_PUBLIC_ENABLE_DEV_AUTH` 플래그

이 플래그는 **로그인 화면의 dev 테스트 계정 패널(DevLoginPanel) 노출 여부만** 결정합니다.
Supabase 연결 대상과는 **무관**합니다. Supabase 연결은 `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`가 결정.

| 값 | 효과 |
| --- | --- |
| `true` | DevLoginPanel 노출 (개발 환경에서만 의미) |
| `false` 또는 미설정 | DevLoginPanel 숨김 |

운영 빌드(`NODE_ENV=production`)에서는 값과 관계없이 항상 숨겨집니다.
(`lib/auth/dev-auth-guard.ts` 참조)

---

## ⚠️ 주의사항

- `.env.prod`, `.env.dev`, `.env.local`은 모두 `.gitignore`에 포함되어 커밋되지 않습니다.
- 운영 서비스 키(`service_role`)는 절대 코드에 하드코딩하거나 커밋하지 마세요.
- `npm run seed:*` 스크립트는 운영 project ref 감지 시 즉시 abort됩니다.
- 환경 전환 후 반드시 `npm run dev`를 **재시작**해야 새 env가 반영됩니다.
- 카카오 OAuth는 각 Supabase 프로젝트의 Dashboard → Auth → Providers에서 별도 활성화 필요.
