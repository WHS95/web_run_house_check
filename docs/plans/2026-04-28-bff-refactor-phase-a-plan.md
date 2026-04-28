# BFF Refactor Phase A 실행 계획

> **For Claude:** REQUIRED SUB-SKILL: superpowers:executing-plans 또는 superpowers:subagent-driven-development. PM 모드(작업 에이전트 + 리뷰 에이전트 분리)로 진행.

**Goal:** `app/api/attendance/route.ts`(250줄)를 4계층 BFF로 분해하여 본보기 모듈을 완성한다. 동시에 BFF 룰을 ESLint·TDD·CI 스크립트로 강제하는 인프라를 갖춘다.

**Architecture:**
- 4계층 (page · actions · domain · RLS) 책임 분리
- `lib/domain/attendance/`에 비즈니스 룰을 한글 함수로 격리(Vitest 단위 테스트 1:1)
- `app/attendance/actions.ts`로 mutation 통일
- ESLint 7개 룰 + 보조 스크립트 2개로 회귀 차단

**Tech Stack:** Next.js 14 (App Router) · TypeScript 5.3 · Supabase SSR · Vitest · ESLint 8 · Zod

**Reference:** [`docs/plans/2026-04-28-bff-refactor-design.md`](./2026-04-28-bff-refactor-design.md)

---

## Pre-flight

### 사용자 부재 컨텍스트
- 데드라인: 2026-04-29 06:00 KST (검토 시각)
- 사용자 dirty 변경: `app/api/attendance/route.ts` 외 다수 (충돌 회피 필수)
- 새 브랜치: `feat/bff-refactor-phase-a` (생성 완료)

### PM 모드 룰
- 각 Task = (작업 에이전트 1회) + (리뷰 에이전트 1회)
- 리뷰 통과 시에만 다음 Task 진행
- 리뷰 실패 시: 작업 에이전트에 피드백 반영하여 재실행
- 작업 에이전트: `general-purpose` (또는 task-fit specialty agent)
- 리뷰 에이전트: `superpowers:code-reviewer`

### dirty 충돌 방지 룰
- BFF 작업은 **새 파일 추가** + **명시적으로 지정된 기존 파일 수정**만 허용
- 사용자 dirty 파일은 절대 우발적으로 수정 금지
- `git add -A` / `git add .` 금지 → 항상 명시적 파일 경로
- Step 5에서 `route.ts` 삭제 직전 사용자 dirty diff 분석 → 의미 있는 변경 actions.ts에 통합

### Phase A 호출자 (Step 4 대상)
```
components/pages/ClientAttendancePage.tsx:392
hooks/useOfflineAttendance.ts:71
```
(`grep -rn "/api/attendance" --include='*.ts*'` 결과)

---

## Task 0: BFF 인프라 (Step 0)

### Task 0.1 — Vitest 설치

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Create: `vitest.config.ts`

**Step 1: 의존성 설치**
```bash
npm i -D vitest@^2 tsx@^4
```

