# BFF 4계층 아키텍처 + Server Actions 전면 마이그레이션 설계

- **작성일**: 2026-04-28
- **상태**: 설계 합의 완료, 실행 계획 작성 예정 (writing-plans 단계로 이행)
- **범위**: 프로젝트 전체. 단 기존 동작 보존이 강력 제약.

## 1. 배경 및 목표

### 1.1 현재 상태

- `app/api/**/route.ts` 38개. 인증·검증·DB 호출·부수효과(푸시·PostHog)가 한 파일에 인라인.
  대표 사례: `app/api/attendance/route.ts` 250줄.
- `lib/admin-stats.ts` 830줄. DB 호출과 비즈니스 로직이 혼재.
- `lib/admin2/queries.ts` 425줄 + `api-guard.ts`로 admin2는 BFF 윤곽 일부 정착.
- `app/ranking/actions.ts` 1개만 Server Action 분리 사례.
- `lib/domain/`은 부재. 비즈니스 룰이 코드 전체에 흩어져 있음.

### 1.2 목표

- **4계층 책임 분리** (page · actions · domain · RLS) 강제.
- 비즈니스 룰을 `lib/domain/`에 격리, **단위 테스트 가능한 순수 함수**로 표현.
- `app/api/**/route.ts` 전면 폐지, **Server Actions로 통일**.
- 회귀 방지를 위해 **TDD + ESLint 룰 + 빌드 통합**으로 회피 불가능하도록 강제.

### 1.3 강제 제약

- 기존 사용자 기능 동작 보존(특히 모바일 PWA 출석/오프라인 큐).
- 빅뱅 금지. **Phase 단위 PR**로 점진적 머지.
- 새 코드는 처음부터 4계층 룰 준수.

## 2. 합의된 결정 (8개)

| # | 결정 | 내용 |
|---|------|------|
| 1 | 시작 순서 | A(룰·골격) → B(본보기) |
| 2 | 룰 강제 수준 | 레벨 2 (ESLint) + 가벼운 보조 스크립트 2개 |
| 3 | 본보기 모듈 | `app/api/attendance/route.ts` |
| 4 | 라우트 그룹 `(screens)` | 도입 안 함 |
| 5 | `app/api/` 처리 | C: 전면 폐지, Server Actions로 통일 |
| 6 | 테스트 도구 | Vitest |
| 7 | `_vm/` 도입 | 5가지 정량 기준 중 1개 충족 시 |
| 8 | 한글화 범위 | A: `lib/domain/` 함수만. 타입·변수·필드는 영어 |

## 3. 4계층 아키텍처

```
┌────────────────────────────────────────────────────────────────┐
│ 1. page.tsx  (RSC, BFF Controller)                             │
│    - auth 체크 → 데이터 페치 → ViewModel 조립 → Client에 prop │
│    - 비즈니스 룰·검증·state transition 금지                     │
├────────────────────────────────────────────────────────────────┤
│ 2. actions.ts  (Server Action, BFF Mutation)                   │
│    - auth 체크 → 도메인 검증 호출 → DB write → revalidate     │
│    - 인라인 비즈니스 로직 금지 → 도메인 함수만 호출             │
│    - 외부 의존(Supabase·Next·waitUntil 등)은 여기에서만        │
├────────────────────────────────────────────────────────────────┤
│ 3. lib/domain/<name>/  (Pure Business Logic)                   │
│    - 순수 함수, 타입 가드, 검증, 권한 판정, state transition    │
│    - Supabase·Next·React import 금지 → 단위 테스트 가능        │
│    - 한글 함수명 (의도 명확성)                                  │
├────────────────────────────────────────────────────────────────┤
│ 4. Supabase RLS  (Defense in Depth)                            │
│    - 모든 테이블 RLS 활성화                                     │
│    - actions.ts의 권한 체크가 1차, RLS는 2차 방어               │
└────────────────────────────────────────────────────────────────┘
```

### 핵심 규칙 4가지

