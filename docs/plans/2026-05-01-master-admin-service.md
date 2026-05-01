# Master Admin Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/master` 영역을 크루 단위 운영자(`/admin2`)와 분리된 **서비스 레벨 마스터 어드민**으로 재정비한다 — 전체 서비스 자체를 관리, 신규 크루 등록·삭제, 크루 활동 점검, 초대코드/푸시/공지 통합 관리.

**Architecture:** BFF 4계층 엄수 — `app/master/{page.tsx, layout.tsx, actions.ts, [route]/...}` (RSC + 서버 액션) + `lib/domain/master/` (순수 정책·워크플로) + Supabase RPC + RLS 보조. 기존 `app/master/page.tsx`(`'use client'` 단일 탭)을 sub-route 구조로 분해하고, 대시보드·크루 CRUD·크루 활동 점검 페이지를 신규 추가. master 권한 = `user_roles.role_id = 1`.

**Tech Stack:** Next.js 14 App Router (RSC + Server Actions), Supabase (Postgres + RPC), TypeScript, Tailwind, RunHouse 디자인 토큰(`--rh-*`), Vitest (도메인 단위 테스트), Framer Motion (`AnimatedList`/`FadeIn`).

**작업 모드:** Subagent-Driven (이 세션 내 PM 오케스트레이션). Claude는 PM, 작업은 `feature-builder`/`general-purpose` subagent 위임 → `code-reviewer` subagent로 리뷰 → 통과 시 다음 단계 → 승인되면 한국어 atomic 커밋.

---

## 도메인 / 엔티티 매핑

| 영역 | 테이블/컬럼 | 비고 |
|------|------------|-----|
| 마스터 권한 | `attendance.user_roles.role_id = 1` | `roles.name = 'MASTER_ADMIN'` |
| 크루 | `attendance.crews` | id/name/description/profile_image_url/region/max_members/location_based_attendance/accuracy_range/allow_unregistered_location |
| 크루 멤버 | `attendance.user_crews(user_id, crew_id, crew_role, status, joined_at)` | crew_role: OWNER/CREW_MANAGER/MEMBER, status: ACTIVE/SUSPENDED/INACTIVE |
| 크루 활동 | `attendance.attendance_records(user_id, crew_id, attendance_timestamp, exercise_type_id, location, is_host, deleted_at)` | soft delete = `deleted_at IS NOT NULL` |
| 초대코드 | `attendance.crew_invite_codes` | is_first_admin_code/consumed_by/used_count/expires_at |
| 공지 | `attendance.notices(crew_id nullable)` | `crew_id IS NULL` = 서비스 전체 공지 |
| 운동 종목 | `attendance.exercise_types`, `attendance.crew_exercise_types` | 크루별 매핑 |
| 등급 | `attendance.grades`, `attendance.crew_grades` | 크루별 오버라이드 |
| 위치 | `attendance.crew_locations` | 크루별 출석 가능 위치 |

## 기능 정의 (마스터 영역)

### 1. 마스터 대시보드 (`/master`)
- 서비스 전체 KPI 카드: 총 크루 수, 총 사용자 수, 30일 출석 건수, 활성 크루 수
- 최근 가입 크루 5개
- 활동 정체 크루 경고 (최근 14일 출석 0건)
- 빠른 액션 버튼: 크루 등록, 초대코드, 푸시

### 2. 크루 관리 (`/master/crews`)
- **목록**: 검색·필터(활성/정체/전체), 멤버 수·최근 활동일·생성일 표시
- **신규 등록**: `/master/crews/new` — 이름·설명·지역 입력 + first-admin 초대코드 자동 생성 옵션
- **상세 점검**: `/master/crews/[id]` — 크루 메타 + 활동 KPI(30일 출석/호스팅 횟수, 멤버 추세)
- **수정**: `/master/crews/[id]/edit` — 이름·설명·지역·위치기반 출석 설정
- **활동 상세**: `/master/crews/[id]/activity` — 일자별 출석 차트, 최근 출석 50건, 호스트 랭킹 Top 5
- **멤버 관리**: `/master/crews/[id]/members` — 멤버 검색 + crew_role 토글
- **초대코드**: `/master/crews/[id]/invites` — 해당 크루 초대코드 CRUD
- **아카이브**: 소프트 비활성 (status 또는 신규 컬럼 활용)

### 3. 초대코드 통합 (`/master/invites`)
- 전체 크루 초대코드 검색·필터(active/expired)
- 신규 발급/수정/비활성화

