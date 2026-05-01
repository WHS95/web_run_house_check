# Master Admin Service 구현 보고서

**기간**: 2026-05-01 (1일)  
**브랜치**: `feat/master-admin-service` (분기점: `feat/bff-refactor-phase-a`)  
**계획서**: [`2026-05-01-master-admin-service.md`](./2026-05-01-master-admin-service.md)

## 목표 달성

`/master` 영역을 **크루 단위 운영자(`/admin2`)와 분리된 서비스 레벨 마스터 어드민**으로 전면 재정비. 기존 `'use client'` 단일 탭 UI(821줄) → BFF 4계층 RSC + sub-route 구조로 교체.

핵심 신규 기능:
- 마스터 대시보드 (서비스 KPI + 정체/휴면 크루 경보)
- 신규 크루 등록 (first-admin 초대코드 자동 발급 옵션)
- 크루 상세·활동 점검 (KST 일자별 출석 차트, 호스트 Top, 최근 출석)
- 크루 수정 (위치기반 출석 설정 포함)
- 크루별 멤버 관리 + 초대코드 관리
- 통합 초대코드 (전체 크루 + 검색·필터)
- 푸시 테스트 sub-route

## 아키텍처 — BFF 4계층

| 계층 | 위치 | 책임 |
|------|------|------|
| Controller | `app/master/**/page.tsx` | RSC, `_vm/*` ViewModel 호출, `notFound()` 가드 |
| Mutation | `app/master/actions.ts`, `app/master/invite-codes/actions.ts` | `assertMaster()` 가드 → 도메인 검증 → DB write → `revalidatePath` |
| Domain | `lib/domain/master/{policies,workflows,validators,messages,types}.ts` | 순수 함수, 한글 함수명, 1:1 vitest |
| RPC/RLS | `supabase/migrations/20260501_0001_master_overview_rpcs.sql` | SECURITY DEFINER + `role_id=1` 가드 |

## 산출물

### 도메인 레이어 (`lib/domain/master/`)
- `types.ts` — 11종 타입 추가 (`CrewOverviewRow`, `CrewListItem`, `DashboardKpi`, `CrewActivityDay`, `CrewActivityRecent`, `CrewHostRanking`, `CreateCrewInput`, `UpdateCrewInput` 등)
- `policies.ts` — `유효한_지역인가`/`유효한_설명인가`/`유효한_정확도범위인가` 추가
- `workflows.ts` — `크루_활동상태_산출`/`크루목록_조립`/`활동상태_집계`
- `validators.ts` — zod + policies 조합으로 `크루생성입력_검증`/`크루수정입력_검증`
- `messages.ts` — `마스터메시지` 상수
- 모든 `*.ts` 1:1 vitest, **74 tests / 도메인 전체 210 PASS**

### Supabase RPC (`supabase/migrations/20260501_0001_master_overview_rpcs.sql`)
- `attendance.get_master_dashboard_kpis()` — 서비스 KPI + 최근 가입/비활성 크루
- `attendance.get_master_crew_overview(p_crew_id)` — 크루 메타 + 멤버/30일 출석/호스트/활성 멤버 KPI
- `attendance.get_master_crew_activity(p_crew_id, p_days)` — 일자별(KST)/최근 50건/호스트 Top 5
- 모두 SECURITY DEFINER + `role_id=1` 가드, `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO authenticated;`
- `p_days` 1~365 클램프, `deleted_at IS NULL` 필터, idempotent (DROP IF EXISTS)

### 권한 가드 (`lib/master/auth.ts`)
- `마스터_권한_보장()` — React.cache로 메모이즈, 미인증 → `/auth/login`, 권한 부족 → `/`

