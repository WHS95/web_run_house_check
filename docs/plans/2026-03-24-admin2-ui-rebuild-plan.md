# Admin2 UI 전체 리빌드 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** admin2 페이지 전체를 .pen 디자인 기준으로 리빌드 (백엔드 유지, 프론트엔드 UI만 교체)

**Architecture:** 컴포넌트 우선 접근. 먼저 .pen 디자인 시스템의 공통 UI 컴포넌트를 `app/admin2/components/ui/`에 생성하고, 각 페이지를 이 컴포넌트들로 조립한다. 기존 서버 컴포넌트의 데이터 fetching 로직은 그대로 유지하고 클라이언트 UI만 교체한다.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Framer Motion, Supabase, lucide-react

**디자인 소스:** `/Users/whs-95/Desktop/web_run_house_check/런하우스출석-관리자.pen`

---

## Phase 1: 공통 UI 컴포넌트 생성

### Task 1: 기본 UI 컴포넌트 (AdminStatCard, AdminListItem, AdminDivider, AdminBadge, AdminSmallButton)

**Files:**
- Create: `app/admin2/components/ui/AdminStatCard.tsx`
- Create: `app/admin2/components/ui/AdminListItem.tsx`
- Create: `app/admin2/components/ui/AdminDivider.tsx`
- Create: `app/admin2/components/ui/AdminBadge.tsx`
- Create: `app/admin2/components/ui/AdminSmallButton.tsx`
- Create: `app/admin2/components/ui/index.ts` (barrel export)

**Step 1: AdminStatCard 생성**

.pen 스펙: bg-surface, cornerRadius 12, height 90, vertical layout, center aligned
- 상단: 큰 숫자 (accent-blue, fontSize 24, fontWeight 700)
- 하단: 라벨 텍스트 (text-secondary, fontSize 11)

```tsx
// app/admin2/components/ui/AdminStatCard.tsx
"use client";
import { memo } from "react";

interface AdminStatCardProps {
    value: string | number;
    label: string;
}

const AdminStatCard = memo(function AdminStatCard({
    value,
    label,
}: AdminStatCardProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-1 h-[90px] rounded-xl bg-rh-bg-surface">
            <span className="text-2xl font-bold text-rh-accent">
                {value}
            </span>
            <span className="text-[11px] text-rh-text-secondary">
                {label}
            </span>
        </div>
    );
});

export default AdminStatCard;
```

**Step 2: AdminListItem 생성**

.pen 스펙: Component/ListItem (AfJMV) — bg-surface, cornerRadius lg, padding [12,16], space_between
- 좌측: title (fontSize 14, fontWeight 600) + subtitle (fontSize 12, text-secondary)
- 우측: chevron-right 아이콘 (text-muted, 18px)

```tsx
// app/admin2/components/ui/AdminListItem.tsx
"use client";
import { memo, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { haptic } from "@/lib/haptic";

interface AdminListItemProps {
    title: string;
    subtitle?: string;
    href?: string;
    onClick?: () => void;
}

const AdminListItem = memo(function AdminListItem({
    title,
    subtitle,
    href,
    onClick,
}: AdminListItemProps) {
    const { navigate } = useNavigation();

    const handleClick = useCallback(() => {
        haptic.light();
        if (onClick) {
            onClick();
        } else if (href) {
            navigate(href);
        }
    }, [onClick, href, navigate]);

    return (
        <button
            className="w-full flex items-center justify-between rounded-xl bg-rh-bg-surface px-4 py-3"
            onClick={handleClick}
        >
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-white text-left">
                    {title}
                </span>
                {subtitle && (
                    <span className="text-xs text-rh-text-secondary text-left">
                        {subtitle}
                    </span>
                )}
            </div>
            <ChevronRight
                size={18}
                className="text-rh-text-muted shrink-0"
            />
        </button>
    );
});

export default AdminListItem;
```

**Step 3: AdminDivider, AdminBadge, AdminSmallButton 생성**

```tsx
// app/admin2/components/ui/AdminDivider.tsx
export default function AdminDivider() {
    return <div className="h-px w-full bg-rh-border" />;
}
```

