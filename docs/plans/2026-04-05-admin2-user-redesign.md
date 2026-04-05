# admin2 User 페이지 리빌드 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/admin2/user` 리스트 카드 메타를 "최근 참여일"로 변경하고, 정렬+상태 통합 바텀시트를 추가하며, 유저 상세 페이지를 `/admin2/user/[userId]` 별도 라우트로 신설한다.

**Architecture:** 기존 `UserManagement` 클라이언트 컴포넌트에 정렬·필터 바텀시트를 추가한다. 카드 탭은 모달 대신 상세 라우트로 이동한다. 상세 페이지는 서버에서 `getCrewUserDetail`로 데이터를 조회하여 SSR하고, 스위치 토글과 편집 모달은 클라이언트 컴포넌트가 처리한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind (rh-* tokens), Supabase, Radix UI, Framer Motion (`FadeIn`/`AnimatedList`).

**Design reference:** `docs/plans/2026-04-05-admin2-user-redesign-design.md`

**Verification:** 이 프로젝트는 단위 테스트 프레임워크가 없어 TDD 대신 `npm run build`(타입+린트) + 개발서버 수동 검증을 사용한다.

---

## Task 1: 리스트 카드 메타를 "최근 참여일"로 변경

**Files:**
- Modify: `app/admin2/user/components/UserManagement.tsx` (UserCard 내 메타 텍스트)

**Step 1:** `app/admin2/user/components/UserManagement.tsx:107-119`의 메타 span을 다음으로 교체한다.

```tsx
<span className="text-[11px] text-rh-text-tertiary truncate">
    {user.last_attendance_date
        ? `최근 참여일: ${formatDate(user.last_attendance_date)}`
        : "참여 기록 없음"}
    {" · 출석 "}
    {user.attendance_count ?? 0}회
</span>
```

**Step 2:** 빌드 검증

Run: `npm run build`
Expected: 빌드 성공 (타입/린트 에러 없음)

**Step 3:** Commit

```bash
git add app/admin2/user/components/UserManagement.tsx
git commit -m "refactor(admin2): 유저 카드 메타를 가입일→최근 참여일로 변경"
```

---

## Task 2: `getCrewUserDetail` DB 쿼리 추가

**Files:**
- Modify: `lib/admin2/queries.ts` (신규 export 함수 추가)

**Step 1:** `lib/admin2/queries.ts`에 다음 함수를 추가한다 (파일 맨 끝).

```ts
export interface CrewUserDetail {
    user: {
        id: string;
        first_name: string;
        email: string | null;
        phone: string | null;
        birth_year: number | null;
        created_at: string;
        join_date: string | null;
        status: string | null;
    };
    role: "owner" | "admin" | "member";
    attendance_count: number;
    last_attendance_date: string | null;
    hosted_count: number;
}

export const getCrewUserDetail = cache(
    async (
        crewId: string,
        userId: string,
    ): Promise<CrewUserDetail | null> => {
        const supabase = await createClient();

        // 1) 유저 기본정보
        const { data: userData } = await supabase
            .schema("attendance")
            .from("users")
            .select(
                "id, first_name, email, phone, birth_year, created_at, status",
            )
            .eq("id", userId)
            .maybeSingle();
        if (!userData) return null;

        // 2) user_crews: role + join_date
        const { data: membership } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("role, created_at")
            .eq("user_id", userId)
            .eq("crew_id", crewId)
            .maybeSingle();
        if (!membership) return null;

        // 3) attendance_records: 전체 출석 + 최근
        const { data: attendance } = await supabase
            .schema("attendance")
            .from("attendance_records")
            .select("attendance_timestamp, is_host")
            .eq("user_id", userId)
            .eq("crew_id", crewId)
            .is("deleted_at", null)
            .order("attendance_timestamp", { ascending: false });

        const rows = attendance || [];
        const attendance_count = rows.length;
        const last_attendance_date =
            rows[0]?.attendance_timestamp ?? null;
        const hosted_count = rows.filter(
            (r: { is_host: boolean }) => r.is_host === true,
        ).length;

        return {
            user: {
                id: userData.id,
                first_name: userData.first_name,
                email: userData.email,
                phone: userData.phone,
                birth_year: userData.birth_year,
                created_at: userData.created_at,
                join_date: membership.created_at ?? null,
                status: userData.status,
            },
            role: membership.role as CrewUserDetail["role"],
            attendance_count,
            last_attendance_date,
            hosted_count,
        };
    },
);
```