### 페이지 / 컴포넌트
```
app/master/
├── layout.tsx                                 # RSC 권한 가드 + MasterNav
├── page.tsx                                   # 대시보드 (RSC)
├── actions.ts                                 # +createCrewWithFirstAdminCodeAction, +updateCrewAction
├── _components/
│   ├── MasterNav.tsx                          # 4탭 (대시/크루/초대/푸시) + safe-area
│   ├── KpiCard.tsx, RecentSignupItem.tsx, IdleCrewItem.tsx, QuickActions.tsx
├── _vm/
│   └── dashboard.ts                           # get_master_dashboard_kpis 호출
├── crews/
│   ├── page.tsx                               # 목록 (RSC)
│   ├── _components/{CrewListClient, CrewListRow}.tsx
│   ├── _vm/list.ts                            # 3쿼리 Promise.all (N+1 회피)
│   ├── new/{page.tsx, NewCrewForm.tsx}
│   └── [id]/
│       ├── page.tsx                           # 상세 (RSC)
│       ├── _components/{CrewMetaCard, CrewKpiGrid, CrewSubMenu}.tsx
│       ├── _vm/detail.ts                      # get_master_crew_overview
│       ├── activity/{page.tsx, _vm/activity.ts, _components/{DailyAttendanceChart, HostRankingList, RecentAttendanceItem}.tsx}
│       ├── edit/{page.tsx, EditCrewForm.tsx}
│       ├── members/{page.tsx, MembersClient.tsx}
│       └── invites/{page.tsx, _vm/list.ts, CrewInvitesClient.tsx}
├── invites/{page.tsx, InvitesGlobalClient.tsx}     # 통합 초대코드
├── push/{page.tsx, PushTestClient.tsx}             # 푸시 테스트
└── invite-codes/actions.ts                          # (기존 유지)
```

### 제거된 dead code
- `app/master/{InviteCodesTab,PushTestTab}.tsx` (sub-route로 이전)
- `app/master/admin/{page.tsx, page.tsx.backup}` (대시보드 RSC로 대체)
- `components/organisms/master/{CrewManagement,InviteCodeManagement,MasterDashboard}.tsx` (admin/page.tsx 의존만)
- 합계 **3138줄 삭제**

## 디자인 시스템 준수

- 모든 색상 디자인 토큰 (`bg-rh-bg-*`, `text-rh-text-*`, `bg-rh-accent`, `bg-rh-status-*`)
- 인라인 hex(`#669FF2`/`#2B3644` 등) 0건
- `AnimatedList` + `AnimatedItem` 리스트, `FadeIn` 콘텐츠 wrap
- `animate-pulse` 페이지 레벨 0건 (정적 placeholder)
- `PageHeader` (sticky top-0) 일관 적용

## React 성능 (vercel-react-best-practices 준수)

- 모든 client 컴포넌트: `memo` + `useCallback` + `useMemo`
- `useTransition` 도입 (form/role toggle/code 발급)
- `useDeferredValue` (검색 입력 끊김 방지 — `CrewListClient`)
- 액션 성공 시 **로컬 patch** (refetch 회피)

## BFF 4계층 룰 준수

- ✅ `app/master/**/page.tsx` 모두 RSC (`'use client'` 0건)
- ✅ `revalidatePath/Tag` actions.ts에서만 사용
- ✅ `app/api/` 신규 추가 0건 (`check:bff` 통과)
- ✅ 도메인 레이어 외부 의존 0건 (zod만)
- ✅ 한글 함수명 컨벤션 100%

## 커밋 히스토리 (한국어 atomic)

```
1d1d928d chore(master): 탭 UI 시절 dead code 일괄 제거
7f58eb2d feat(master/push): 푸시 테스트 sub-route 페이지
7160d791 feat(master/invites): 통합 초대코드 sub-route 페이지
a7474083 feat(master/crews): 크루별 초대코드 페이지 (단일 크루 단순화 버전)
ec8e3fea feat(master/crews): 멤버 관리 페이지 (검색·정렬·역할 토글)
69b9a346 feat(master/crews): 크루 생성·수정 페이지 + 액션
9afdb15c feat(master/crews): 활동 점검 페이지 (일자별 차트 + 호스트 Top + 최근 출석)
165925fa feat(master/crews): 상세 페이지 RSC (메타·KPI·서브메뉴)
eef7ff61 feat(master/crews): 목록 페이지 RSC + 검색·필터 클라이언트
34f5a272 feat(master/dashboard): KPI 대시보드 RSC 재작성
f926ea81 feat(master/layout): RSC 레이아웃 + 마스터 권한 가드 + 네비게이션
cd3c40a1 feat(master/db): 마스터 어드민 RPC 3종 마이그레이션 추가
c56a70bd feat(master/domain): 마스터 어드민 도메인 레이어 확장
```

