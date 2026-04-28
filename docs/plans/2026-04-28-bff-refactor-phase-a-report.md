# BFF Refactor Phase A 완료 보고서

- **작성일**: 2026-04-29 (KST)
- **브랜치**: `feat/bff-refactor-phase-a` (push 안 됨, 사용자 결정 대기)
- **데드라인**: 2026-04-29 06:00 KST 검토
- **진행 모드**: PM 모드 (worker 에이전트 위임 + code-reviewer 검토)

## 1. 진행 결과 요약

| Step | 상태 | 비고 |
|------|------|------|
| 0. BFF 인프라 (Vitest, ESLint, 스크립트, README, CLAUDE.md) | ✅ | reviewer NEEDS FIX → BLOCKER-1 + MINOR-2 fix 후 재검증 통과 |
| 1. `lib/domain/attendance/policies` (TDD) | ✅ | 6 tests PASS |
| 2. validators · messages · types | ✅ | +7 tests, 누계 13 tests PASS |
| 3. `app/attendance/actions.ts` 신설 | ✅ | route.ts와 병행 운영 단계 |
| 4. 클라이언트 마이그레이션 | ✅ | ClientAttendancePage + useOfflineAttendance |
| 5. legacy route.ts 삭제 | ✅ | 사용자 dirty(`userId → null`) 의미 보존 |
| 6. 룰 차단 작동 검증 | ✅ | 3종 모두 정상 차단 확인 |
| 7. 보고서 (본 문서) | 진행 중 | |

## 2. 머지된 커밋 (Phase A 한정)

```
2a8fb771 chore(attendance): legacy /api/attendance route 제거 (BFF 마이그레이션 완료)
6cb8a2f2 refactor(attendance): fetch → submitAttendance Server Action 직접 호출
73b8d431 feat(attendance): submitAttendance Server Action 추가 (route.ts 병행 운영)
1d4ca47b feat(domain/attendance): validators · messages · types 추가
73c32ff3 feat(domain/attendance): 출석 정책 함수 + 단위 테스트 (TDD)
bfc714d8 chore(bff): BFF 4계층 룰 + Vitest TDD 인프라 도입
c16cf12c docs(bff): Phase A 실행 계획 추가
9205ef83 docs(bff): BFF 4계층 리팩토링 설계 문서 추가  ← main에서 분기 직후 첫 커밋
```

## 3. 변경 파일 트리

```
app/
├── attendance/
│   └── actions.ts                          [신규] 161줄, BFF Server Action
└── api/
    └── attendance/
        └── route.ts                        [삭제] 256줄, legacy

components/
└── pages/
    └── ClientAttendancePage.tsx            [수정] fetch → submitAttendance

hooks/
└── useOfflineAttendance.ts                 [수정] fetch → submitAttendance + number→string 변환

lib/
└── domain/
    ├── README.md                           [신규] 한글 컨벤션 + 금지 패턴
    └── attendance/
        ├── policies.ts                     [신규] 유효한가, 미등록허용
        ├── policies.test.ts                [신규] 6 tests
        ├── validators.ts                   [신규] schema re-export
        ├── validators.test.ts              [신규] 3 tests
        ├── messages.ts                     [신규] 알림메시지_조립
        ├── messages.test.ts                [신규] 4 tests
        └── types.ts                        [신규] AttendanceInput 등 도메인 타입

scripts/
├── check-bff.ts                            [신규] app/api/ 신규 차단
└── check-domain-tests.ts                   [신규] 도메인 ↔ 테스트 1:1

vitest.config.ts                            [신규] passWithNoTests
.eslintrc.json                              [수정] BFF 룰 7개 (1~4 error, 5~6 warn)
package.json                                [수정] scripts: test, typecheck, check:bff, build 통합
package-lock.json                           [수정] vitest, tsx 추가
CLAUDE.md                                   [수정] BFF 4계층 섹션
docs/plans/
├── 2026-04-28-bff-refactor-design.md       [신규] 설계 문서
├── 2026-04-28-bff-refactor-phase-a-plan.md [신규] 실행 계획
└── 2026-04-28-bff-refactor-phase-a-report.md [신규] 본 보고서
```

## 4. 빌드 검증 결과

```
$ npm run build
[check-bff] OK: app/api/ 신규 추가 없음
[check-domain-tests] OK: 3개 도메인 파일 모두 테스트 보유
✓ 13 tests PASS (validators 3, policies 6, messages 4)
✓ ESLint 0 error (warnings만, 모두 룰 5/6 단계적 활성화 항목)
✓ tsc --noEmit 0 error
✓ next build 성공 (route 목록에 /api/attendance 없음 확인)
```