**Step 2: `vitest.config.ts` 생성**
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    test: { environment: 'node', include: ['lib/domain/**/*.test.ts'] },
});
```

**Step 3: `package.json` scripts 추가**
```jsonc
{
    "scripts": {
        "dev": "next dev --turbo",
        "test": "vitest run",
        "test:watch": "vitest",
        "test:domain": "vitest run lib/domain",
        "lint": "next lint",
        "typecheck": "tsc --noEmit",
        "check:bff": "tsx scripts/check-bff.ts && tsx scripts/check-domain-tests.ts",
        "build": "npm run check:bff && npm run test && npm run lint && npm run typecheck && next build",
        "start": "next start"
    }
}
```

**Step 4: 검증**
```bash
npx vitest --version  # → 2.x.x
```

**Step 5: 커밋 (Task 0.4 끝에 통합)**

---

### Task 0.2 — ESLint BFF 룰 7개

**Files:**
- Modify: `.eslintrc.json` (확장)

**Code:**
```jsonc
{
    "extends": "next",
    "overrides": [
        {
            "files": ["lib/domain/**/*.ts"],
            "rules": {
                "no-restricted-imports": ["error", {
                    "patterns": [
                        { "group": ["@/lib/supabase/*"], "message": "domain은 Supabase를 import할 수 없습니다." },
                        { "group": ["next/*"], "message": "domain은 Next 의존성을 가질 수 없습니다." },
                        { "group": ["react", "react-dom"], "message": "domain은 React 의존성을 가질 수 없습니다." },
                        { "group": ["@/app/**", "@/components/**"], "message": "domain은 UI를 역참조할 수 없습니다." }
                    ]
                }]
            }
        },
        {
            "files": ["app/**/page.tsx"],
            "rules": {
                "no-restricted-imports": ["error", {
                    "paths": [
                        { "name": "next/cache", "importNames": ["revalidatePath", "revalidateTag"], "message": "page.tsx는 mutation 책임이 없습니다 — actions.ts에서 호출하세요." }
                    ]
                }],
                "no-restricted-syntax": ["error", {
                    "selector": "Program > ExpressionStatement[expression.value='use client']",
                    "message": "page.tsx는 Server Component여야 합니다."
                }]
            }
        },
        {
            "files": ["app/**/*.{ts,tsx}"],
            "excludedFiles": ["app/api/dev/**"],
            "rules": {
                "no-restricted-imports": ["error", {
                    "patterns": [
                        { "group": ["@/lib/supabase/admin"], "message": "service_role은 화이트리스트(app/api/dev)만 사용 가능합니다." }
                    ]
                }]
            }
        }
    ]
}
```

**Verification:**
- `npm run lint` 통과 (기존 코드 영향 없음 확인)
- `lib/domain/`이 아직 비어 있어 영향 0

---

### Task 0.3 — 보조 스크립트 2개

**Files:**
- Create: `scripts/check-bff.ts`
- Create: `scripts/check-domain-tests.ts`

#### `scripts/check-bff.ts`
`app/api/`에 git에서 새로 추가된 파일이 있으면 fail.

```ts
import { execSync } from 'node:child_process';

// main 브랜치 대비 신규 추가 파일 검사
function getBaseBranch(): string {
    try {
        execSync('git rev-parse --verify origin/main', { stdio: 'ignore' });
        return 'origin/main';
    } catch {
        return 'main';
    }
}

const base = getBaseBranch();
let added: string[] = [];
try {
    const out = execSync(`git diff --name-only --diff-filter=A ${base}...HEAD`, { encoding: 'utf8' });
    added = out.split('\n').filter(Boolean);
} catch {
    // 비교 대상 없으면 통과 (브랜치 직후)
    process.exit(0);
}

const violations = added.filter((p) => p.startsWith('app/api/') && !p.startsWith('app/api/dev/'));
if (violations.length > 0) {
    console.error('[check-bff] app/api/ 신규 파일 추가 금지 (BFF 룰 C). 신규 mutation은 actions.ts에 작성하세요:');
    violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
}
console.log('[check-bff] OK: app/api/ 신규 추가 없음');
```

#### `scripts/check-domain-tests.ts`
`lib/domain/<name>/<file>.ts` 마다 `<file>.test.ts`가 있어야 함. (`types.ts`, `index.ts`, `*.test.ts` 자체 제외)

```ts
import { readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const DOMAIN_ROOT = path.resolve(__dirname, '..', 'lib', 'domain');
const SKIP = new Set(['types.ts', 'index.ts']);

function walk(dir: string): string[] {
    if (!existsSync(dir)) return [];
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) out.push(...walk(full));
        else if (name.endsWith('.ts') && !name.endsWith('.test.ts') && !SKIP.has(name)) out.push(full);
    }
    return out;
}

const files = walk(DOMAIN_ROOT);
const missing = files.filter((f) => {
    const testPath = f.replace(/\.ts$/, '.test.ts');
    return !existsSync(testPath);
});

if (missing.length > 0) {
    console.error('[check-domain-tests] 도메인 파일에 대응하는 *.test.ts가 없습니다:');
    missing.forEach((m) => console.error(`  - ${path.relative(process.cwd(), m)}`));
    process.exit(1);
}
console.log(`[check-domain-tests] OK: ${files.length}개 도메인 파일 모두 테스트 보유`);
```

---

### Task 0.4 — `lib/domain/` 골격 + 문서

**Files:**
- Create: `lib/domain/README.md`
- Modify: `CLAUDE.md` (BFF 섹션 추가)

#### `lib/domain/README.md`
설계 doc의 §3, §6 핵심 룰만 요약.

#### `CLAUDE.md` 추가 섹션
```markdown
## BFF 4계층 아키텍처 (필수)

자세한 설계는 [`docs/plans/2026-04-28-bff-refactor-design.md`](docs/plans/2026-04-28-bff-refactor-design.md) 참조.