```tsx
// app/admin2/components/ui/AdminBadge.tsx
import { memo } from "react";

type BadgeVariant = "accent" | "outline" | "muted";

interface AdminBadgeProps {
    children: string;
    variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
    accent: "bg-rh-accent text-white",
    outline: "border border-rh-accent text-rh-accent",
    muted: "bg-rh-bg-muted text-rh-text-secondary",
};

const AdminBadge = memo(function AdminBadge({
    children,
    variant = "accent",
}: AdminBadgeProps) {
    return (
        <span
            className={`inline-flex items-center justify-center h-[22px] px-2 rounded-full text-[10px] font-semibold ${variantStyles[variant]}`}
        >
            {children}
        </span>
    );
});

export default AdminBadge;
```

```tsx
// app/admin2/components/ui/AdminSmallButton.tsx
"use client";
import { memo } from "react";

interface AdminSmallButtonProps {
    children: string;
    onClick?: () => void;
}

const AdminSmallButton = memo(function AdminSmallButton({
    children,
    onClick,
}: AdminSmallButtonProps) {
    return (
        <button
            className="h-8 px-3 rounded-lg bg-rh-accent text-xs font-semibold text-white"
            onClick={onClick}
        >
            {children}
        </button>
    );
});

export default AdminSmallButton;
```

**Step 4: barrel export 생성**

```tsx
// app/admin2/components/ui/index.ts
export { default as AdminStatCard } from "./AdminStatCard";
export { default as AdminListItem } from "./AdminListItem";
export { default as AdminDivider } from "./AdminDivider";
export { default as AdminBadge } from "./AdminBadge";
export { default as AdminSmallButton } from "./AdminSmallButton";
```

**Step 5: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공 (새 컴포넌트는 아직 사용되지 않음)

**Step 6: Commit**

```bash
git add app/admin2/components/ui/
git commit -m "feat(admin2): 기본 UI 컴포넌트 생성 (StatCard, ListItem, Divider, Badge, SmallButton)"
```

---

### Task 2: 폼/입력 UI 컴포넌트 (AdminSearchBar, AdminTabBar, AdminLabeledInput, AdminSelect, AdminSwitchRow, AdminMonthNav)

**Files:**
- Create: `app/admin2/components/ui/AdminSearchBar.tsx`
- Create: `app/admin2/components/ui/AdminTabBar.tsx`
- Create: `app/admin2/components/ui/AdminLabeledInput.tsx`
- Create: `app/admin2/components/ui/AdminSelect.tsx`
- Create: `app/admin2/components/ui/AdminSwitchRow.tsx`
- Create: `app/admin2/components/ui/AdminMonthNav.tsx`
- Modify: `app/admin2/components/ui/index.ts`

**Step 1: AdminSearchBar 생성**

.pen 스펙: Component/SearchBar (ohlrg) — height 44, bg-surface, cornerRadius md, gap 10, padding [0,14]
- search 아이콘 (text-muted, 18px) + placeholder 텍스트

```tsx
// app/admin2/components/ui/AdminSearchBar.tsx
"use client";
import { memo } from "react";
import { Search } from "lucide-react";

interface AdminSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const AdminSearchBar = memo(function AdminSearchBar({
    value,
    onChange,
    placeholder = "검색어를 입력하세요",
}: AdminSearchBarProps) {
    return (
        <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-lg bg-rh-bg-surface">
            <Search size={18} className="text-rh-text-muted shrink-0" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-rh-text-muted outline-none"
            />
        </div>
    );
});

export default AdminSearchBar;
```

**Step 2: AdminTabBar 생성**

.pen 스펙: Component/TabBar (k0zbR) — height 40, bg-surface, cornerRadius md, gap 4, padding 4
- 활성 탭: bg-accent, cornerRadius sm, text-white, fontWeight 600
- 비활성 탭: transparent, text-secondary

```tsx
// app/admin2/components/ui/AdminTabBar.tsx
"use client";
import { memo, useCallback } from "react";
import { haptic } from "@/lib/haptic";

interface Tab {
    key: string;
    label: string;
}

interface AdminTabBarProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

const AdminTabBar = memo(function AdminTabBar({
    tabs,
    activeTab,
    onTabChange,
}: AdminTabBarProps) {
    const handleTab = useCallback(
        (key: string) => {
            haptic.light();
            onTabChange(key);
        },
        [onTabChange],
    );

    return (
        <div className="flex h-10 gap-1 p-1 rounded-lg bg-rh-bg-surface">
            {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                    <button
                        key={tab.key}
                        className={`flex-1 flex items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                            isActive
                                ? "bg-rh-accent text-white"
                                : "text-rh-text-secondary"
                        }`}
                        onClick={() => handleTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
});

export default AdminTabBar;
```