## 5. 룰 차단 작동 증거 (Step 6)

### 5.1 도메인에서 Supabase import 차단
```
$ echo "import { createClient } from '@/lib/supabase/server'" > lib/domain/__probe/probe.ts
$ npm run lint
Error: '@/lib/supabase/server' import is restricted from being used by a pattern.
       domain은 Supabase를 import할 수 없습니다.  no-restricted-imports
```

### 5.2 page.tsx에서 revalidatePath import 차단
```
$ echo "import { revalidatePath } from 'next/cache'" > app/__probe/page.tsx
$ npm run lint
Error: 'revalidatePath' import from 'next/cache' is restricted.
       page.tsx는 mutation 책임이 없습니다 — actions.ts에서 호출하세요.  no-restricted-imports
```

### 5.3 `app/api/` 신규 파일 차단
```
$ touch app/api/__bff_test/route.ts
$ npx tsx scripts/check-bff.ts; echo "exit: $?"
[check-bff] app/api/ 신규 파일 추가 금지 (BFF 룰 C). 신규 mutation은 actions.ts에 작성하세요:
  - app/api/__bff_test/route.ts
exit: 1
```

세 케이스 모두 빌드 차단 확인. probe 파일은 검증 직후 모두 정리 완료.

## 6. 회귀 시나리오 체크리스트 (사용자 수동 검증 필요)

`npm run dev`로 개발 서버 실행 후 다음 시나리오 검증을 권장:

- [ ] **정상 출석 등록**
    - 로그인 → /attendance → 폼 작성 → 제출 → "출석이 완료되었습니다!" 토스트
    - 출석 알림 푸시 수신 (운영자 계정에서 확인)
    - PostHog `server_attendance_recorded` + `attendance_submitted` 이벤트
- [ ] **미래 시간 +3시간 → 거부**
    - 시간을 +3시간 미래로 설정 → 제출 → "허용된 시간 범위를 초과했습니다." 메시지
- [ ] **미등록 장소 + crew 미허용 → 거부**
    - 미등록 장소 옵션 선택 → 제출 → "미등록 장소 출석이 허용되지 않은 크루입니다." 메시지
- [ ] **미등록 장소 + crew 허용 → 통과**
    - Supabase에서 해당 crew의 `allow_unregistered_location = true`로 설정 → 출석 → 성공 + 알림 메시지의 location 부분이 "미등록 장소"로 표시
- [ ] **본인 알림 수신** (사용자 dirty 의도 보존 확인)
    - 출석자가 OWNER/CREW_MANAGER일 때 자기 출석 알림이 자기 디바이스로 수신되는지
- [ ] **오프라인 큐 재시도**
    - DevTools에서 네트워크를 offline으로 설정 → 출석 → "오프라인 출석이 저장되었습니다" 토스트
    - 네트워크 복구 → 큐 자동 flush → 출석 알림 푸시 수신

자동화 곤란 (실제 PostHog/푸시/모바일 PWA 동작 필요).

## 7. 사용자 검토 시 의사결정 항목

### 7.1 머지 방식
- **Option A (권장)**: feat/bff-refactor-phase-a → main 머지 (squash 또는 merge commit)
- **Option B**: GitHub PR 생성 후 검토 + 머지
- **Option C**: 일부 commit revert (예: route.ts 삭제만 보류)

### 7.2 룰 5/6 (page.tsx `'use client'`, app → admin client) 격상 시점
- 현재 warn 상태. 28건 위반 코드가 존재 (12 page.tsx + 14 admin import).
- **권장**: Phase A 머지 직후 별도 cleanup PR로 위반 일괄 해소 + warn → error 격상.
- 설계 doc §10.1 "자동 차단 시퀀스" 완전 활성화.

### 7.3 사용자 dirty 변경 처리
- main에 dirty 상태로 남아있는 변경분(`app/admin2/...`, `components/...`, `app/layout.tsx`, `app/styles/globals.css` 등)은 본 Phase A 작업에서 일체 건드리지 않음.
- Phase A 머지 후 사용자가 별도 PR로 처리해야 함.

## 8. Phase B 진입 여부