### 4. 푸시 테스트 (`/master/push`)
- 기존 PushTestTab 기능 유지

### 5. 공지 통합 (`/master/notices`)  *(스코프 후순위)*
- 서비스 전체 공지(`crew_id = NULL`) 작성/관리

> **Out of Scope**: 사용자 단위 관리(전체 사용자 목록), 결제, 통계 export. 추후 확장.

---

## 폴더 구조 (목표)

```
app/master/
├── layout.tsx                     # 서버 가드 + 마스터 네비게이션
├── page.tsx                       # 대시보드 (RSC)
├── _components/                   # 마스터 영역 공통 UI
│   ├── MasterNav.tsx
│   ├── KpiCard.tsx
│   └── CrewCardLink.tsx
├── _vm/                           # ViewModel 어셈블러
│   └── dashboard.ts
├── actions.ts                     # 기존 crew CRUD (정비)
├── crews/
│   ├── page.tsx                   # 목록
│   ├── _components/CrewListClient.tsx
│   ├── _vm/list.ts
│   ├── new/
│   │   ├── page.tsx
│   │   └── NewCrewForm.tsx
│   └── [id]/
│       ├── page.tsx               # 상세
│       ├── _vm/detail.ts
│       ├── edit/
│       │   ├── page.tsx
│       │   └── EditCrewForm.tsx
│       ├── activity/
│       │   ├── page.tsx
│       │   └── _vm/activity.ts
│       ├── members/
│       │   ├── page.tsx
│       │   └── MembersClient.tsx
│       └── invites/
│           ├── page.tsx
│           └── InvitesClient.tsx
├── invites/
│   ├── page.tsx                   # 통합 초대코드
│   └── InvitesGlobalClient.tsx
├── push/
│   ├── page.tsx                   # 푸시 테스트 (기존 PushTestTab 이전)
│   └── PushTestClient.tsx
└── notices/                       # (선택) 서비스 공지 — 후순위 스코프

lib/domain/master/
├── policies.ts                    # 권한·검증
├── policies.test.ts
├── workflows.ts                   # 활동 상태 산출
├── workflows.test.ts
├── validators.ts                  # 입력 검증 (Zod)
├── validators.test.ts
├── messages.ts                    # 안내 메시지
├── messages.test.ts
└── types.ts                       # 도메인 타입

supabase/migrations/
└── 20260501_0001_master_overview_rpcs.sql   # get_master_dashboard_kpis, get_master_crew_overview, get_master_crew_activity
```

---

## 진행 단계 (Phase)

각 Phase 끝에 `code-reviewer` 리뷰 → 통과 시 한국어 atomic 커밋 → 다음 Phase.

### Phase 0 — 기반 (도메인 + DB)

- **0.1** master 도메인 확장: `workflows.ts` (활동 상태 판정), `validators.ts` (Zod), `messages.ts`, types 확장. `*.test.ts` 1:1.
- **0.2** Supabase migration 추가:
  - `get_master_dashboard_kpis()` → JSON: total_crews/total_users/recent_attendance_count/active_crews_count/recent_signups[]/idle_crews[]
  - `get_master_crew_overview(p_crew_id UUID)` → JSON: 크루 메타 + KPI(30일 출석/멤버 수/활성도)
  - `get_master_crew_activity(p_crew_id UUID, p_days INT)` → JSON: 일자별 출석 / 최근 출석 / 호스트 Top
  - 모두 SECURITY DEFINER + role_id=1 가드

### Phase 1 — 레이아웃 + 대시보드

- **1.1** `app/master/layout.tsx` 신규 (RSC) — 마스터 권한 서버 가드 + `MasterNav` (대시보드/크루/초대코드/푸시).
- **1.2** `app/master/page.tsx` 전면 재작성 (RSC) — `_vm/dashboard.ts`로 ViewModel 조립, KPI 카드 + 최근 가입 크루 + 정체 크루 경고.

### Phase 2 — 크루 관리 (CRUD + 활동)

