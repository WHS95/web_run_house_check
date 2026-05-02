# 운영 ↔ 개발 환경 전환 가이드

## 개요

RunHouse는 **운영(prod)**과 **개발(dev)** Supabase 프로젝트를 분리해서 사용합니다.
환경 전환은 `.env.local` 파일 교체만으로 완료됩니다.

| 항목 | 운영 | 개발 |
| --- | --- | --- |
| Project ref | `sazfajslhnvzhpaianhl` | `cnjmnqevlkuxmujtmklc` |
| 키 위치 | `.env.local.prod-backup` | `.env.local` (현재) |
| 테스트 계정 패널 | ❌ 미노출 | ✅ 노출 |

---

## 운영 → 개발 전환

```bash
# 1. 현재 운영 키 백업 (이미 있으면 skip)
cp .env.local .env.local.prod-backup

# 2. 개발 키로 교체
#    .env.local에 아래 항목이 포함되어야 함:
#      NEXT_PUBLIC_SUPABASE_URL=https://cnjmnqevlkuxmujtmklc.supabase.co
#      NEXT_PUBLIC_ENABLE_DEV_AUTH=true

# 3. 개발 서버 재시작
npm run dev
```

> **처음 dev 환경을 세팅하는 경우** `.env.local.example`을 복사해서 시작하세요.
> ```bash
> cp .env.local.example .env.local
> # 실제 dev 키 값 입력 후 저장
> ```

---

## 개발 → 운영 전환

```bash
# 1. 운영 백업 복원
cp .env.local.prod-backup .env.local

# 2. 개발 서버 재시작
npm run dev
```

> `NEXT_PUBLIC_ENABLE_DEV_AUTH`가 운영 백업에 없거나 `true`가 아니면
> 테스트 계정 패널은 자동으로 숨겨집니다.

---

## 테스트 계정 초기화 (개발 환경에서만)

```bash
npm run seed:reset   # 테스트 크루/유저 전체 삭제
npm run seed:test    # 재시드 (exercise_types·장소 포함)
```

자세한 시드 계정 목록은 [`docs/dev-test-auth.md`](dev-test-auth.md) 참조.

---

## ⚠️ 주의사항

- `.env.local.prod-backup`은 `.gitignore`에 의해 커밋되지 않습니다. 로컬에서만 관리하세요.
- 운영 서비스 키(`service_role`)는 절대 코드에 하드코딩하거나 커밋하지 마세요.
- `npm run seed:*` 스크립트는 운영 project ref 감지 시 즉시 abort됩니다.