- 데드라인까지 약 4시간 30분 남음 (작성 시점 기준).
- Phase B는 G1(auth, route 3개 — `auth/signup`, `auth/verify-crew-code`, `crew-verification`).
- **본 보고서 작성 후 시간이 충분하면 Phase B 진입 시도. 그렇지 않으면 Phase A 완성도 우선.**
- Phase B 결과는 본 보고서 §10에 추가.

## 9. 알려진 이슈 / 후속 작업

| # | 이슈 | 우선순위 | 처리 |
|---|------|---------|------|
| 1 | 기존 12개 page.tsx의 `'use client'` 위반 | High | Phase A 머지 후 cleanup PR |
| 2 | 기존 14개 파일의 `@/lib/supabase/admin` 직접 사용 | High | 동일 |
| 3 | `lib/validators/attendanceSchema.ts`가 도메인 본체의 source — 점진 폐지 | Medium | Phase B/C 진행 중 본체 이동 + reverse re-export |
| 4 | `check-bff.ts` base ref 미발견 시 fail-open 거동 | Low | README에 명시됨 |
| 5 | `lib/admin-stats.ts` (830줄) DB 호출 + 비즈니스 룰 혼재 | High | Phase G(stats) 작업 시 분해 |

## 10. Phase B (G1: auth) 진입 결과 ✅ 완료

### 10.1 진행 결과 요약

| Step | 상태 | 비고 |
|------|------|------|
| B-0. (인프라 재사용) | ✅ | Phase A 인프라 그대로 사용 |
| B-1. `lib/domain/auth/` TDD | ✅ | 22 tests PASS (policies 9, validators 5, workflows 8) |
| B-2. `app/auth/{signup,verify-crew}/actions.ts` 신설 | ✅ | 4 Server Actions, 누계 35 tests |
| B-3. 클라이언트 3곳 변환 | ✅ | page.tsx 2곳, CrewVerificationForm 1곳 |
| B-4. legacy 3개 route 삭제 + build | ✅ | 534줄 제거, build 통과 |

### 10.2 머지된 커밋 (Phase B)

```
09aad485 chore(auth): legacy auth route 3개 제거 (BFF 마이그레이션 완료)
9296d1cd refactor(auth): fetch → Server Action 직접 호출 (3 호출자)
a7f04dc9 feat(auth): Server Actions 4개 추가 (route 3개와 병행 운영)
56bad83b feat(domain/auth): auth 도메인 신설 (TDD, 22 tests)
```

### 10.3 변경 파일 트리 (Phase B)

```
app/
├── auth/
│   ├── signup/
│   │   ├── actions.ts                  [신규] verifyCrewCodeAction + signupAction
│   │   └── page.tsx                    [수정] fetch → action 직접 호출 (2곳)
│   └── verify-crew/
│       └── actions.ts                  [신규] verifyCrewMembershipAction + getCrewVerificationStatusAction
└── api/                                [3개 route 삭제]
    ├── auth/                           [폴더째 삭제]
    └── crew-verification/              [삭제]

components/
└── auth/
    └── CrewVerificationForm.tsx        [수정] fetch → action

lib/
└── domain/
    └── auth/                           [신규]
        ├── policies.ts                 초대코드_유효한가, 인증된_사용자인가, 크루정보_완전한가
        ├── policies.test.ts            9 tests
        ├── validators.ts               signupSchema(re-export), verifyCrewCodeSchema, crewVerificationSchema
        ├── validators.test.ts          5 tests
        ├── workflows.ts                가입_upsert_payload_조립 (OAuth + Kakao 특수 + NOT NULL 보존)
        ├── workflows.test.ts           8 tests
        └── types.ts                    AuthActionResult, VerifyCrewCodeOk, CrewMembershipVerificationOk, CrewVerificationStatus
```

### 10.4 빌드 검증 (Phase B 직후)

```
✓ check-bff OK (app/api/ 신규 추가 없음)
✓ check-domain-tests OK (6개 도메인 파일)
✓ 35 tests PASS (attendance 13 + auth 22)
✓ ESLint 0 error
✓ tsc --noEmit 0 error
✓ next build 성공 (route 목록에서 /api/auth/*, /api/crew-verification 제거 확인)
```

### 10.5 사용자 검토 항목 (Phase B 한정)