**Step 3: AdminLabeledInput 생성**

.pen 스펙: Component/Input/Labeled (4FISI) — vertical layout, gap 6
- 라벨: text-secondary, fontSize 12, fontWeight 500
- 인풋: height 48, bg-surface, cornerRadius md, border, padding [0,16]

```tsx
// app/admin2/components/ui/AdminLabeledInput.tsx
"use client";
import { memo, forwardRef } from "react";

interface AdminLabeledInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    helperText?: string;
    type?: string;
}

const AdminLabeledInput = memo(
    forwardRef<HTMLInputElement, AdminLabeledInputProps>(
        function AdminLabeledInput(
            { label, value, onChange, placeholder, helperText, type = "text" },
            ref,
        ) {
            return (
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-rh-text-secondary">
                        {label}
                    </label>
                    <input
                        ref={ref}
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="h-12 px-4 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white placeholder:text-rh-text-muted outline-none focus:border-rh-accent transition-colors"
                    />
                    {helperText && (
                        <span className="text-[11px] text-rh-text-tertiary">
                            {helperText}
                        </span>
                    )}
                </div>
            );
        },
    ),
);

export default AdminLabeledInput;
```

**Step 4: AdminSelect 생성**

.pen 스펙: Component/Select (iPbKl) — height 48, bg-surface, cornerRadius md, border, space_between
- 값 텍스트 (text-muted) + chevron-down 아이콘

```tsx
// app/admin2/components/ui/AdminSelect.tsx
"use client";
import { memo } from "react";
import { ChevronDown } from "lucide-react";

interface AdminSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    label?: string;
}

const AdminSelect = memo(function AdminSelect({
    value,
    onChange,
    options,
    placeholder = "선택해주세요",
    label,
}: AdminSelectProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-xs font-medium text-rh-text-secondary">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-12 px-4 pr-10 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white appearance-none outline-none focus:border-rh-accent transition-colors"
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-rh-text-muted pointer-events-none"
                />
            </div>
        </div>
    );
});

export default AdminSelect;
```

**Step 5: AdminSwitchRow 생성**

.pen 스펙: Component/SwitchRow (5Hrnv) — height 52, bg-surface, cornerRadius lg, padding [0,16], space_between

```tsx
// app/admin2/components/ui/AdminSwitchRow.tsx
"use client";
import { memo } from "react";
import { Switch } from "@/components/ui/switch";

interface AdminSwitchRowProps {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

const AdminSwitchRow = memo(function AdminSwitchRow({
    label,
    checked,
    onCheckedChange,
}: AdminSwitchRowProps) {
    return (
        <div className="flex items-center justify-between h-[52px] px-4 rounded-xl bg-rh-bg-surface">
            <span className="text-sm font-medium text-white">
                {label}
            </span>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
            />
        </div>
    );
});

export default AdminSwitchRow;
```

**Step 6: AdminMonthNav 생성**

.pen 스펙: Dashboard month nav — height 40, center aligned, gap 20
- chevron-left/right (text-secondary, 20px) + 월 텍스트 (fontSize 16, fontWeight 600)

```tsx
// app/admin2/components/ui/AdminMonthNav.tsx
"use client";
import { memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface AdminMonthNavProps {
    year: number;
    month: number;
    onPrev: () => void;
    onNext: () => void;
}

const AdminMonthNav = memo(function AdminMonthNav({
    year,
    month,
    onPrev,
    onNext,
}: AdminMonthNavProps) {
    const handlePrev = useCallback(() => {
        haptic.light();
        onPrev();
    }, [onPrev]);

    const handleNext = useCallback(() => {
        haptic.light();
        onNext();
    }, [onNext]);

    return (
        <div className="flex items-center justify-center gap-5 h-10">
            <button onClick={handlePrev}>
                <ChevronLeft
                    size={20}
                    className="text-rh-text-secondary"
                />
            </button>
            <span className="text-base font-semibold text-white">
                {year}년 {month}월
            </span>
            <button onClick={handleNext}>
                <ChevronRight
                    size={20}
                    className="text-rh-text-secondary"
                />
            </button>
        </div>
    );
});

export default AdminMonthNav;
```

**Step 7: barrel export 업데이트**