1. `lib/domain/`는 외부 의존 import 금지 (`@/lib/supabase/*`, `next/*`, `react` 모두 차단)
2. Supabase 호출은 `actions.ts` 또는 `page.tsx`/`_vm/queries.ts`에서만 (도메인은 순수)
3. mutation 끝에 `revalidatePath`/`revalidateTag` 필수
4. `page.tsx`는 ViewModel 조립만. 권한 체크/redirect 외 비즈니스 분기 금지

## 4. 디렉토리 구조

```
app/
├── <route>/                      # app/admin2/, app/ranking/ 등 그대로
│   ├── page.tsx                  # BFF 컨트롤러 (RSC)
│   ├── actions.ts                # BFF 액션 (mutation 있을 때만)
│   ├── _components/              # 화면 전용 컴포넌트
│   └── _vm/                      # ViewModel 조립 (조건 충족 시만)
│       ├── queries.ts            # Supabase 호출 묶음
│       └── assemble.ts           # 가공 + 타입 변환
│
├── api/                          # ⛔ 신규 추가 금지 (build 차단)
│   └── <legacy>/route.ts         # 단계적 폐지 → actions.ts 이주
│
lib/
├── supabase/                     # 클라이언트 팩토리 (그대로)
│   ├── server.ts
│   ├── client.ts
│   ├── admin.ts                  # service_role; 매우 제한적
│   └── middleware.ts
│
└── domain/                       # ★ 비즈니스 로직 격리 ★
    ├── <name>/                   # attendance, user, grade, crew, notice ...
    │   ├── policies.ts           # 권한·정책 (한글 함수)
    │   ├── workflow.ts           # 상태 전이 (한글 함수)
    │   ├── validators.ts         # Zod schema · 입력 검증
    │   ├── messages.ts           # 사용자 메시지 조립
    │   ├── types.ts              # 도메인 타입 (영어)
    │   └── *.test.ts             # ★ Vitest 단위 테스트
    └── README.md                 # 도메인 레이어 룰

supabase/
├── migrations/                   # 그대로
└── functions/                    # 필요 시 신설

# 점진 폐지 대상
lib/admin-stats.ts                # 830줄 → lib/domain/stats/로 분해
lib/admin2/queries.ts             # 425줄 → 각 page.tsx의 _vm/queries.ts로 이주
```

## 5. `_vm/` 도입 판단 기준

### 도입 (1개라도 해당)

| # | 기준 | 예시 |
|---|------|------|
| 1 | 쿼리 2개 이상 (병렬·순차 무관) | analyze 페이지 (차트 4종) |
| 2 | DB row → ViewModel 변환 (필드명/구조 다름) | snake_case → camelCase, 평탄화 |
| 3 | 데이터 가공(`.map`/`.filter`/`groupBy`/집계/정렬) 5줄+ | 사용자별 출석 집계 |
| 4 | 결과 분기 redirect 2개 이상 | `user_not_found`, `crew_not_verified` |
| 5 | page.tsx 데이터 페치 블록 30줄 초과 | 정량 백스톱 |

### 인라인 (모두 충족)

- 쿼리 1개 + 결과 그대로 prop 전달
- redirect 0~1개
- 가공 로직 없음
- page.tsx 30줄 미만

## 6. 한글 메소드명 컨벤션

### 6.1 적용 범위

- **적용**: `lib/domain/<name>/*.ts`의 export 함수
- **미적용**: `app/**` (page/actions/components), 타입(`type`/`interface`), 변수, DB 필드, 외부 라이브러리 wrapper
- 이유: 도메인은 비즈니스 의도 표현 핵심. 외부 코드는 React/Next/Supabase 컨벤션 유지가 자연스러움.

### 6.2 패턴

| 동작 | 패턴 | 예시 |
|------|------|------|
| `boolean` 판정 | `~인가`/`~가능한가`/`~여부` | `유효한가`, `미등록허용`, `매니저_여부` |
| 실행 (`void`/`Promise<void>`) | `~하기` | `출석등록하기`, `푸시발송하기` |
| 변환·조립 | `~생성`/`~조립` | `알림메시지_조립`, `로그조립` |
| 검증 (`throw` 가능) | `~검증` | `권한_검증`, `입력_검증` |
| Type guard | `~인` | `출석된_사용자인` |
| 상태 전이 | `~로_전환`/`~로_변경` | `대기로_전환`, `승인으로_변경` |