- **2.1** `/master/crews/page.tsx` (RSC) — 검색·필터, `CrewListClient` 클라이언트 정렬·필터.
- **2.2** `/master/crews/new/page.tsx` + `NewCrewForm.tsx` + `actions.ts: createCrewWithFirstAdminAction` — 크루 생성 + first-admin 초대코드 자동 발급.
- **2.3** `/master/crews/[id]/page.tsx` (RSC) — 메타 + KPI + 탭 링크.
- **2.4** `/master/crews/[id]/edit/page.tsx` + `EditCrewForm.tsx` + `actions.ts: updateCrewAction`.
- **2.5** `/master/crews/[id]/activity/page.tsx` (RSC) — `_vm/activity.ts` + 일자별 차트(`AnimatedList` 막대), 최근 출석 50건, 호스트 Top.
- **2.6** `/master/crews/[id]/members/page.tsx` + `MembersClient.tsx` — 검색 + role 토글(기존 `updateCrewMemberRoleAction` 재사용).
- **2.7** `/master/crews/[id]/invites/page.tsx` + `InvitesClient.tsx` — 해당 크루 초대코드만.
- **2.8** `archiveCrewAction` (soft delete via status) — 마이그레이션 필요시 0.2 확장.

### Phase 3 — 통합 페이지

- **3.1** `/master/invites/page.tsx` + `InvitesGlobalClient.tsx` — 기존 InviteCodesTab 로직을 sub-route로 이전. 검색·필터 추가.
- **3.2** `/master/push/page.tsx` + `PushTestClient.tsx` — 기존 PushTestTab 이전.

### Phase 4 — 정리

- **4.1** 기존 `app/master/page.tsx` 탭 UI 제거 (Phase 1.2에서 이미 교체됨), `InviteCodesTab.tsx`/`PushTestTab.tsx` 삭제, `app/master/admin/` 폴더 삭제.
- **4.2** `npm run build` 통과 확인 (BFF lint, vitest, typecheck, next build 모두).
- **4.3** 최종 커밋 + 보고서.

---

## Subagent 위임 규칙 (PM 오케스트레이션)

1. 각 Phase 시작 시: `general-purpose` subagent에 task 단위 spec + 파일 경로 + 컨벤션 + 디자인 토큰 명시.
2. Subagent 결과 회수 후: 변경 파일 직접 Read로 검증 → 명백한 결함은 같은 subagent에 재요청.
3. Phase 끝: `code-reviewer` subagent에 BFF 4계층/한글 함수명/`.pen` 색상/React perf/scope 검사 위임.
4. 리뷰 통과: 한국어 atomic 커밋 (`feat(master): ...`, `feat(master/dashboard): ...` 등 prefix + 한국어).
5. 리뷰 실패: 작업자에게 재처리 요청 → 재리뷰.

## 강제 룰 체크리스트 (모든 task 공통)

- [ ] `lib/domain/master/` import 금지 항목 위반 없음 (supabase/next/react/UI)
- [ ] 한글 함수명 컨벤션 (`~인가`, `~하기`, `~생성`, `~검증`, `~인`)
- [ ] `*.ts` 1:1 vitest (`types.ts` 제외)
- [ ] `app/master/**/page.tsx` = RSC (`'use client'` 금지). 클라이언트 영역은 `_components/*Client.tsx`로 분리
- [ ] `revalidatePath/revalidateTag`는 actions.ts에서만 사용
- [ ] `bg-rh-bg-*` / `text-rh-text-*` / `bg-rh-accent` 등 토큰만 사용 (하드코딩 금지)
- [ ] 페이지 레벨 스켈레톤은 `animate-pulse` 금지, 정적 플레이스홀더만
- [ ] 리스트는 `AnimatedList` + `AnimatedItem`, 비리스트 콘텐츠는 `FadeIn`
- [ ] `BottomNavigation`은 마스터 영역에서 자동 숨김 처리(`ConditionalBottomNav`) 또는 마스터 전용 nav로 대체

---

## 산출물

- 새 페이지/컴포넌트/액션: 위 폴더 구조 참조
- DB migration: `supabase/migrations/20260501_0001_master_overview_rpcs.sql`
- 도메인: `lib/domain/master/{workflows,validators,messages,types}.ts` + 테스트
- 본 문서: `docs/plans/2026-05-01-master-admin-service.md`
- 최종 보고서: `docs/plans/2026-05-01-master-admin-service-report.md`

## 종료 조건

- `npm run build` 통과 (lint + typecheck + vitest + check:bff + next build)
- `/master`/`/master/crews`/`/master/crews/[id]`/`/master/crews/[id]/activity`/`/master/invites`/`/master/push` 라우트 모두 RSC 가드 + 마스터 권한 강제
- master 영역에서 일반 사용자/크루 매니저 접근 시 `forbidden` 응답 또는 redirect
- 한국어 atomic 커밋 N개 + 최종 보고서 작성