```tsx
// app/admin2/components/ui/index.ts (추가)
export { default as AdminSearchBar } from "./AdminSearchBar";
export { default as AdminTabBar } from "./AdminTabBar";
export { default as AdminLabeledInput } from "./AdminLabeledInput";
export { default as AdminSelect } from "./AdminSelect";
export { default as AdminSwitchRow } from "./AdminSwitchRow";
export { default as AdminMonthNav } from "./AdminMonthNav";
```

**Step 8: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 9: Commit**

```bash
git add app/admin2/components/ui/
git commit -m "feat(admin2): 폼/입력 UI 컴포넌트 생성 (SearchBar, TabBar, LabeledInput, Select, SwitchRow, MonthNav)"
```

---

### Task 3: 오버레이 UI 컴포넌트 (AdminModal, AdminAlertDialog) + 페이지 전용 컴포넌트 (NoticeCard, PushHistoryItem, AttendanceRow)

**Files:**
- Create: `app/admin2/components/ui/AdminModal.tsx`
- Create: `app/admin2/components/ui/AdminAlertDialog.tsx`
- Create: `app/admin2/components/ui/NoticeCard.tsx`
- Create: `app/admin2/components/ui/PushHistoryItem.tsx`
- Create: `app/admin2/components/ui/AttendanceRow.tsx`
- Modify: `app/admin2/components/ui/index.ts`

**Step 1: AdminModal 생성**

.pen 스펙: Component/Modal (CORTl) — bg-surface, cornerRadius xl, padding 24, gap 20

```tsx
// app/admin2/components/ui/AdminModal.tsx
"use client";
import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const AdminModal = memo(function AdminModal({
    open,
    onClose,
    title,
    children,
    footer,
}: AdminModalProps) {
    const handleBackdrop = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="absolute inset-0 z-[100] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={handleBackdrop}
                    />
                    <motion.div
                        className="relative z-10 w-[320px] rounded-2xl bg-rh-bg-surface p-6 flex flex-col gap-5"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {title && (
                            <h3 className="text-base font-semibold text-white">
                                {title}
                            </h3>
                        )}
                        <div>{children}</div>
                        {footer && <div>{footer}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default AdminModal;
```

**Step 2: AdminAlertDialog 생성**

.pen 스펙: Component/AlertDialog (zLSK0) — width 300, cornerRadius xl, padding 24, center aligned

```tsx
// app/admin2/components/ui/AdminAlertDialog.tsx
"use client";
import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminAlertDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    icon?: React.ReactNode;
    title: string;
    description?: string;
    cancelLabel?: string;
    confirmLabel?: string;
    confirmVariant?: "primary" | "danger";
}

const AdminAlertDialog = memo(function AdminAlertDialog({
    open,
    onClose,
    onConfirm,
    icon,
    title,
    description,
    cancelLabel = "취소",
    confirmLabel = "확인",
    confirmVariant = "primary",
}: AdminAlertDialogProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="absolute inset-0 z-[100] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative z-10 w-[300px] rounded-2xl bg-rh-bg-surface p-6 flex flex-col items-center gap-5"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {icon}
                        <p className="text-base font-semibold text-white">
                            {title}
                        </p>
                        {description && (
                            <p className="text-sm text-rh-text-secondary text-center">
                                {description}
                            </p>
                        )}
                        <div className="flex w-full gap-2">
                            <button
                                className="flex-1 py-3 rounded-xl bg-rh-bg-muted text-white text-sm font-medium"
                                onClick={onClose}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                className={`flex-1 py-3 rounded-xl text-white text-sm font-medium ${
                                    confirmVariant === "danger"
                                        ? "bg-rh-status-error"
                                        : "bg-rh-accent"
                                }`}
                                onClick={onConfirm}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default AdminAlertDialog;
```

**Step 3: NoticeCard, PushHistoryItem, AttendanceRow 생성**

(코드는 .pen 디자인 기반으로 구현 시 작성 — 페이지 리빌드 Task에서 상세 구현)

**Step 4: barrel export 업데이트 후 빌드 확인**

**Step 5: Commit**

```bash
git commit -m "feat(admin2): 오버레이/페이지전용 UI 컴포넌트 생성 (Modal, AlertDialog, NoticeCard, PushHistoryItem, AttendanceRow)"
```

---

## Phase 2: 페이지 리빌드 (간단한 페이지부터)

### Task 4: Menu 페이지 리빌드 (`/admin2/menu`)