### 6.3 단어 결합

- 2단어 이하: 붙여 쓰기 — `출석등록하기`
- 3단어+ 또는 의미 단위 분리: `_` — `출석시간_유효한가`
- 영어 약어 포함 시: `_` + 약어 영어 — `PostHog_이벤트전송`, `KST기준_시간계산`

### 6.4 Import namespace 권장

```ts
import * as 출석정책 from '@/lib/domain/attendance/policies';
출석정책.유효한가(now, ts);
출석정책.미등록허용(crew);
```

### 6.5 금지

- ❌ 한·영 혼합 단어: `get출석`, `submit출석`
- ❌ 한자: `出席`
- ❌ 모호한 일반명사 단독: `처리`, `실행`, `로직`
- ❌ 띄어쓰기: `출석 등록 하기`
- ❌ 축약: `출등록`

### 6.6 테스트 작명

```ts
describe('출석 정책', () => {
    describe('유효한가', () => {
        it('+2시간 경계는 유효', () => { ... });
        it('+2시간 1분 초과는 거부', () => { ... });
    });
});
```

## 7. ESLint·TDD 강제 룰

### 7.1 ESLint 차단 항목

| # | files | 차단 대상 | 메시지 |
|---|------|-----------|--------|
| 1 | `lib/domain/**/*.ts` | `@/lib/supabase/*` | domain은 Supabase를 import할 수 없습니다 |
| 2 | `lib/domain/**/*.ts` | `next/*` | domain은 Next 의존성을 가질 수 없습니다 |
| 3 | `lib/domain/**/*.ts` | `react`/`react-dom`/`@/app/**`/`@/components/**` | domain은 UI를 역참조할 수 없습니다 |
| 4 | `app/**/page.tsx` | `revalidatePath`/`revalidateTag` (`next/cache`) | page.tsx는 mutation 책임이 없습니다 |
| 5 | `app/**/page.tsx` | `'use client'` 디렉티브 (`no-restricted-syntax`) | page.tsx는 RSC여야 합니다 |
| 6 | `app/**` (단, `app/api/dev/**` 화이트리스트) | `@/lib/supabase/admin` | service_role은 화이트리스트만 사용 |
| 7 | `app/api/**` | (전역 deprecation 경고) | 신규 mutation은 `actions.ts`에 작성하세요 |

### 7.2 보조 스크립트 2개

- `scripts/check-domain-tests.ts` — `lib/domain/<name>/*.ts` 신규 함수 ⇔ `*.test.ts` 1:1 검증
- `scripts/check-bff.ts` — `app/api/`에 신규 파일 추가 시 fail (git diff 검사)

### 7.3 빌드 통합

```jsonc
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:domain": "vitest run lib/domain",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "check:bff": "tsx scripts/check-bff.ts && tsx scripts/check-domain-tests.ts",
    "build": "npm run check:bff && npm run test && npm run lint && npm run typecheck && next build"
  }
}
```

```ts
// vitest.config.ts (zero-config 수준)
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: { environment: 'node', include: ['lib/domain/**/*.test.ts'] },
});
```

## 8. 본보기 (attendance) 7-Step

### 8.1 현재 → 4계층 매핑

| 현재 인라인 로직 | 이주 위치 |
|---|---|
| `attendanceSubmissionSchema.safeParse` | `lib/domain/attendance/validators.ts` |
| KST + 2시간 시간 윈도우 검증 | `lib/domain/attendance/policies.ts: 유효한가` |
| 미등록 장소 허용 정책 판정 | `lib/domain/attendance/policies.ts: 미등록허용` |
| 푸시 메시지 문구 조립 | `lib/domain/attendance/messages.ts: 알림메시지_조립` |
| 등록 장소 존재 확인 (DB) | `app/attendance/actions.ts` |
| `attendance_records` insert | `app/attendance/actions.ts` |
| `sendNotification` + PostHog (waitUntil) | `app/attendance/actions.ts` |

### 8.2 7-Step

