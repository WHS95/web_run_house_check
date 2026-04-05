# Admin2 Push 리빌드 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/admin2/push` 화면을 `.pen` 디자인(AdminPush-Selected, AdminPush-SelectMembers)에 맞춰 "전체/선택" 모드 토글과 멤버 선택 바텀시트로 리빌드한다.

**Architecture:** 디자인 시스템에 재사용 컴포넌트 4개(SegmentedControl, Avatar, MemberChip, MemberPickerSheet)를 추가하고, `PushManagement.tsx`를 전면 리팩토링해 mode/selectedIds 상태를 도입한다. 백엔드 변경 없음 — 기존 `POST /api/push/test`가 `userIds[]`를 이미 지원하며, `/api/admin/users?crewId=X`에서 크루원 목록을 조회한다.

**Tech Stack:** Next.js 14, React (memo/useCallback), Tailwind CSS, Framer Motion, Lucide React

**디자인 토큰:**
- 배경: `bg-rh-bg-primary`, `bg-rh-bg-surface`, `bg-rh-bg-muted`
- 강조: `bg-rh-accent` (#669FF2)
- 텍스트: `text-white`, `text-rh-text-secondary`, `text-rh-text-tertiary`, `text-rh-text-muted`
- 테두리: `border-rh-border`
- 애니메이션: **금지 항목 주의** — Suspense 스켈레톤에 `animate-pulse` 금지

---

## Task 1: AdminAvatar 컴포넌트 작성

**Files:**
- Create: `app/admin2/components/ui/AdminAvatar.tsx`

**Step 1: 파일 작성**

```tsx
"use client";
import { memo } from "react";

interface AdminAvatarProps {
    name: string;
    size?: number;
}

const AdminAvatar = memo(function AdminAvatar({
    name,
    size = 36,
}: AdminAvatarProps) {
    const initial = name?.trim().charAt(0) || "?";
    const fontSize = Math.round(size * 0.44);

    return (
        <div
            className="flex items-center justify-center rounded-full bg-rh-bg-muted text-white font-semibold shrink-0"
            style={{
                width: size,
                height: size,
                fontSize,
            }}
        >
            {initial}
        </div>
    );
});

export default AdminAvatar;
```

**Step 2: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add app/admin2/components/ui/AdminAvatar.tsx
git commit -m "feat(admin2): AdminAvatar 컴포넌트 추가"
```

---

## Task 2: AdminSegmentedControl 컴포넌트 작성

**Files:**
- Create: `app/admin2/components/ui/AdminSegmentedControl.tsx`

**Step 1: 파일 작성**

```tsx
"use client";
import { memo, useCallback } from "react";

interface Option {
    value: string;
    label: string;
    badge?: number;
}

interface AdminSegmentedControlProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}

const AdminSegmentedControl = memo(function AdminSegmentedControl({
    options,
    value,
    onChange,
}: AdminSegmentedControlProps) {
    return (
        <div className="flex p-1 rounded-xl bg-rh-bg-surface border border-rh-border">
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <SegmentButton
                        key={opt.value}
                        option={opt}
                        active={active}
                        onSelect={onChange}
                    />
                );
            })}
        </div>
    );
});

interface SegmentButtonProps {
    option: Option;
    active: boolean;
    onSelect: (value: string) => void;
}

const SegmentButton = memo(function SegmentButton({
    option,
    active,
    onSelect,
}: SegmentButtonProps) {
    const handleClick = useCallback(() => {
        onSelect(option.value);
    }, [onSelect, option.value]);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-colors ${
                active
                    ? "bg-rh-accent text-white"
                    : "text-rh-text-secondary"
            }`}
        >
            <span>{option.label}</span>
            {typeof option.badge === "number" && (
                <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                        active
                            ? "bg-white/25 text-white"
                            : "bg-rh-bg-muted text-rh-text-secondary"
                    }`}
                >
                    {option.badge}
                </span>
            )}
        </button>
    );
});

export default AdminSegmentedControl;
```

**Step 2: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add app/admin2/components/ui/AdminSegmentedControl.tsx
git commit -m "feat(admin2): AdminSegmentedControl 컴포넌트 추가"
```

---

## Task 3: AdminMemberChip 컴포넌트 작성

