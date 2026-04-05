# admin2 User 페이지 리빌드 설계 (2026-04-05)

## 목적

`/admin2/user` 화면을 런하우스-관리자.pen 디자인 시스템에 맞춰 리빌드한다.

대상 화면:
- Screen/AdminUsers (유저 리스트)
- Screen/AdminUsers-FilterOpen (정렬·필터 바텀시트)
- Screen/AdminUserDetail (유저 상세)

## 확정 사항 (브레인스토밍 결과)

| 결정 항목 | 선택 |
|---|---|
| 유저 상세 진입 방식 | **별도 라우트** `/admin2/user/[userId]` |
| 정렬 vs 상태 필터 | **통합 바텀시트**(정렬 기준 + 회원 상태) |
| "모임 개설" 통계 | **DB 쿼리 신규**(host count 집계) |
| "회원 제거" 동작 | **soft-disable 유지** (SUSPENDED) |
| 프로필 편집 진입 | **상세 페이지 헤더 우측 메뉴** |
| 위험 영역 섹션 | **숨김** (스위치와 기능 중복 제거) |

## 구조

### 파일 구성

**신규**
- `app/admin2/user/[userId]/page.tsx` — 서버 컴포넌트, 상세 데이터 fetch
- `app/admin2/user/[userId]/components/UserDetail.tsx` — 클라이언트, 스위치·편집 모달
- `app/admin2/user/components/SortFilterSheet.tsx` — 정렬+상태 바텀시트

**수정**
- `app/admin2/user/components/UserManagement.tsx` — 카드 탭 → 상세 라우트 이동, 필터 버튼 → 바텀시트 호출, 정렬·상태 상태값 추가
- `lib/admin2/queries.ts` — `getCrewUserDetail(crewId, userId)` 추가

## 유저 리스트 변경

**UserCard 메타 텍스트**
- AS-IS: `가입: YYYY.MM.DD · 출석 N회`
- TO-BE: `최근 참여일: YYYY.MM.DD · 출석 N회` (null이면 `참여 기록 없음`)

**카드 탭**
- AS-IS: `setEditModalOpen(true)` (편집 모달 열기)
- TO-BE: `router.push('/admin2/user/' + user.id)`

## 정렬+상태 바텀시트 (SortFilterSheet)

.pen `Screen/AdminUsers-FilterOpen` 기반.

**UI**
- 바텀시트 (`AdminBottomSheet` 또는 기존 `AdminModal` 하단 variant)
- "정렬 기준" 섹션
  - 3 row: 이름순 / 최근 참여일순 / 출석 횟수순
  - 각 row에 `↑ 오름` `↓ 내림` `AdminSmallButton` 2개 (현재 선택만 accent)
- "회원 상태" 섹션
  - `AdminFilterPill` 3개: 전체 / 활성 / 비활성
- "적용" 버튼 (`bg-rh-accent` 풀폭)

**상태**
```ts
sortKey: 'name' | 'lastAttendance' | 'count'  // default: 'lastAttendance'
sortDir: 'asc' | 'desc'                         // default: 'desc'
statusFilter: '전체' | '활성' | '비활성'        // default: '전체'
```

정렬은 `UserManagement`의 `filteredUsers` useMemo에 sort 단계를 추가하여 적용.

## 유저 상세 페이지

**경로**: `/admin2/user/[userId]`

**서버 페이지**
- `getAdminAuth()`로 crew 권한 확인
- `getCrewUserDetail(crewId, userId)` 호출

**레이아웃** (.pen `Screen/AdminUserDetail` 기반)
```
PageHeader (title="회원 상세", backLink="/admin2/user")
  └ 우측 "..." DropdownMenu: [정보 편집]
<FadeIn>
  [프로필 카드: bg-rh-bg-surface rounded-2xl p-6 text-center]
    - 아바타 64×64 bg-rh-accent (이름 첫글자)
    - 이름 text-lg font-semibold
    - 운영진 뱃지 (role ∈ {admin, owner}일 때만 AdminBadge accent)
    - 가입일 text-xs text-rh-text-tertiary

  [grid grid-cols-3 gap-2]
    - AdminStatBox: 최근 참여일 / YYYY.MM.DD
    - AdminStatBox: 전체 출석 / N회
    - AdminStatBox: 모임 개설 / N회

  [섹션 "회원 관리"]
    - AdminSwitchRow
        label="멤버 활성 상태"
        description="비활성 시 출석 체크가 불가합니다"
        checked={active}
        onToggle={openConfirmDialog}
</FadeIn>

[AdminModal: 편집 모달] — 헤더 메뉴 "정보 편집"으로 오픈, 기존 EditForm 재사용
[AdminAlertDialog: 상태 토글 확인]
```

## DB 쿼리: `getCrewUserDetail`

`lib/admin2/queries.ts`에 추가.

반환값
```ts
{
  user: UserForAdmin,
  role: 'owner' | 'admin' | 'member',
  hosted_count: number,
}
```

집계 로직
1. `users` 에서 기본정보 조회
2. `user_crews` 에서 해당 crew의 role + status 조회
3. `attendance_records`에서 해당 user·crew의 count + 최근 1건 조회 (기존 패턴)
4. `attendance_records` where `is_host = true AND user_id = userId AND crew_id = crewId`의 count 집계

## 에러 처리 / 데이터 플로우

- SSR: 서버에서 상세 데이터를 조회 → props로 전달
- 스위치 토글: 기존 `updateUserStatus` 재사용. 낙관적 업데이트 + 실패 시 롤백 + `alert()` 통지
- 편집 모달 저장: 기존 `updateUserInfo` 재사용
- 에러 알림: admin2 전반의 `alert()` 패턴 유지

## 디자인 시스템 준수

- 색상: CLAUDE.md 정의된 `--rh-*` 토큰만 사용. 원색 계열 금지.
- 공통 컴포넌트 재사용: `PageHeader`, `AdminStatBox`, `AdminSwitchRow`, `AdminBadge`, `AdminModal`, `AdminAlertDialog`, `AdminSmallButton`, `AdminFilterPill`
- 애니메이션: 상세 페이지 `FadeIn`, 리스트 `AnimatedList`/`AnimatedItem`, 스켈레톤 animate-pulse 금지
- 레이아웃: `sticky top-0` 헤더, `main-content` 스크롤 위임, `<BottomNavigation />` 개별 렌더링 금지

## 검증

구현 완료 후:
- `npm run build` 성공 (타입 + 린트)
- 모바일 뷰포트에서 상세 진입·스위치 토글·편집 모달 동작 확인
- 정렬+상태 바텀시트 동작 확인
- 리스트 카드 텍스트가 "최근 참여일"로 노출됨을 확인