**Step 0 — 인프라 (A 단계)**
- vitest 설치 + `vitest.config.ts`
- `.eslintrc.js` BFF 룰 추가
- `scripts/check-domain-tests.ts` + `scripts/check-bff.ts`
- `package.json` scripts (test, typecheck, build 통합)
- `lib/domain/README.md` + `CLAUDE.md` BFF 섹션
- 커밋: `chore(bff): BFF 4계층 룰 + Vitest TDD 인프라 도입`

**Step 1 — `policies.ts` (TDD)**
- RED: `policies.test.ts` 작성 (경계 케이스 포함)
- GREEN: `policies.ts` 구현 → 테스트 통과
- 커밋: `feat(domain/attendance): policies 함수 + 단위 테스트`

**Step 2 — `validators.ts` + `messages.ts` + `types.ts`**
- 기존 `lib/validators/attendanceSchema` 도메인으로 이주(re-export)
- `messages.ts`/`types.ts` 추가 (TDD)
- 커밋: `feat(domain/attendance): validators · messages · types 추가`

**Step 3 — `actions.ts` 신설**
- `app/attendance/actions.ts`에 `'use server'` + `submitAttendance(input)`
- 흐름: auth → validators.parse → 정책.유효한가 → 장소 DB 조회 → 정책.미등록허용 → insert → `waitUntil(메시지조립 + sendNotification + PostHog)` → `revalidatePath('/attendance')`
- 응답 형태: 기존 route.ts와 호환
- 커밋: `feat(attendance): submitAttendance Server Action 추가`

**Step 4 — 클라이언트 호출부 변환**
- `grep -rn "/api/attendance" --include='*.ts*'`
- 호출자: 컴포넌트, `lib/offline/attendance-queue.ts` 등
- `fetch('/api/attendance')` → `submitAttendance()` 직접 호출
- 커밋: `refactor(attendance): fetch → Server Action 직접 호출`

**Step 5 — legacy route.ts 제거 + 검증**
- `app/api/attendance/route.ts` 삭제
- `npm run build` 통과
- 수동 회귀 체크리스트:
  - 정상 출석 → 알림 + PostHog 이벤트
  - 미래 시간 +3h → 거부
  - 미등록 장소 + crew 미허용 → 거부
  - 미등록 장소 + crew 허용 → 통과
  - 오프라인 큐 재시도 정상
- 커밋: `chore(attendance): legacy /api/attendance route 제거`

**Step 6 — 룰 작동 검증**
- `lib/domain/attendance/policies.ts`에 의도적 supabase import → ESLint 에러 확인 → 되돌리기
- `app/api/`에 새 파일 추가 시도 → `check-bff.ts` 실패 확인 → 되돌리기
- 커밋 없음

## 9. 9-Phase 마이그레이션 (37개 route)

### 9.1 도메인 그룹

| 그룹 | route 카운트 | 도메인 폴더 |
|------|------|-------------|
| G1. auth | 3 | `lib/domain/auth/` |
| G2. user | 4 | `lib/domain/user/` |
| G3. attendance(admin) | 5 | `lib/domain/attendance/` 확장 |
| G4. grade | 5 | `lib/domain/grade/` |
| G5. notice/push | 6 | `lib/domain/notice/`, `push/` |
| G6. crew/location | 6 | `lib/domain/crew/`, `location/` |
| G7. invite | 5 | `lib/domain/invite/` |
| G8. master | 2 | `lib/domain/master/` |
| G9. analyze | 1 | `lib/domain/stats/` (← `admin-stats.ts` 분해) |
| 보류 | 2 (`dev/login`, `ping`) | 그대로 |

### 9.2 Phase 순서

```
Phase A. 인프라 + attendance 본보기 (Step 0~6)
Phase B. auth (G1)
Phase C. user (G2)
Phase D. attendance(admin) (G3)
Phase E. grade (G4) + notice/push (G5)
Phase F. crew/location (G6) + invite (G7)
Phase G. master (G8) + analyze (G9)
+ 정리: lib/admin-stats.ts 폐지, lib/admin2/queries.ts 분해
```

### 9.3 공통 절차 (각 Phase)