**Step 2:** 스키마 확인 — `attendance.user_crews` 테이블에 `role`, `created_at`이 있는지 확인.

Run (Claude): Supabase MCP `list_tables` 또는 `execute_sql` with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'attendance' AND table_name = 'user_crews';
```
Expected: `user_id, crew_id, role, created_at, ...` 포함. 이 컬럼들이 없으면 이름을 조정한다.

**Step 3:** 빌드 검증

Run: `npm run build`
Expected: 빌드 성공

**Step 4:** Commit

```bash
git add lib/admin2/queries.ts
git commit -m "feat(admin2): getCrewUserDetail 쿼리 추가 (role, hosted_count)"
```

---

## Task 3: 유저 상세 서버 페이지 뼈대 생성

**Files:**
- Create: `app/admin2/user/[userId]/page.tsx`
- Create: `app/admin2/user/[userId]/components/UserDetail.tsx`

**Step 1:** `app/admin2/user/[userId]/page.tsx` 작성

```tsx
import { notFound } from "next/navigation";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewUserDetail } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import UserDetail from "./components/UserDetail";

interface PageProps {
    params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({
    params,
}: PageProps) {
    const { userId } = await params;
    const { crewId } = await getAdminAuth();
    const detail = await getCrewUserDetail(crewId, userId);
    if (!detail) notFound();

    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="회원 상세"
                    backLink="/admin2/user"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <UserDetail detail={detail} crewId={crewId} />
        </>
    );
}
```

**Step 2:** `app/admin2/user/[userId]/components/UserDetail.tsx` 최소 스텁 작성

```tsx
"use client";
import type { CrewUserDetail } from "@/lib/admin2/queries";

interface Props {
    detail: CrewUserDetail;
    crewId: string;
}

export default function UserDetail({ detail }: Props) {
    return (
        <div className="flex-1 px-4 pt-4">
            <pre className="text-xs text-white">
                {JSON.stringify(detail, null, 2)}
            </pre>
        </div>
    );
}
```

**Step 3:** 빌드 검증

Run: `npm run build`
Expected: 빌드 성공

**Step 4:** Commit

```bash
git add app/admin2/user/[userId]
git commit -m "feat(admin2): 유저 상세 라우트 뼈대 생성"
```

---

## Task 4: 유저 상세 UI 구현 (프로필 카드 + 통계 + 스위치)

**Files:**
- Modify: `app/admin2/user/[userId]/components/UserDetail.tsx`

**Step 1:** `UserDetail.tsx`를 다음 구조로 교체한다.

```tsx
"use client";
import { useState, useCallback } from "react";
import FadeIn from "@/components/atoms/FadeIn";
import AdminStatBox from "@/app/admin2/components/ui/AdminStatBox";
import AdminBadge from "@/app/admin2/components/ui/AdminBadge";
import AdminAlertDialog from "@/app/admin2/components/ui/AdminAlertDialog";
import { Switch } from "@/components/ui/switch";
import { updateUserStatus } from "@/lib/supabase/admin";
import type { CrewUserDetail } from "@/lib/admin2/queries";

interface Props {
    detail: CrewUserDetail;
    crewId: string;
}

const formatDate = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return (
        `${dt.getFullYear()}.` +
        `${String(dt.getMonth() + 1).padStart(2, "0")}.` +
        `${String(dt.getDate()).padStart(2, "0")}`
    );
};