**Files:**
- Modify: `app/admin2/menu/page.tsx`

**Step 1: .pen 디자인(Screen/AdminMenu) 기준으로 page.tsx 교체**

- PageHeader("메뉴") — backLink 없음
- SectionLabel("관리 기능")
- AdminListItem × 5 (AnimatedList 적용)
- FadeIn 래퍼

**Step 2: 빌드 확인**

Run: `npm run build`

**Step 3: Commit**

```bash
git commit -m "refactor(admin2): Menu 페이지 .pen 디자인 기준 리빌드"
```

---

### Task 5: Dashboard 페이지 리빌드 (`/admin2`)

**Files:**
- Modify: `app/admin2/page.tsx`
- Modify: `app/admin2/components/DashboardMonthNav.tsx` → AdminMonthNav 사용으로 교체
- Modify: `app/admin2/components/DashboardStatCards.tsx` → AdminStatCard 사용으로 교체

**Step 1: page.tsx를 .pen 디자인(Screen/AdminDashboard) 기준으로 교체**

- PageHeader("관리자 대시보드")
- AdminMonthNav (URL searchParams 연동 유지)
- AdminStatCard × 3 (가로 배치, gap 12)
- SectionLabel("관리 메뉴")
- AdminListItem × 4 (AnimatedList)
- 기존 getDashboardStats() 데이터 흐름 유지

**Step 2: DashboardMonthNav, DashboardStatCards를 새 컴포넌트 사용으로 교체**

**Step 3: 빌드 확인 후 Commit**

```bash
git commit -m "refactor(admin2): Dashboard 페이지 .pen 디자인 기준 리빌드"
```

---

### Task 6: User 페이지 리빌드 (`/admin2/user`)

**Files:**
- Modify: `app/admin2/user/page.tsx`
- Modify: `app/admin2/user/components/UserManagement.tsx` (528줄 → .pen 디자인 기준 재작성)

**Step 1: .pen 디자인(Screen/AdminUsers) 기준으로 UserManagement.tsx 교체**

- AdminSearchBar
- CountRow ("전체 N명" + AdminSmallButton("필터"))
- 유저 카드 리스트 (bg-surface, rounded-xl, px-4 py-3, gap 12)
- 기존 getCrewUsers() 데이터 + 검색/정렬/필터 로직 유지
- AdminModal (유저 편집), AdminAlertDialog (상태 변경 확인)

**Step 2: 빌드 확인 후 Commit**

```bash
git commit -m "refactor(admin2): User 페이지 .pen 디자인 기준 리빌드"
```

---

### Task 7: Attendance 페이지 리빌드 (`/admin2/attendance`)

**Files:**
- Modify: `app/admin2/attendance/page.tsx`
- Modify: `app/admin2/attendance/components/AttendanceManagement.tsx` (424줄 → .pen 디자인 기준 재작성)

**Step 1: .pen 디자인(Screen/AdminAttendance) 기준으로 교체**

- AdminMonthNav
- CalendarGrid (.pen 캘린더 디자인 반영)
- 날짜 라벨 + AdminSmallButton("일괄 등록")
- AttendanceRow × N (AnimatedList)
- 기존 getMonthlyAttendance() 데이터 흐름 유지

**Step 2: 빌드 확인 후 Commit**

```bash
git commit -m "refactor(admin2): Attendance 페이지 .pen 디자인 기준 리빌드"
```

---

### Task 8: Analytics 페이지 리빌드 (`/admin2/analyze`)

**Files:**
- Modify: `app/admin2/analyze/page.tsx` (270줄 → .pen 디자인 기준 재작성)
- Modify: `app/admin2/analyze/components/YearMonthSelector.tsx`

**Step 1: .pen 디자인(Screen/AdminAnalytics) 기준으로 교체**

- YearMonthSelector → 기존 로직 유지, UI만 .pen 반영
- 차트 카드 3개 (bg-surface, rounded-xl, padding 16)
- 기존 서버사이드 데이터 처리 유지

**Step 2: 빌드 확인 후 Commit**

```bash
git commit -m "refactor(admin2): Analytics 페이지 .pen 디자인 기준 리빌드"
```

---

### Task 9: Settings 페이지 리빌드 (`/admin2/settings`)

**Files:**
- Modify: `app/admin2/settings/page.tsx`
- Modify: `app/admin2/settings/components/SettingsManagement.tsx`