1. RED: `lib/domain/<name>/<file>.test.ts`
2. GREEN: 도메인 함수 구현
3. REFACTOR: 응집도 정리
4. `app/<path>/actions.ts` 신설
5. 클라이언트 fetch → action 직접 호출
6. legacy `route.ts` 삭제
7. `npm run build` + 도메인별 회귀 체크리스트

### 9.4 룰

- **Phase = PR** (1 Phase 1 PR, 머지 후 다음 Phase 시작)
- 각 PR 독립 build/test 통과
- PR 본문에 회귀 체크리스트 의무
- Phase 진행 중 해당 도메인 신규 기능 동결

## 10. 회귀 방지 + 종합 체크리스트

### 10.1 자동 차단 (build 통합)

```
npm run build
   ↓ (1) check-bff.ts            # app/api/ 신규 차단
   ↓ (2) check-domain-tests.ts   # 도메인 ↔ 테스트 1:1
   ↓ (3) vitest run              # 도메인 테스트
   ↓ (4) next lint               # ESLint 7개 룰
   ↓ (5) tsc --noEmit            # 타입
   ↓ (6) next build
```

### 10.2 PR 의무 체크리스트

```markdown
## BFF 마이그레이션 체크리스트
- [ ] lib/domain/<name>/ 도메인 함수 추가 (한글 컨벤션 준수)
- [ ] 모든 도메인 함수에 *.test.ts (RED → GREEN 커밋)
- [ ] app/<path>/actions.ts 신설 또는 확장
- [ ] 클라이언트 fetch 호출자 모두 변환
      grep 결과: `grep -rn "'/api/<path>'" --include='*.ts*'`
- [ ] app/api/<path>/route.ts 삭제
- [ ] npm run build 로컬 통과
- [ ] revalidatePath/revalidateTag 호출 (mutation 후)
- [ ] 회귀 시나리오 수동 검증
```

### 10.3 도메인별 회귀 시나리오 템플릿

| 카테고리 | 항목 |
|----------|------|
| 정상 흐름 | 가장 흔한 사용자 액션 1~2개 |
| 권한 거부 | 다른 크루 사용자, 미인증, 권한 부족 |
| 입력 검증 | invalid 입력 → 명확한 에러 |
| 부수효과 | 푸시·PostHog·revalidate |
| 오프라인 PWA | 출석 등 오프라인 큐 도메인 → 재시도 |

### 10.4 롤백 전략

- PR 단위 revert로 도메인 단위 롤백
- 한 PR 안에서 commit 분리: `actions.ts 신설` / `route.ts 삭제` / `클라이언트 변환`
- (옵션) 90일 deprecation alias — 외부 호출 가능 route는 thin wrapper로 90일 유지

### 10.5 런타임 모니터링 (Phase 머지 후 24시간)

| 도구 | 관찰 |
|------|------|
| Sentry | 도메인 에러율 |
| PostHog | 핵심 이벤트 발생량 |
| Supabase 대시보드 | RPC 카운트, RLS 위반, 슬로우 쿼리 |
| Vercel Logs | server action 응답 시간 |

### 10.6 문서화

- `CLAUDE.md` BFF 섹션 추가
- Phase 진행 체크박스 (A: ⏳ B: ⏳ ...) — 매 Phase 머지 시 갱신
- legacy 폐지 추적 (`admin-stats.ts`, `admin2/queries.ts`, `app/api/` 카운트)

## 11. 부록 — 코드 본보기

### 11.1 `lib/domain/attendance/policies.ts`

```ts
const KST_TZ = 'Asia/Seoul';
const ALLOW_AHEAD_MS = 2 * 60 * 60 * 1000;

export function 유효한가(현재: Date, 출석시각: string): boolean {
    const koreaTime = new Date(현재.toLocaleString('en-US', { timeZone: KST_TZ }));
    const max = new Date(koreaTime.getTime() + ALLOW_AHEAD_MS);
    return new Date(출석시각) <= max;
}

export function 미등록허용(crew: { allow_unregistered_location: boolean }): boolean {
    return crew.allow_unregistered_location === true;
}
```