export default function UserDetail({ detail, crewId }: Props) {
    const { user, role } = detail;
    const [active, setActive] = useState(
        user.status === null || user.status === "ACTIVE",
    );
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [attendanceCount] = useState(
        detail.attendance_count,
    );
    const [lastDate] = useState(detail.last_attendance_date);
    const [hostedCount] = useState(detail.hosted_count);

    const isStaff = role === "admin" || role === "owner";

    const handleToggle = useCallback(async () => {
        setConfirmOpen(false);
        setBusy(true);
        const next = !active;
        const prev = active;
        setActive(next);
        const { error } = await updateUserStatus(
            user.id,
            crewId,
            next,
        );
        if (error) {
            setActive(prev);
            alert("상태 변경에 실패했습니다.");
        }
        setBusy(false);
    }, [active, user.id, crewId]);

    return (
        <FadeIn>
            <div className="flex-1 px-4 pt-4 pb-4 flex flex-col gap-6">
                {/* 프로필 카드 */}
                <div className="rounded-2xl bg-rh-bg-surface p-6 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-rh-accent flex items-center justify-center text-white text-xl font-semibold">
                        {(user.first_name || "?").charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-white">
                            {user.first_name || "이름 없음"}
                        </span>
                        {isStaff && (
                            <AdminBadge variant="accent">
                                운영진
                            </AdminBadge>
                        )}
                    </div>
                    <span className="text-xs text-rh-text-tertiary">
                        가입일: {formatDate(user.join_date || user.created_at)}
                    </span>
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-3 gap-2">
                    <AdminStatBox
                        label="최근 참여일"
                        value={formatDate(lastDate)}
                    />
                    <AdminStatBox
                        label="전체 출석"
                        value={`${attendanceCount}회`}
                    />
                    <AdminStatBox
                        label="모임 개설"
                        value={`${hostedCount}회`}
                    />
                </div>

                {/* 회원 관리 */}
                <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-white px-1">
                        회원 관리
                    </h2>
                    <div className="flex items-center justify-between rounded-xl bg-rh-bg-surface px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-white">
                                멤버 활성 상태
                            </span>
                            <span className="text-[11px] text-rh-text-tertiary">
                                비활성 시 출석 체크가 불가합니다
                            </span>
                        </div>
                        <Switch
                            checked={active}
                            disabled={busy}
                            onCheckedChange={() =>
                                setConfirmOpen(true)
                            }
                        />
                    </div>
                </section>
            </div>

            <AdminAlertDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleToggle}
                title={
                    active
                        ? "비활성화하시겠습니까?"
                        : "활성화하시겠습니까?"
                }
                description={
                    active
                        ? "해당 회원이 비활성 상태로 전환됩니다."
                        : "해당 회원이 활성 상태로 전환됩니다."
                }
                cancelLabel="취소"
                confirmLabel="확인"
            />
        </FadeIn>
    );
}
```

**Step 2:** `AdminBadge` variant 확인 (`accent` 있는지)

Run: Read `app/admin2/components/ui/AdminBadge.tsx`
Expected: `accent` variant 존재. 없으면 가장 가까운 variant(예: `outline`) 사용.

**Step 3:** 빌드 검증

Run: `npm run build`
Expected: 빌드 성공

**Step 4:** Commit

```bash
git add app/admin2/user/[userId]/components/UserDetail.tsx
git commit -m "feat(admin2): 유저 상세 화면 UI 구현 (프로필·통계·활성 스위치)"
```

---

## Task 5: 상세 페이지 헤더에 "정보 편집" 메뉴 추가

**Files:**
- Modify: `app/admin2/user/[userId]/components/UserDetail.tsx`
- Reference: `app/admin2/user/components/UserManagement.tsx` (EditForm 재사용)

**Step 1:** `EditForm`을 별도 파일로 추출 (재사용을 위해).

Create: `app/admin2/user/components/UserEditForm.tsx` — `UserManagement.tsx:140-227`의 `EditForm` 함수를 그대로 export default 로 옮기되, `user: UserForAdmin` 타입을 받도록 유지.

**Step 2:** `UserManagement.tsx`에서 로컬 `EditForm`을 제거하고 `import UserEditForm from "./UserEditForm"` 로 변경. JSX에서 `<EditForm />` 을 `<UserEditForm />`로 교체.

**Step 3:** `UserDetail.tsx` 상단에 import 및 상태 추가:

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger }
    from "@/components/ui/dropdown-menu";
import AdminModal from "@/app/admin2/components/ui/AdminModal";
import UserEditForm from "../../components/UserEditForm";
import { updateUserInfo } from "@/lib/supabase/admin";
import type { UserForAdmin } from "@/lib/supabase/admin";
```

상태 추가:
```tsx
const [editOpen, setEditOpen] = useState(false);
const [profile, setProfile] = useState({
    first_name: user.first_name,
    phone: user.phone || "",
    birth_year: user.birth_year || 0,
});

const handleSave = useCallback(
    async (d: { first_name: string; phone: string; birth_year: number }) => {
        const { error } = await updateUserInfo(user.id, d);
        if (error) {
            alert("정보 수정 실패");
            return;
        }
        setProfile(d);
        setEditOpen(false);
    },
    [user.id],
);
```