**Step 1: .pen 디자인(Screen/AdminSettings + Staff + InviteCodes) 기준으로 교체**

- AdminTabBar(장소 | 운영진 | 초대코드)
- [장소 탭] AdminSwitchRow + AdminLabeledInput × 3 + 장소 목록
- [운영진 탭] AdminSearchBar + 운영진 목록 + 멤버 목록
- [초대코드 탭] 코드 리스트 + AdminSmallButton("+ 새 코드 생성")

**Step 2: 빌드 확인 후 Commit**

```bash
git commit -m "refactor(admin2): Settings 페이지 .pen 디자인 기준 리빌드"
```

---

### Task 10: Grade 페이지 리빌드 (`/admin2/settings/grade`)

**Files:**
- Modify: `app/admin2/settings/grade/page.tsx`
- Modify: `app/admin2/settings/grade/components/GradeManagementWrapper.tsx`

**Step 1: .pen 디자인(Screen/AdminSettings-Grade*) 기준으로 교체**

- AdminTabBar(장소 | 운영진 | 초대코드 | 등급[active])
- SubTabBar(등급 설정 | 추천 확인 | 수동 지정)
- 서브탭별 콘텐츠

**Step 2: 빌드 확인 후 Commit**

```bash
git commit -m "refactor(admin2): Grade 페이지 .pen 디자인 기준 리빌드"
```

---

## Phase 3: 신규 페이지 구현

### Task 11: Notice 페이지 구현 (`/admin2/notice`)

**Files:**
- Modify: `app/admin2/notice/page.tsx`
- Create: `app/admin2/notice/components/NoticeManagement.tsx`

**Step 1: .pen 디자인(Screen/AdminNotice) 기준으로 구현**

- PageHeader("공지사항 관리", backLink="/admin2/menu")
- CountRow + AdminSmallButton("+ 새 공지")
- NoticeCard 리스트 (AdminBadge + 날짜 + 제목 + 설명)
- AnimatedList 적용

**Step 2: 빌드 확인 후 Commit**

```bash
git commit -m "feat(admin2): Notice 페이지 .pen 디자인 기준 신규 구현"
```

---

### Task 12: Push 페이지 구현 (`/admin2/push`)

**Files:**
- Modify: `app/admin2/push/page.tsx`
- Create: `app/admin2/push/components/PushManagement.tsx`

**Step 1: .pen 디자인(Screen/AdminPush) 기준으로 구현**

- PageHeader("푸시 알림 발송", backLink="/admin2/menu")
- AdminSelect("발송 대상")
- AdminLabeledInput("알림 제목")
- TextArea("알림 내용") — bg-surface, height 120, border
- Button/Primary("알림 발송", send 아이콘)
- AdminDivider
- SectionLabel("최근 발송 내역")
- PushHistoryItem 리스트

**Step 2: 빌드 확인 후 Commit**

```bash
git commit -m "feat(admin2): Push 페이지 .pen 디자인 기준 신규 구현"
```

---

### Task 13: Crew-Edit 페이지 구현 (`/admin2/crew-edit`)

**Files:**
- Modify: `app/admin2/crew-edit/page.tsx`
- Create: `app/admin2/crew-edit/components/CrewEditManagement.tsx`

**Step 1: .pen 디자인(Screen/AdminCrewEdit) 기준으로 구현**

- PageHeader("크루 정보 편집", backLink="/admin2/menu")
- LogoSection (80px circle + "크루 로고 변경")
- AdminLabeledInput("크루명", "활동 지역", "최대 인원")
- TextArea("크루 소개")
- AdminDivider
- InfoRow (생성일 + 현재 인원)
- Button/Primary("저장")

**Step 2: 빌드 확인 후 Commit**

```bash
git commit -m "feat(admin2): Crew-Edit 페이지 .pen 디자인 기준 신규 구현"
```

---

## Phase 4: 최종 검증

### Task 14: 전체 빌드 검증 및 loading.tsx 업데이트

**Files:**
- Modify: `app/admin2/loading.tsx`

**Step 1: loading.tsx를 새 디자인 시스템에 맞게 업데이트**

- 정적 스켈레톤 (animate-pulse 금지)
- bg-surface 배경 사용

**Step 2: 전체 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공, 에러 0

**Step 3: Commit**

```bash
git commit -m "refactor(admin2): loading.tsx 업데이트 및 전체 빌드 검증"
```