### 11.2 `lib/domain/attendance/policies.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import * as 출석정책 from './policies';

describe('출석 정책', () => {
    describe('유효한가', () => {
        it('30분 전 출석은 유효', () => { ... });
        it('현재 시간 출석은 유효', () => { ... });
        it('+2시간 경계 출석은 유효', () => { ... });
        it('+2시간 1분 출석은 거부', () => { ... });
    });

    describe('미등록허용', () => {
        it('crew.allow_unregistered_location=true 면 허용', () => { ... });
        it('false 면 거부', () => { ... });
    });
});
```

### 11.3 `app/attendance/actions.ts`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { waitUntil } from '@vercel/functions';
import { createClient } from '@/lib/supabase/server';
import * as 출석정책 from '@/lib/domain/attendance/policies';
import { 알림메시지_조립 } from '@/lib/domain/attendance/messages';
import { attendanceSubmissionSchema } from '@/lib/domain/attendance/validators';
import { sendNotification } from '@/lib/push/send-notification';
import { getPostHogServer, flushPostHog } from '@/lib/posthog/server';

export async function submitAttendance(input: unknown) {
    const supabase = await createClient();

    const parsed = attendanceSubmissionSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, message: '제출된 데이터가 유효하지 않습니다.', errors: parsed.error.flatten().fieldErrors };
    }

    const { userId, crewId, locationId, exerciseTypeId, isHost, attendanceTimestamp } = parsed.data;

    if (!출석정책.유효한가(new Date(), attendanceTimestamp)) {
        return { success: false, message: '허용된 시간 범위를 초과했습니다.' };
    }

    let locationName = '미등록 장소';
    if (locationId === 'unregistered') {
        const { data: crew } = await supabase
            .schema('attendance').from('crews')
            .select('allow_unregistered_location').eq('id', crewId).single();
        if (!crew || !출석정책.미등록허용(crew)) {
            return { success: false, message: '미등록 장소 출석이 허용되지 않은 크루입니다.' };
        }
    } else {
        const { data: loc } = await supabase
            .schema('attendance').from('crew_locations')
            .select('name').eq('id', locationId).eq('crew_id', crewId).eq('is_active', true).single();
        if (!loc) return { success: false, message: '선택한 장소를 찾을 수 없습니다.' };
        locationName = loc.name;
    }

    const { data: record, error } = await supabase
        .schema('attendance').from('attendance_records')
        .insert([{ user_id: userId, crew_id: crewId, exercise_type_id: exerciseTypeId, is_host: isHost, attendance_timestamp: attendanceTimestamp, location: locationName }])
        .select().single();

    if (error) return { success: false, message: '출석 기록 저장 중 오류가 발생했습니다.' };

    waitUntil((async () => {
        const { data: u } = await supabase.schema('attendance').from('users')
            .select('first_name, birth_year').eq('id', userId).single();
        const message = 알림메시지_조립({
            userName: u?.first_name ?? '회원',
            birthYear: u?.birth_year ?? null,
            timestamp: attendanceTimestamp,
            locationName,
        });
        await sendNotification(crewId, ['OWNER', 'CREW_MANAGER'], null, {
            type: 'attendance', title: '출석 알림', body: message, data: { crewId, locationName },
        });
        const ph = getPostHogServer();
        if (ph) {
            ph.capture({ distinctId: userId, event: 'server_attendance_recorded',
                properties: { crew_id: crewId, location: locationName, exercise_type_id: exerciseTypeId, is_host: isHost, attendance_timestamp: attendanceTimestamp } });
            await flushPostHog();
        }
    })());

    revalidatePath('/attendance');
    return { success: true, message: '출석이 성공적으로 기록되었습니다.', data: record };
}
```

## 12. 다음 단계

1. 본 design doc commit
2. `writing-plans` 스킬 호출 → Phase A(Step 0~6) 실행 계획 작성
3. 사용자 승인 후 Step 0(인프라)부터 실행

---

## 변경 이력

| 날짜 | 변경 | 사유 |
|------|------|------|
| 2026-04-28 | 초안 작성 | brainstorming 합의 결과 문서화 |