**Files:**
- Create: `app/admin2/components/ui/AdminMemberChip.tsx`

**Step 1: 파일 작성**

```tsx
"use client";
import { memo, useCallback } from "react";
import { X } from "lucide-react";
import AdminAvatar from "./AdminAvatar";

interface AdminMemberChipProps {
    name: string;
    onRemove: () => void;
}

const AdminMemberChip = memo(function AdminMemberChip({
    name,
    onRemove,
}: AdminMemberChipProps) {
    const handleRemove = useCallback(() => {
        onRemove();
    }, [onRemove]);

    return (
        <div className="inline-flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-full bg-rh-bg-surface border border-rh-border">
            <AdminAvatar name={name} size={24} />
            <span className="text-xs font-medium text-white">
                {name}
            </span>
            <button
                type="button"
                onClick={handleRemove}
                className="flex items-center justify-center w-4 h-4 text-rh-text-tertiary hover:text-white transition-colors"
                aria-label={`${name} 제거`}
            >
                <X size={14} />
            </button>
        </div>
    );
});

export default AdminMemberChip;
```

**Step 2: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add app/admin2/components/ui/AdminMemberChip.tsx
git commit -m "feat(admin2): AdminMemberChip 컴포넌트 추가"
```

---

## Task 4: AdminMemberPickerSheet 컴포넌트 작성

**Files:**
- Create: `app/admin2/components/ui/AdminMemberPickerSheet.tsx`

**Step 1: AdminSearchBar 시그니처 확인**

Run: `cat app/admin2/components/ui/AdminSearchBar.tsx`
Expected: 컴포넌트 props 확인 (value, onChange, placeholder 등)

**Step 2: AdminCheckbox 시그니처 확인**

Run: `cat app/admin2/components/ui/AdminCheckbox.tsx`
Expected: 컴포넌트 props 확인 (checked, onChange 등)

**Step 3: 파일 작성**

```tsx
"use client";
import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminAvatar from "./AdminAvatar";
import AdminSearchBar from "./AdminSearchBar";
import AdminCheckbox from "./AdminCheckbox";
import { haptic } from "@/lib/haptic";

export interface PickerMember {
    id: string;
    name: string;
}

interface AdminMemberPickerSheetProps {
    open: boolean;
    onClose: () => void;
    members: PickerMember[];
    selectedIds: Set<string>;
    onConfirm: (ids: Set<string>) => void;
}