### 4계층 책임
1. **page.tsx (RSC)**: 데이터 페치 + ViewModel 조립. 비즈니스 룰 금지.
2. **actions.ts (Server Action)**: auth → 도메인 함수 호출 → DB write → revalidate. 인라인 비즈니스 로직 금지.
3. **lib/domain/<name>/**: 순수 함수, Supabase·Next·React import 금지. 한글 함수명 + Vitest 테스트 1:1 필수.
4. **Supabase RLS**: 2차 방어층.

### 파일 컨벤션
- `app/<route>/{page.tsx, actions.ts, _components/, _vm/}`
- `lib/domain/<name>/{policies, workflow, validators, messages, types, *.test}.ts`
- `app/api/` **신규 추가 금지** (build에서 차단)

### `_vm/` 도입 기준 (1개라도 해당)
1. 쿼리 2개 이상 / 2. DB → ViewModel 변환 / 3. 가공 5줄+ / 4. redirect 분기 2개+ / 5. page.tsx 30줄 초과

### 한글 메소드명 (lib/domain/만)
- `boolean` → `~인가/~가능한가/~여부`
- `void` → `~하기`
- 변환 → `~생성/~조립`
- 검증 → `~검증`
- 타입·변수·필드는 영어 유지

### 강제 룰
- `npm run build` = check-bff + check-domain-tests + vitest + lint + typecheck + next build
- ESLint 7개 룰: domain → supabase/next/react/UI import 차단, page.tsx → revalidate/use client 차단, app → admin client 차단

### Phase 진행
- A: ⏳ attendance 본보기
- B: ⏳ auth / C: user / D: attendance(admin) / E: grade·notice·push / F: crew·location·invite / G: master·analyze
```

---

### Task 0.5 — 인프라 커밋

```bash
git add package.json package-lock.json vitest.config.ts \
        .eslintrc.json scripts/check-bff.ts scripts/check-domain-tests.ts \
        lib/domain/README.md CLAUDE.md
git commit -m "chore(bff): BFF 4계층 룰 + Vitest TDD 인프라 도입"
```

**Review gate:** `superpowers:code-reviewer`로 인프라 검토 → 통과 시 Task 1로 진행.

---

## Task 1: `lib/domain/attendance/policies` (Step 1, TDD)

### Task 1.1 — RED: 테스트 작성

**Files:**
- Create: `lib/domain/attendance/policies.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import * as 출석정책 from './policies';

describe('출석 정책', () => {
    describe('유효한가 (KST 기준 +2시간 윈도우)', () => {
        // 현재 시각을 KST 2026-04-28T21:00:00 으로 고정해 테스트
        const nowKstIso = '2026-04-28T12:00:00.000Z'; // = KST 21:00
        const now = new Date(nowKstIso);

        it('30분 전 출석은 유효', () => {
            expect(출석정책.유효한가(now, '2026-04-28T11:30:00.000Z')).toBe(true);
        });
        it('현재 시각 출석은 유효', () => {
            expect(출석정책.유효한가(now, nowKstIso)).toBe(true);
        });
        it('+2시간 경계는 유효', () => {
            expect(출석정책.유효한가(now, '2026-04-28T14:00:00.000Z')).toBe(true);
        });
        it('+2시간 1분 초과는 거부', () => {
            expect(출석정책.유효한가(now, '2026-04-28T14:01:00.000Z')).toBe(false);
        });
    });

    describe('미등록허용', () => {
        it('allow_unregistered_location=true면 허용', () => {
            expect(출석정책.미등록허용({ allow_unregistered_location: true })).toBe(true);
        });
        it('false면 거부', () => {
            expect(출석정책.미등록허용({ allow_unregistered_location: false })).toBe(false);
        });
    });
});
```

**Step 2: 실행 → 실패 확인**
```bash
npm run test:domain
```
Expected: FAIL (`Cannot find module './policies'`)

---

### Task 1.2 — GREEN: 최소 구현

**Files:**
- Create: `lib/domain/attendance/policies.ts`

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

**Step 2: 실행 → 통과 확인**
```bash
npm run test:domain
```
Expected: PASS (6 tests)

---

### Task 1.3 — 커밋

```bash
git add lib/domain/attendance/policies.ts lib/domain/attendance/policies.test.ts
git commit -m "feat(domain/attendance): 출석 정책 함수(유효한가, 미등록허용) + 단위 테스트"
```

**Review gate:** code-reviewer → 한글 컨벤션 / 순수성 / 테스트 커버리지 검토.

---

## Task 2: validators · messages · types (Step 2)

### Task 2.1 — `validators.ts` 이주

**Files:**
- Create: `lib/domain/attendance/validators.ts` (re-export로 영향 0)

```ts
// 기존 lib/validators/attendanceSchema.ts를 도메인 레이어로 노출
// 점진 폐지: lib/validators/attendanceSchema.ts는 deprecated, 새 import는 여기로
export { attendanceSubmissionSchema } from '@/lib/validators/attendanceSchema';
export type { AttendanceSubmissionData } from '@/lib/validators/attendanceSchema';
```

> 이주 전략: re-export로 시작 → Phase A 끝나면 `lib/validators/attendanceSchema.ts`의 본체를 도메인으로 옮기고 reverse re-export. Phase A에서는 import 경로 통일까지만.

---

### Task 2.2 — `messages.ts` (TDD)

**Files:**
- Create: `lib/domain/attendance/messages.test.ts`
- Create: `lib/domain/attendance/messages.ts`

#### RED
```ts
import { describe, it, expect } from 'vitest';
import { 알림메시지_조립 } from './messages';

describe('알림메시지_조립', () => {
    it('birthYear 있으면 (YY) 접미', () => {
        expect(
            알림메시지_조립({
                userName: '홍길동',
                birthYear: 1990,
                timestamp: '2026-04-28T12:00:00.000Z',
                locationName: '한강',
            })
        ).toBe('홍길동(90)님이 21:00분 한강에 출석을 하였습니다.');
    });

    it('birthYear 없으면 이름만', () => {
        expect(
            알림메시지_조립({
                userName: '홍길동',
                birthYear: null,
                timestamp: '2026-04-28T12:00:00.000Z',
                locationName: '한강',
            })
        ).toBe('홍길동님이 21:00분 한강에 출석을 하였습니다.');
    });

    it('userName 누락은 "회원"으로 폴백', () => {
        expect(
            알림메시지_조립({
                userName: null,
                birthYear: null,
                timestamp: '2026-04-28T12:00:00.000Z',
                locationName: '한강',
            })
        ).toBe('회원님이 21:00분 한강에 출석을 하였습니다.');
    });
});
```

#### GREEN
```ts
const KST_TZ = 'Asia/Seoul';

export interface AttendanceMessageInput {
    userName: string | null;
    birthYear: number | null;
    timestamp: string;
    locationName: string;
}

export function 알림메시지_조립(input: AttendanceMessageInput): string {
    const userName = input.userName || '회원';
    const birthSuffix = input.birthYear != null ? String(input.birthYear).slice(-2) : null;
    const displayName = birthSuffix ? `${userName}(${birthSuffix})` : userName;
    const time = new Date(input.timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: KST_TZ,
    });
    return `${displayName}님이 ${time}분 ${input.locationName}에 출석을 하였습니다.`;
}
```

```bash
npm run test:domain
```

---

### Task 2.3 — `types.ts`

**Files:**
- Create: `lib/domain/attendance/types.ts`

```ts
import type { AttendanceSubmissionData } from './validators';

export type AttendanceInput = AttendanceSubmissionData;

export interface AttendanceLocationContext {
    locationId: number | 'unregistered';
    locationName: string;
}

export interface AttendanceSubmitResult {
    success: boolean;
    message: string;
    data?: unknown;
    errors?: Record<string, string[] | undefined>;
}
```

---

### Task 2.4 — 커밋

```bash
git add lib/domain/attendance/{validators,messages,types}.ts lib/domain/attendance/messages.test.ts
git commit -m "feat(domain/attendance): validators · messages · types 추가"
```

**Review gate:** code-reviewer.

---

## Task 3: `app/attendance/actions.ts` 신설 (Step 3)

### Task 3.1 — 작성

**Files:**
- Create: `app/attendance/actions.ts`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { waitUntil } from '@vercel/functions';
import { createClient } from '@/lib/supabase/server';
import * as 출석정책 from '@/lib/domain/attendance/policies';
import { 알림메시지_조립 } from '@/lib/domain/attendance/messages';
import { attendanceSubmissionSchema } from '@/lib/domain/attendance/validators';
import type { AttendanceSubmitResult } from '@/lib/domain/attendance/types';
import { sendNotification } from '@/lib/push/send-notification';
import { getPostHogServer, flushPostHog } from '@/lib/posthog/server';

export async function submitAttendance(
    input: unknown
): Promise<AttendanceSubmitResult> {
    const supabase = await createClient();

    const parsed = attendanceSubmissionSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            message: '제출된 데이터가 유효하지 않습니다.',
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    const {
        userId,
        crewId,
        locationId,
        exerciseTypeId,
        isHost,
        attendanceTimestamp,
    } = parsed.data;

    if (!출석정책.유효한가(new Date(), attendanceTimestamp)) {
        return { success: false, message: '허용된 시간 범위를 초과했습니다.' };
    }

    let locationName = '미등록 장소';
    if (locationId === 'unregistered') {
        const { data: crew } = await supabase
            .schema('attendance')
            .from('crews')
            .select('allow_unregistered_location')
            .eq('id', crewId)
            .single();
        if (!crew || !출석정책.미등록허용(crew)) {
            return {
                success: false,
                message:
                    '미등록 장소 출석이 허용되지 않은 크루입니다.',
            };
        }
    } else {
        const { data: loc, error: locErr } = await supabase
            .schema('attendance')
            .from('crew_locations')
            .select('name')
            .eq('id', locationId)
            .eq('crew_id', crewId)
            .eq('is_active', true)
            .single();
        if (locErr || !loc) {
            return {
                success: false,
                message:
                    '선택한 장소를 찾을 수 없거나 현재 크루에서 사용할 수 없는 장소입니다.',
            };
        }
        locationName = loc.name;
    }

    const { data: record, error } = await supabase
        .schema('attendance')
        .from('attendance_records')
        .insert([
            {
                user_id: userId,
                crew_id: crewId,
                exercise_type_id: exerciseTypeId,
                is_host: isHost,
                attendance_timestamp: attendanceTimestamp,
                location: locationName,
            },
        ])
        .select()
        .single();

    if (error) {
        return {
            success: false,
            message: '출석 기록 저장 중 오류가 발생했습니다.',
        };
    }

    waitUntil(
        (async () => {
            try {
                const { data: u } = await supabase
                    .schema('attendance')
                    .from('users')
                    .select('first_name, birth_year')
                    .eq('id', userId)
                    .single();
                const message = 알림메시지_조립({
                    userName: u?.first_name ?? null,
                    birthYear: u?.birth_year ?? null,
                    timestamp: attendanceTimestamp,
                    locationName,
                });
                await sendNotification(crewId, ['OWNER', 'CREW_MANAGER'], null, {
                    type: 'attendance',
                    title: '출석 알림',
                    body: message,
                    data: { crewId, locationName },
                });
            } catch (e) {
                console.error('[attendance push] send failed:', e);
            }
            const ph = getPostHogServer();
            if (ph) {
                ph.capture({
                    distinctId: userId,
                    event: 'server_attendance_recorded',
                    properties: {
                        crew_id: crewId,
                        location: locationName,
                        exercise_type_id: exerciseTypeId,
                        is_host: isHost,
                        attendance_timestamp: attendanceTimestamp,
                    },
                });
                await flushPostHog();
            }
        })()
    );

    revalidatePath('/attendance');
    return {
        success: true,
        message: '출석이 성공적으로 기록되었습니다.',
        data: record,
    };
}
```

### Task 3.2 — 빌드 확인

```bash
npm run typecheck
npm run lint
```

### Task 3.3 — 커밋

```bash
git add app/attendance/actions.ts
git commit -m "feat(attendance): submitAttendance Server Action 추가 (route.ts와 병행 운영)"
```

**Review gate:** code-reviewer → 4계층 룰 준수, waitUntil 부수효과 분리, 응답 형태 호환 확인.

---

## Task 4: 클라이언트 마이그레이션 (Step 4)

### Task 4.1 — `components/pages/ClientAttendancePage.tsx` 변환

**Files:**
- Modify: `components/pages/ClientAttendancePage.tsx` (line 392 부근의 `fetch('/api/attendance', ...)` 호출)

**Pattern:**
```tsx
// Before
const response = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
});
const result = await response.json();

// After
import { submitAttendance } from "@/app/attendance/actions";
const result = await submitAttendance(payload);
```

응답 객체 구조 동일(`{ success, message, data?, errors? }`)이므로 후속 처리 코드 변경 최소.

### Task 4.2 — `hooks/useOfflineAttendance.ts` 변환

**Files:**
- Modify: `hooks/useOfflineAttendance.ts` (line 71 부근)

동일 패턴.

### Task 4.3 — 빌드 확인 + 커밋

```bash
npm run typecheck
npm run lint
git add components/pages/ClientAttendancePage.tsx hooks/useOfflineAttendance.ts
git commit -m "refactor(attendance): fetch → submitAttendance Server Action 직접 호출"
```

**Review gate:** code-reviewer.

---

## Task 5: dirty 통합 + legacy 제거 (Step 5)

### Task 5.1 — 사용자 dirty diff 분석

```bash
git diff main -- app/api/attendance/route.ts
```
변경분이 있으면:
- 비즈니스 룰 변경 → `lib/domain/attendance/policies.ts` 또는 `messages.ts`에 흡수
- 부수효과 변경 → `app/attendance/actions.ts`에 흡수
- 코드 정리/리팩토링 → 무시

### Task 5.2 — 통합 결과를 actions에 반영 후 추가 커밋
변경분이 의미 있을 경우만:
```bash
git add lib/domain/attendance/<file>.ts app/attendance/actions.ts
git commit -m "feat(attendance): 사용자 dirty 변경분 통합"
```

### Task 5.3 — `route.ts` 삭제

```bash
rm app/api/attendance/route.ts
```

### Task 5.4 — `npm run build` 통과 확인

```bash
npm run build
```
- check-bff.ts: app/api/ 신규 없음 → OK
- check-domain-tests.ts: 모든 도메인 파일 테스트 보유 → OK
- vitest: PASS
- lint/typecheck: PASS
- next build: PASS

### Task 5.5 — 커밋

```bash
git add app/api/attendance/route.ts
git commit -m "chore(attendance): legacy /api/attendance route 제거 (BFF 마이그레이션 완료)"
```

**Review gate:** code-reviewer + qa 체크리스트(아래) 보고.

### Task 5.6 — 회귀 시나리오 (수동 검증 항목, 보고서에 기록)

- [ ] 정상 출석 등록 → 알림 + PostHog
- [ ] +3h 미래 시간 → 거부
- [ ] 미등록 장소 + crew 미허용 → 거부
- [ ] 미등록 장소 + crew 허용 → 통과
- [ ] 오프라인 큐 재시도 정상

(자동화 곤란 → 사용자 검토 시 직접 확인)

---

## Task 6: 룰 차단 작동 검증 (Step 6)

### Task 6.1 — Domain → Supabase import 차단

`lib/domain/attendance/policies.ts` 맨 위에 `import { createClient } from '@/lib/supabase/server';` 추가 → `npm run lint` 실행 → 에러 메시지 캡처 → 되돌리기.

### Task 6.2 — `app/api/` 신규 파일 차단

`touch app/api/__test/route.ts` → `npm run check:bff` 실행 → fail 메시지 캡처 → `rm app/api/__test/route.ts`.

### Task 6.3 — 결과를 보고서(Task 7)에 기록 (커밋 없음)

---

## Task 7: 완료 보고서

### Files
- Create: `docs/plans/2026-04-28-bff-refactor-phase-a-report.md`

### 포함 항목
1. 머지된 commit 리스트 (한 줄씩)
2. 변경 파일 트리
3. 회귀 시나리오 체크리스트(수동 검증 사용자에게 위임)
4. 룰 차단 검증 증거(Step 6 캡처)
5. 시간 여유 시 Phase B 진입 여부 + 진입했다면 그 결과
6. 사용자가 복귀 후 해야 할 일 목록

### 커밋
```bash
git add docs/plans/2026-04-28-bff-refactor-phase-a-report.md
git commit -m "docs(bff): Phase A 완료 보고서 추가"
```

---

## (시간 여유 시) Phase B Skeleton

설계 doc §9.2 G1(auth)부터 진입. 같은 7-Step 패턴으로:
- `lib/domain/auth/` (policies/validators/types) TDD
- `app/auth/signup/actions.ts`, `app/auth/verify-crew/actions.ts` 신설
- `app/api/auth/signup/route.ts`, `app/api/auth/verify-crew-code/route.ts`, `app/api/crew-verification/route.ts` 클라이언트 변환
- legacy 삭제 + build 통과
- 보고서에 기록

시간 부족 시 Phase B는 진입하지 않고 Phase A 완성도에 집중.

---

## 실행 후 PR 생성 (사용자 복귀 후 결정)

본 계획은 push 또는 PR 생성을 자동으로 수행하지 않음. Phase A 완료 후 사용자 복귀 시 다음 옵션을 제시:
1. 그대로 main에 머지 (squash 권장)
2. PR 생성하여 검토 후 머지
3. 일부 commit revert 후 머지

`feat/bff-refactor-phase-a` 브랜치는 push 안 된 상태로 사용자 결정 대기.