회귀 시나리오 (수동 검증):
- [ ] **회원가입 흐름**: 로그인(Google/Kakao) → 가입 폼 → 크루 코드 입력 + 검증(verifyCrewCodeAction) → 폼 제출(signupAction) → 성공 토스트 + PostHog `server_signup_completed`
- [ ] **회원가입 거부 케이스**:
    - 비활성 크루 코드 → "비활성화된 크루 코드입니다."
    - 존재하지 않는 코드 → "존재하지 않는 크루 코드입니다."
    - 중복 IP rate limit (10회/분 verify, 5회/분 signup)
- [ ] **크루 인증 흐름** (이미 가입된 사용자가 크루 인증만): /auth/verify-crew → 초대 코드 입력 → "크루 인증이 완료되었습니다!"
- [ ] **이미 인증된 사용자 거부**: "이미 크루에 인증된 사용자입니다."
- [ ] **사용자의 dirty 의도 (signup eff98798) 보존 확인**: NOT NULL 제약 username/password_hash 자동 채움이 가입_upsert_payload_조립에 들어 있는지 (코드 검토만 OK)

### 10.6 알려진 이슈 (Phase B 한정)

- `lib/supabase/crew-auth.ts`의 `verifyCrewInviteCode`는 'use client' 모듈이라 서버에서 호출하면 안 됨 — Phase B에서 actions.ts에 동등 로직을 직접 작성하여 격리. 단 클라이언트(/admin2/...) 측에서 여전히 사용 중 (필요 시 후속 정리).
- `getCrewVerificationStatusAction`은 현재 호출자 0건 (route GET dead code 였음). 미래 사용 가능성 있어 유지.

## 11. Phase C (G2: user) 부분 완료

### 11.1 진행 결과

| Step | 상태 | 비고 |
|------|------|------|
| C-1. `lib/domain/user/` TDD | ✅ | 9 tests, `사용자_활성여부_판정` |
| C-2. `app/mypage/actions.ts` 신설 | ✅ | `getUserStatusAction`, `withdrawUserAction` (service_role 그대로) |
| C-3. `MemberDetailTemplate.tsx` 변환 | ✅ | fetch → action |
| C-4. legacy 2개 route 삭제 | ✅ | `user/status`, `user/withdraw` |
| **C-5. admin/users + admin/crew-members** | ⏸️ **보류** | 호출자 9곳, admin2 라인 결합. 데드라인 시간 부족. |

### 11.2 머지된 커밋 (Phase C)

```
45b1ab07 refactor(user): MemberDetailTemplate fetch → withdrawUserAction + legacy 2 routes 삭제
ab4408c2 feat(domain/user): user 도메인 + mypage Server Actions
```

### 11.3 변경 파일 트리 (Phase C)

```
app/
├── mypage/
│   └── actions.ts                      [신규] getUserStatusAction + withdrawUserAction
└── api/
    └── user/                           [폴더째 삭제]
        ├── status/route.ts
        └── withdraw/route.ts

components/
└── templates/
    └── MemberDetailTemplate.tsx        [수정] fetch → withdrawUserAction

lib/
└── domain/
    └── user/                           [신규]
        ├── policies.ts                 사용자_활성여부_판정 (status 우선순위 5단)
        ├── policies.test.ts            9 tests
        └── types.ts                    UserStatusActionResult, UserWithdrawActionResult
```

### 11.4 빌드 검증 (Phase C 직후)

```
✓ 44 tests PASS (attendance 13 + auth 22 + user 9)
✓ check-bff OK / check-domain-tests OK (7 files)
✓ typecheck 0 error / ESLint 0 error
✓ next build 성공 (route 목록에서 /api/user/* 모두 제거 확인)
```

### 11.5 사용자 검토 항목 (Phase C)

회귀 시나리오 (수동 검증):
- [ ] **본인 탈퇴**: /mypage → 마이페이지 → 탈퇴 버튼 → "탈퇴가 완료되었습니다." → /auth/login 리다이렉트
- [ ] **탈퇴 실패 케이스**: 잘못된 권한 등 → 알럿 메시지 표기
- [ ] **`getUserStatusAction`** (현재 호출자 0건): 사용자 dirty의 ClientAttendancePage `userStatus` prop 채움 위해 미래 호출 가능. 수동 호출 검증 권장.

### 11.6 보류 사유 — `admin/users`, `admin/crew-members`

| route | 줄 수 | 호출자 | 보류 이유 |
|------|------|--------|----------|
| `app/api/admin/users/route.ts` | 55 | 6+곳 (admin2 settings, push, organisms 등) | 호출자 분포 + admin2 dirty와 부분 겹침 |
| `app/api/admin/crew-members/route.ts` | 238 | 5+곳 (BulkAttendance, MembersTab 등) | 가장 큰 admin route. 호출자 다수 |