총 **13 commits**.

## 검증 결과

| 검증 | 결과 |
|------|------|
| `npm run test:domain` (vitest) | ✅ 18 files / **210 tests PASS** |
| `npm run typecheck` (tsc --noEmit) | ✅ PASS |
| `npm run lint` (next lint) | ✅ master 신규 파일 경고 0건 |
| `npm run check:bff` (BFF 룰) | ✅ `app/api/` 신규 0건, 도메인 1:1 테스트 충족 |
| `npm run build` (full) | ✅ PASS — `.next` 캐시 정리 후 1회 통과 |

### `npm run build` 통과 라우트 (마스터 영역)

| 라우트 | 타입 | 크기 |
|--------|------|------|
| `/master` | dynamic | 311 B |
| `/master/crews` | dynamic | 1.96 kB |
| `/master/crews/[id]` | dynamic | 311 B |
| `/master/crews/[id]/activity` | dynamic | 311 B |
| `/master/crews/[id]/edit` | dynamic | 2.22 kB |
| `/master/crews/[id]/invites` | dynamic | 3.22 kB |
| `/master/crews/[id]/members` | dynamic | 2.1 kB |
| `/master/crews/new` | dynamic | 1.92 kB |
| `/master/invites` | dynamic | 3.73 kB |
| `/master/push` | dynamic | 2.93 kB |

> 첫 빌드 시도에서 `.next/types/app/master/admin/page.ts`의 stale 캐시 때문에 타입 에러 발생 → `.next` 폴더 정리 후 재빌드 통과. 클린 환경에서는 1회 통과.

## PM 오케스트레이션 모드

본 작업은 사용자가 자리 비운 상태에서 PM 오케스트레이션 방식으로 진행:
- **Claude (PM)**: 계획 작성, subagent 위임, 결과 검토, atomic 커밋
- **Subagent (작업자)**: Phase 단위 구현 + 자체 검증 (`typecheck`/`lint`/`check:bff`)
- 8개 subagent 누적 호출, 각 작업 후 PM이 핵심 파일 직접 검증 + 리뷰

## 운영 상 주의사항 (사용자 확인 필요)

1. **Supabase 마이그레이션 적용 필요**: `supabase/migrations/20260501_0001_master_overview_rpcs.sql`을 원격 DB에 적용해야 `/master` 대시보드/상세/활동 페이지가 동작.
   - 적용 방법: Supabase SQL Editor에 직접 실행 또는 `supabase db push`.
2. **마스터 권한자 시드 확인**: `attendance.user_roles`에 `role_id = 1` (MASTER_ADMIN)인 row가 최소 1명 있어야 `/master` 접근 가능.
3. **워킹 트리 미커밋 변경 잔존**: 본 브랜치 분기 시점에 사용자의 미커밋 변경(`app/admin2/...`, `.cursor/...` 등)이 그대로 남아 있음. 본 작업과 무관 — 사용자 판단으로 별도 처리.
4. **`/master/notices` 미구현**: 계획서의 "Out of Scope" 명시 항목. 추후 별도 PR.
5. **CrewRow 타입 슬림**: `lib/domain/master/types.ts`의 `CrewRow`는 `id/name/description/created_at`만. 이번 작업 페이지들은 더 풍부한 RPC 응답 + ViewModel을 사용하므로 타입 충돌 없음. 추후 필요 시 확장.

## 후속 작업 제안

- BFF Phase A의 룰 5/6 (`'use client'` 경고, `app/**` 외 admin client 경고)을 cleanup PR에서 `error`로 격상하면 master 영역은 모두 통과 (RSC 100%).
- 신규 크루 등록 직후 first-admin 초대코드 발급 실패 시 retry UI 부재 — 크루 상세에서 수동 발급 가능하므로 운영 상 충분.
- 활동 차트는 div 막대 그래프 — 30일 이상 (예: 90일) 옵션이 필요해지면 sub-route 또는 query param 추가.