**Step 4:** PageHeader 우측 액션은 별도 파일이므로, 상세 페이지 상단 우측에 3점 메뉴를 **페이지 내부에** 배치. `UserDetail.tsx` 렌더 최상단(FadeIn 바깥)에 다음 삽입:

```tsx
<div className="absolute right-4 top-3 z-50">
    <DropdownMenu>
        <DropdownMenuTrigger className="p-2 text-white">
            ⋯
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="border-0 bg-rh-bg-surface"
        >
            <DropdownMenuItem
                onClick={() => setEditOpen(true)}
                className="text-white hover:bg-rh-bg-muted"
            >
                정보 편집
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</div>
```

**주의:** absolute 사용이 CLAUDE.md의 fixed 금지 규칙과 충돌하지 않는지 확인. `absolute`는 허용됨. 그러나 PageHeader를 확장하는 것이 더 깔끔하다면 `PageHeader` props에 `rightAction?: ReactNode`가 이미 있는지 확인한다.

Run: Read `components/organisms/common/PageHeader.tsx` and check for rightAction prop.
Expected: 있으면 그걸 쓰고, 없으면 absolute로 처리.

**Step 5:** AdminModal + UserEditForm 렌더링 추가 (AdminAlertDialog 옆):

```tsx
<AdminModal
    open={editOpen}
    onClose={() => setEditOpen(false)}
    title="사용자 정보 수정"
>
    <UserEditForm
        user={{
            ...user,
            profile_image_url: null,
            is_crew_verified: true,
            verified_crew_id: null,
        } as UserForAdmin}
        onSave={handleSave}
        onClose={() => setEditOpen(false)}
    />
</AdminModal>
```

**Step 6:** 빌드 검증

Run: `npm run build`
Expected: 빌드 성공

**Step 7:** Commit

```bash
git add app/admin2/user
git commit -m "feat(admin2): 상세 헤더 메뉴에 정보 편집 모달 연결 + EditForm 공용화"
```

---

## Task 6: 리스트 카드 탭을 상세 라우트 이동으로 변경

**Files:**
- Modify: `app/admin2/user/components/UserManagement.tsx`

**Step 1:** `UserManagement.tsx` 상단에 `import { useRouter } from "next/navigation";` 추가.

**Step 2:** `UserManagement` 컴포넌트 내부에 `const router = useRouter();` 추가.

**Step 3:** `handleCardTap` 수정:

```tsx
const handleCardTap = useCallback(
    (user: UserForAdmin) => {
        router.push(`/admin2/user/${user.id}`);
    },
    [router],
);
```

**Step 4:** `editModalOpen`, `selectedUser`, `setEditModalOpen`, `setSelectedUser`, `handleSaveUserInfo` 및 `AdminModal` 렌더링은 **그대로 두되 UI가 호출하지 않으므로 미사용**. 타입 체크 에러 방지를 위해 **삭제**한다.

제거 대상:
- `const [editModalOpen, setEditModalOpen] = useState(false);`
- `const [selectedUser, setSelectedUser] = useState<UserForAdmin | null>(null);`
- `handleSaveUserInfo` 함수
- `<AdminModal>...</AdminModal>` 블록 전체
- 관련된 `UserEditForm`/`updateUserInfo` import (상세 페이지로 이전됨)

`AnimatedItem` 내부 `UserCard`의 `onTap={handleCardTap}`은 유지.

**Step 5:** 빌드 검증

Run: `npm run build`
Expected: 빌드 성공 (unused import/var 에러 없음)

**Step 6:** Commit

```bash
git add app/admin2/user/components/UserManagement.tsx
git commit -m "refactor(admin2): 유저 카드 탭을 상세 라우트 이동으로 변경, 편집 모달 제거"
```

---

## Task 7: 정렬+상태 바텀시트 UI 컴포넌트

**Files:**
- Create: `app/admin2/user/components/SortFilterSheet.tsx`

**Step 1:** `SortFilterSheet.tsx` 작성