이 두 route는 다음 작업 단위로 진입 권장 (별도 PR + 충분한 시간 + 회귀 검증).

## 12. 최종 진행 요약 (사용자 복귀 시점 기준)

### 12.1 마이그레이션 커버리지

| 그룹 | 진행 | 상세 |
|------|------|------|
| **Phase A** (attendance 본보기) | ✅ 완료 | route 1개 → actions, 13 tests |
| **Phase B** (G1: auth) | ✅ 완료 | route 3개 → actions 4개, 22 tests |
| **Phase C** (G2: user 부분) | 🟡 부분 | route 2/4 완료 (status, withdraw). admin/users·crew-members 보류 |
| **Phase D~G** (G3~G9) | ⏸️ 보류 | attendance(admin), grade, notice/push, crew/location, invite, master, analyze (총 28+ routes) |

### 12.2 누계 변경

- **신규 도메인 파일**: 13개 (`lib/domain/{attendance,auth,user}`)
- **Vitest 테스트**: 44 tests, 7 도메인 파일 모두 1:1 보유
- **Server Actions**: 7개 (submitAttendance, verifyCrewCodeAction, signupAction, verifyCrewMembershipAction, getCrewVerificationStatusAction, getUserStatusAction, withdrawUserAction)
- **삭제된 legacy route**: 6개 (attendance, auth/signup, auth/verify-crew-code, crew-verification, user/status, user/withdraw)
- **남은 `app/api/`**: 32개 (admin/* 19, master/* 5, push/* 2, notifications 1, crew-locations 1, dev/login 1, ping 1)
- **변환된 클라이언트**: 6 호출 사이트
- **인프라**: ESLint 7개 룰 (1~4 error, 5~6 warn 단계), Vitest, check-bff, check-domain-tests

### 12.3 Phase별 commit hash

```
[Phase A]
2a8fb771 chore(attendance): legacy /api/attendance route 제거
6cb8a2f2 refactor(attendance): fetch → submitAttendance Server Action 직접 호출
73b8d431 feat(attendance): submitAttendance Server Action 추가
1d4ca47b feat(domain/attendance): validators · messages · types
73c32ff3 feat(domain/attendance): 출석 정책 함수 + 단위 테스트
bfc714d8 chore(bff): BFF 4계층 룰 + Vitest TDD 인프라 도입
c16cf12c docs(bff): Phase A 실행 계획 추가
9205ef83 docs(bff): BFF 4계층 리팩토링 설계 문서 추가
bf41dae7 docs(bff): Phase A 완료 보고서 추가

[Phase B]
09aad485 chore(auth): legacy auth route 3개 제거
9296d1cd refactor(auth): fetch → Server Action 직접 호출 (3 호출자)
a7f04dc9 feat(auth): Server Actions 4개 추가
56bad83b feat(domain/auth): auth 도메인 신설 (TDD, 22 tests)
109024c2 docs(bff): 보고서에 Phase B (auth) 결과 추가

[Phase C]
45b1ab07 refactor(user): MemberDetailTemplate fetch → withdrawUserAction + legacy 2 routes 삭제
ab4408c2 feat(domain/user): user 도메인 + mypage Server Actions
```

### 12.4 사용자 복귀 시 핵심 액션

1. **브랜치 확인**: `git checkout feat/bff-refactor-phase-a && git log --oneline main..HEAD`
2. **빌드 재현**: `npm run build` (모든 검증 통과 확인)
3. **회귀 검증** (수동, dev 서버):
   - 출석 등록 흐름 (Phase A)
   - 회원가입/크루 인증 흐름 (Phase B)
   - 본인 탈퇴 흐름 (Phase C)
4. **머지 결정**: 일괄 squash 또는 PR 생성 후 검토
5. **다음 단계**: `admin/users`, `admin/crew-members` 처리 + 룰 5/6 격상 cleanup PR


---

## 부록: 사용자 복귀 후 첫 명령 권장

```bash
# 1. 브랜치 확인
git checkout feat/bff-refactor-phase-a
git log --oneline main..HEAD

# 2. 상태 확인
git status

# 3. 빌드 검증 (재현)
npm run build

# 4. 도메인 테스트만
npm run test:domain

# 5. 개발 서버 띄워 회귀 시나리오 (§6) 직접 검증
npm run dev
```