const AdminMemberPickerSheet = memo(function AdminMemberPickerSheet({
    open,
    onClose,
    members,
    selectedIds,
    onConfirm,
}: AdminMemberPickerSheetProps) {
    const [query, setQuery] = useState("");
    const [draft, setDraft] = useState<Set<string>>(selectedIds);

    // 시트 열릴 때마다 draft 초기화
    useEffect(() => {
        if (open) {
            setDraft(new Set(selectedIds));
            setQuery("");
        }
    }, [open, selectedIds]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) =>
            m.name.toLowerCase().includes(q),
        );
    }, [members, query]);

    const allSelected = useMemo(
        () =>
            members.length > 0 && draft.size === members.length,
        [members.length, draft.size],
    );

    const toggleAll = useCallback(() => {
        haptic.light();
        setDraft((prev) =>
            prev.size === members.length
                ? new Set()
                : new Set(members.map((m) => m.id)),
        );
    }, [members]);

    const toggleOne = useCallback((id: string) => {
        haptic.light();
        setDraft((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        haptic.medium();
        onConfirm(draft);
        onClose();
    }, [draft, onConfirm, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="absolute inset-0 z-[100] flex flex-col justify-end"
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
                        className="relative z-10 flex flex-col bg-rh-bg-surface rounded-t-2xl max-h-[85%]"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                        }}
                    >
                        {/* 드래그 핸들 */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-rh-bg-muted" />
                        </div>

                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 pb-3">
                            <h3 className="text-lg font-semibold text-white">
                                크루원 선택
                            </h3>
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="text-sm font-medium text-rh-accent"
                            >
                                {allSelected ? "전체 해제" : "전체 선택"}
                            </button>
                        </div>

                        {/* 검색 */}
                        <div className="px-5 pb-3">
                            <AdminSearchBar
                                value={query}
                                onChange={setQuery}
                                placeholder="이름으로 검색"
                            />
                        </div>

                        {/* 리스트 */}
                        <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ overscrollBehavior: "contain" }}>
                            {filtered.length === 0 ? (
                                <div className="flex items-center justify-center h-24 text-sm text-rh-text-tertiary">
                                    결과가 없습니다
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-1">
                                    {filtered.map((m) => (
                                        <MemberRow
                                            key={m.id}
                                            member={m}
                                            checked={draft.has(m.id)}
                                            onToggle={toggleOne}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* 확정 버튼 */}
                        <div className="px-5 pt-2 pb-5 pb-safe border-t border-rh-border">
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={draft.size === 0}
                                className="w-full h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                            >
                                {draft.size}명 선택 완료
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

interface MemberRowProps {
    member: PickerMember;
    checked: boolean;
    onToggle: (id: string) => void;
}

const MemberRow = memo(function MemberRow({
    member,
    checked,
    onToggle,
}: MemberRowProps) {
    const handleClick = useCallback(() => {
        onToggle(member.id);
    }, [onToggle, member.id]);

    return (
        <li>
            <button
                type="button"
                onClick={handleClick}
                className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-colors ${
                    checked ? "bg-rh-accent/20" : "hover:bg-rh-bg-muted/30"
                }`}
            >
                <AdminCheckbox
                    checked={checked}
                    onChange={handleClick}
                />
                <AdminAvatar name={member.name} size={36} />
                <div className="flex-1 flex flex-col items-start">
                    <span className="text-sm font-medium text-white">
                        {member.name}
                    </span>
                    <span className="text-xs text-rh-text-tertiary">
                        크루원
                    </span>
                </div>
            </button>
        </li>
    );
});

export default AdminMemberPickerSheet;
```

**Step 4: AdminSearchBar/AdminCheckbox props 불일치 시 시그니처에 맞게 조정**

만약 `cat`으로 확인한 props가 위 코드와 다르면 `onChange` 콜백 시그니처, `value`/`checked` prop 이름을 맞춰 수정한다.

**Step 5: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

**Step 6: Commit**

```bash
git add app/admin2/components/ui/AdminMemberPickerSheet.tsx
git commit -m "feat(admin2): AdminMemberPickerSheet 바텀시트 컴포넌트 추가"
```

---

## Task 5: index.ts에 신규 컴포넌트 export 추가

**Files:**
- Modify: `app/admin2/components/ui/index.ts`

**Step 1: 현재 index.ts 확인**

Run: `cat app/admin2/components/ui/index.ts`
Expected: 기존 export 목록 확인

**Step 2: 신규 export 추가**

4개 export 추가:
```ts
export { default as AdminAvatar } from "./AdminAvatar";
export { default as AdminSegmentedControl } from "./AdminSegmentedControl";
export { default as AdminMemberChip } from "./AdminMemberChip";
export { default as AdminMemberPickerSheet } from "./AdminMemberPickerSheet";
export type { PickerMember } from "./AdminMemberPickerSheet";
```

**Step 3: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

**Step 4: Commit**

```bash
git add app/admin2/components/ui/index.ts
git commit -m "feat(admin2): 신규 UI 컴포넌트 export 추가"
```

---

## Task 6: PushManagement.tsx 리팩토링

**Files:**
- Modify: `app/admin2/push/components/PushManagement.tsx`

**Step 1: 전체 파일 교체**

```tsx
"use client";

import { useState, useCallback, useEffect, useRef, memo, useMemo } from "react";
import { Send, ChevronDown } from "lucide-react";
import AdminSegmentedControl from "@/app/admin2/components/ui/AdminSegmentedControl";
import AdminMemberChip from "@/app/admin2/components/ui/AdminMemberChip";
import AdminMemberPickerSheet from "@/app/admin2/components/ui/AdminMemberPickerSheet";
import AdminLabeledInput from "@/app/admin2/components/ui/AdminLabeledInput";
import AdminDivider from "@/app/admin2/components/ui/AdminDivider";
import PushHistoryItem from "@/app/admin2/components/ui/PushHistoryItem";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";

interface Member {
    id: string;
    name: string;
}

interface PushHistory {
    id: string;
    title: string;
    date: string;
    target: string;
    status: string;
}

interface PushManagementProps {
    crewId: string;
}

const PushManagement = memo(function PushManagement({
    crewId,
}: PushManagementProps) {
    const [mode, setMode] = useState<"all" | "select">("all");
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState<PushHistory[]>([]);

    // 크루원 로드
    useEffect(() => {
        let cancelled = false;
        fetch(`/api/admin/users?crewId=${crewId}`)
            .then((res) => res.json())
            .then((json) => {
                if (cancelled) return;
                if (json?.success && Array.isArray(json.data)) {
                    const list: Member[] = json.data.map((u: { id: string; first_name: string }) => ({
                        id: u.id,
                        name: u.first_name,
                    }));
                    setMembers(list);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [crewId]);

    const targetIds = useMemo(
        () =>
            mode === "all"
                ? members.map((m) => m.id)
                : Array.from(selectedIds),
        [mode, members, selectedIds],
    );

    const selectedMembers = useMemo(
        () => members.filter((m) => selectedIds.has(m.id)),
        [members, selectedIds],
    );

    const canSend =
        title.trim().length > 0 &&
        body.trim().length > 0 &&
        targetIds.length > 0 &&
        !isSending;

    const segmentOptions = useMemo(
        () => [
            { value: "all", label: "전체" },
            { value: "select", label: "선택", badge: selectedIds.size },
        ],
        [selectedIds.size],
    );

    const handleModeChange = useCallback((value: string) => {
        setMode(value as "all" | "select");
    }, []);

    const handleOpenPicker = useCallback(() => {
        setPickerOpen(true);
    }, []);

    const handleClosePicker = useCallback(() => {
        setPickerOpen(false);
    }, []);

    const handleConfirmPicker = useCallback((ids: Set<string>) => {
        setSelectedIds(ids);
    }, []);

    const handleRemoveMember = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    // ref로 최신 값 참조
    const titleRef = useRef(title);
    titleRef.current = title;
    const bodyRef = useRef(body);
    bodyRef.current = body;
    const targetIdsRef = useRef(targetIds);
    targetIdsRef.current = targetIds;
    const modeRef = useRef(mode);
    modeRef.current = mode;

    const handleSend = useCallback(async () => {
        const currentTitle = titleRef.current.trim();
        const currentBody = bodyRef.current.trim();
        const currentIds = targetIdsRef.current;
        if (!currentTitle || !currentBody || currentIds.length === 0) return;

        setIsSending(true);
        try {
            const res = await fetch("/api/push/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds: currentIds,
                    title: currentTitle,
                    body: currentBody,
                }),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                const now = new Date();
                const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
                const targetLabel =
                    modeRef.current === "all"
                        ? `전체 크루원 · ${result.targetCount}명`
                        : `선택 크루원 · ${result.targetCount}명`;
                setHistory((prev) => [
                    {
                        id: crypto.randomUUID(),
                        title: currentTitle,
                        date: dateStr,
                        target: targetLabel,
                        status: "발송 완료",
                    },
                    ...prev,
                ]);

                setTitle("");
                setBody("");
                alert(
                    `발송 완료 (성공: ${result.successCount}, 실패: ${result.failureCount})`,
                );
            } else {
                alert(result.error || "발송에 실패했습니다.");
            }
        } catch {
            alert("발송 중 오류가 발생했습니다.");
        } finally {
            setIsSending(false);
        }
    }, []);

    return (
        <div className="flex-1 flex flex-col gap-5 px-4 pt-5">
            {/* 발송 대상 */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-rh-text-secondary">
                    발송 대상
                </label>
                <AdminSegmentedControl
                    options={segmentOptions}
                    value={mode}
                    onChange={handleModeChange}
                />

                {mode === "select" && (
                    <div className="flex flex-col gap-2 mt-2">
                        <button
                            type="button"
                            onClick={handleOpenPicker}
                            className="flex items-center justify-between h-12 px-4 rounded-lg bg-rh-bg-surface border border-rh-border text-sm"
                        >
                            <span
                                className={
                                    selectedIds.size > 0
                                        ? "text-white"
                                        : "text-rh-text-muted"
                                }
                            >
                                {selectedIds.size > 0
                                    ? `크루원 선택 (${selectedIds.size}명)`
                                    : "크루원을 선택해주세요"}
                            </span>
                            <ChevronDown
                                size={18}
                                className="text-rh-text-tertiary"
                            />
                        </button>

                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedMembers.map((m) => (
                                    <AdminMemberChip
                                        key={m.id}
                                        name={m.name}
                                        onRemove={() => handleRemoveMember(m.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 알림 제목 */}
            <AdminLabeledInput
                label="알림 제목"
                value={title}
                onChange={setTitle}
                placeholder="알림 제목을 입력하세요"
            />

            {/* 알림 내용 */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-rh-text-secondary">
                    알림 내용
                </label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="크루원에게 전달할 내용을 입력하세요"
                    rows={4}
                    className="w-full h-[120px] px-4 py-4 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white placeholder:text-rh-text-muted outline-none resize-none transition-colors focus:border-rh-accent"
                />
            </div>

            {/* 발송 버튼 */}
            <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
                <Send size={18} />
                {isSending ? "발송 중..." : "알림 발송"}
            </button>

            <AdminDivider />

            {/* 최근 발송 내역 */}
            <div className="flex flex-col gap-3">
                <span className="text-[11px] font-semibold tracking-[2px] text-rh-text-tertiary">
                    최근 발송 내역
                </span>

                {history.length === 0 ? (
                    <div className="flex items-center justify-center h-20 rounded-xl bg-rh-bg-surface">
                        <span className="text-xs text-rh-text-tertiary">
                            발송 내역이 없습니다
                        </span>
                    </div>
                ) : (
                    <AnimatedList className="flex flex-col gap-3">
                        {history.map((item) => (
                            <AnimatedItem key={item.id}>
                                <PushHistoryItem
                                    title={item.title}
                                    date={item.date}
                                    target={item.target}
                                    status={item.status}
                                />
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                )}
            </div>

            {/* 멤버 선택 바텀시트 */}
            <AdminMemberPickerSheet
                open={pickerOpen}
                onClose={handleClosePicker}
                members={members}
                selectedIds={selectedIds}
                onConfirm={handleConfirmPicker}
            />
        </div>
    );
});

export default PushManagement;
```

**Step 2: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공, 타입/린트 에러 없음

**Step 3: 개발 서버 실행 후 수동 검증**

Run: `npm run dev`
수동 확인:
1. `/admin2/push` 진입 → 세그먼트 컨트롤 [전체 | 선택 0] 표시
2. "선택" 클릭 → 드롭다운 버튼 + "크루원을 선택해주세요" 표시
3. 드롭다운 클릭 → 바텀시트 slide-up
4. 검색 → 체크 3명 → "3명 선택 완료" 클릭
5. 시트 닫히고 칩 3개 표시 + 세그먼트 "선택 3"
6. 칩 ✕ 클릭 → 제거 확인
7. "전체" 모드 전환 → 칩/드롭다운 숨김
8. 제목/내용 입력 → 발송 버튼 활성화
9. 발송 성공 시 발송 내역에 추가

**Step 4: Commit**

```bash
git add app/admin2/push/components/PushManagement.tsx
git commit -m "refactor(admin2): /admin2/push 전체/선택 모드 토글 및 멤버 선택 바텀시트 도입"
```

---

## Task 7: 최종 검증

**Step 1: 전체 빌드 재확인**

Run: `npm run build`
Expected: 빌드 성공, 경고 최소화

**Step 2: 린트 재확인**

Run: `npm run lint`
Expected: 에러 없음

**Step 3: git log 확인**

Run: `git log --oneline -10`
Expected: 커밋 6~7개가 순서대로 기록됨 (Task 1~6)

---

## 참고

- **레이아웃 규칙:** `BottomNavigation`을 페이지에 렌더링하지 말 것 (루트 레이아웃이 처리)
- **색상 규칙:** 하드코딩 금지, `bg-rh-*`/`text-rh-*` Tailwind 클래스만 사용
- **애니메이션 규칙:** Suspense fallback에 `animate-pulse` 사용 금지 (이 플랜에는 해당 없음)
- **Hydration:** `new Date()`는 이벤트 핸들러 내부에서만 사용 (Task 6의 `handleSend` 안에서만 사용됨)