```tsx
"use client";
import { memo } from "react";
import AdminFilterPill from "@/app/admin2/components/ui/AdminFilterPill";
import AdminSmallButton from "@/app/admin2/components/ui/AdminSmallButton";

export type SortKey = "name" | "lastAttendance" | "count";
export type SortDir = "asc" | "desc";
export type StatusFilter = "전체" | "활성" | "비활성";

interface Props {
    open: boolean;
    onClose: () => void;
    sortKey: SortKey;
    sortDir: SortDir;
    statusFilter: StatusFilter;
    onApply: (
        next: {
            sortKey: SortKey;
            sortDir: SortDir;
            statusFilter: StatusFilter;
        },
    ) => void;
}

const SORT_ROWS: { key: SortKey; label: string }[] = [
    { key: "name", label: "이름순" },
    { key: "lastAttendance", label: "최근 참여일순" },
    { key: "count", label: "출석 횟수순" },
];

const STATUS: StatusFilter[] = ["전체", "활성", "비활성"];

const SortFilterSheet = memo(function SortFilterSheet({
    open,
    onClose,
    sortKey: initKey,
    sortDir: initDir,
    statusFilter: initStatus,
    onApply,
}: Props) {
    const [key, setKey] =
        require("react").useState(initKey);
    const [dir, setDir] =
        require("react").useState(initDir);
    const [status, setStatus] =
        require("react").useState(initStatus);

    // open 시점 초기화
    require("react").useEffect(() => {
        if (open) {
            setKey(initKey);
            setDir(initDir);
            setStatus(initStatus);
        }
    }, [open, initKey, initDir, initStatus]);

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 z-40"
                onClick={onClose}
            />
            <div className="fixed left-0 right-0 bottom-0 z-50 bg-rh-bg-surface rounded-t-2xl p-5 flex flex-col gap-5 pb-[env(safe-area-inset-bottom)]">
                <h3 className="text-center text-base font-semibold text-white">
                    정렬 기준
                </h3>

                <div className="flex flex-col gap-2">
                    {SORT_ROWS.map((row) => (
                        <div
                            key={row.key}
                            className="flex items-center justify-between rounded-xl bg-rh-bg-primary px-4 py-3"
                        >
                            <span className="text-sm text-white">
                                {row.label}
                            </span>
                            <div className="flex gap-2">
                                <AdminSmallButton
                                    variant={
                                        key === row.key &&
                                        dir === "asc"
                                            ? "primary"
                                            : "default"
                                    }
                                    onClick={() => {
                                        setKey(row.key);
                                        setDir("asc");
                                    }}
                                >
                                    ↑ 오름
                                </AdminSmallButton>
                                <AdminSmallButton
                                    variant={
                                        key === row.key &&
                                        dir === "desc"
                                            ? "primary"
                                            : "default"
                                    }
                                    onClick={() => {
                                        setKey(row.key);
                                        setDir("desc");
                                    }}
                                >
                                    ↓ 내림
                                </AdminSmallButton>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">
                        회원 상태
                    </span>
                    <div className="flex gap-2">
                        {STATUS.map((s) => (
                            <AdminFilterPill
                                key={s}
                                label={s}
                                active={status === s}
                                onClick={() => setStatus(s)}
                            />
                        ))}
                    </div>
                </div>

                <button
                    className="w-full h-12 rounded-xl bg-rh-accent text-white text-sm font-semibold"
                    onClick={() =>
                        onApply({
                            sortKey: key,
                            sortDir: dir,
                            statusFilter: status,
                        })
                    }
                >
                    적용
                </button>
            </div>
        </>
    );
});

export default SortFilterSheet;
```

**Step 2:** `AdminSmallButton` props 확인

Run: Read `app/admin2/components/ui/AdminSmallButton.tsx`
Expected: `variant` prop 존재. 없으면 `className` prop이나 `active` prop으로 조정.

**Step 3:** `require("react")` 사용은 잘못된 패턴 — 상단에 `import { useState, useEffect } from "react";` 추가하고 본문에서 `require(...)`을 그 hooks로 교체.

**Step 4:** 빌드 검증

Run: `npm run build`
Expected: 빌드 성공

**Step 5:** Commit

```bash
git add app/admin2/user/components/SortFilterSheet.tsx
git commit -m "feat(admin2): 유저 정렬+상태 통합 바텀시트 컴포넌트"
```

---

## Task 8: UserManagement에 정렬/상태 상태와 시트 연결

**Files:**
- Modify: `app/admin2/user/components/UserManagement.tsx`

**Step 1:** 상단 import 추가

```tsx
import SortFilterSheet, {
    type SortKey,
    type SortDir,
    type StatusFilter,
} from "./SortFilterSheet";
```

**Step 2:** 기존 `statusFilter` 상태를 유지하되 타입 강화, 정렬 상태 추가, 시트 open 상태 추가:

```tsx
const [sortKey, setSortKey] = useState<SortKey>("lastAttendance");
const [sortDir, setSortDir] = useState<SortDir>("desc");
const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
const [sheetOpen, setSheetOpen] = useState(false);
```

기존 `useState("전체")` 유지하되 타입만 변경.

**Step 3:** `filteredUsers` useMemo에 정렬 적용. 기존 반환값 뒤에 `.sort(...)` 추가:

```tsx
const filteredUsers = useMemo(() => {
    const searched = users.filter((user) =>
        matchesSearch(user, searchTerm),
    );
    const statused = searched.filter((user) => {
        const active = isUserActive(user);
        return (
            statusFilter === "전체" ||
            (statusFilter === "활성" && active) ||
            (statusFilter === "비활성" && !active)
        );
    });
    const sorted = [...statused].sort((a, b) => {
        const m = sortDir === "asc" ? 1 : -1;
        if (sortKey === "name") {
            return (
                (a.first_name || "").localeCompare(
                    b.first_name || "",
                    "ko",
                ) * m
            );
        }
        if (sortKey === "lastAttendance") {
            const av = a.last_attendance_date || "";
            const bv = b.last_attendance_date || "";
            return (av < bv ? -1 : av > bv ? 1 : 0) * m;
        }
        // count
        return (
            ((a.attendance_count ?? 0) -
                (b.attendance_count ?? 0)) * m
        );
    });
    return sorted;
}, [
    users,
    searchTerm,
    statusFilter,
    sortKey,
    sortDir,
    matchesSearch,
    isUserActive,
]);
```

**Step 4:** 필터 버튼(DropdownMenu 블록 `line 425-466`)을 SortFilterSheet 호출로 교체:

```tsx
<AdminSmallButton onClick={() => setSheetOpen(true)}>
    필터
</AdminSmallButton>
```

DropdownMenu 및 DropdownMenu* import 제거.

**Step 5:** 렌더 말미 (기존 AdminAlertDialog 제거된 자리)에 SortFilterSheet 추가:

```tsx
<SortFilterSheet
    open={sheetOpen}
    onClose={() => setSheetOpen(false)}
    sortKey={sortKey}
    sortDir={sortDir}
    statusFilter={statusFilter}
    onApply={(next) => {
        setSortKey(next.sortKey);
        setSortDir(next.sortDir);
        setStatusFilter(next.statusFilter);
        setSheetOpen(false);
    }}
/>
```

**Step 6:** 기존 `confirmDialog`, `handleToggleStatus`, `<AdminAlertDialog>` 블록은 카드 탭이 사라졌으므로 **미사용**. 제거.

**Step 7:** 빌드 검증

Run: `npm run build`
Expected: 빌드 성공 (unused imports 없음)

**Step 8:** Commit

```bash
git add app/admin2/user/components/UserManagement.tsx
git commit -m "feat(admin2): 유저 리스트 정렬+상태 바텀시트 연결"
```

---

## Task 9: 수동 QA 및 스냅샷 확인

**Step 1:** 개발 서버 기동

Run: `npm run dev`
Expected: localhost:3000 기동

**Step 2:** 브라우저에서 다음 시나리오 확인 (모바일 뷰포트)
1. `/admin2/user` — 카드에 "최근 참여일" 노출
2. "필터" 버튼 → 바텀시트 열림 → 정렬 기준 + 회원 상태 표시
3. 정렬 변경 → 적용 → 리스트 순서 변경 확인
4. 상태 필터 변경 → 적용 → 활성/비활성 필터링 확인
5. 카드 탭 → `/admin2/user/[userId]` 이동
6. 상세 페이지: 프로필·통계 3개·스위치 렌더
7. 스위치 토글 → 확인 다이얼로그 → 상태 변경 반영
8. 헤더 "⋯" 메뉴 → 정보 편집 모달 → 저장 동작
9. 뒤로가기 → 리스트 복귀

**Step 3:** 빌드 최종 검증

Run: `npm run build`
Expected: 빌드 성공

**Step 4:** 이상 없으면 작업 종료. 문제 발견 시 해당 task로 돌아가 수정 후 재커밋.

---

## Rollback Plan

각 task는 독립 커밋이므로 `git revert <sha>` 또는 `git reset --hard HEAD~N`으로 단계별 롤백 가능.
