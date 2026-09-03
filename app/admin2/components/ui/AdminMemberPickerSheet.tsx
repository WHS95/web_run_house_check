"use client";
import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import AdminAvatar from "./AdminAvatar";
import AdminSearchBar from "./AdminSearchBar";
import AdminCheckbox from "./AdminCheckbox";
import { haptic } from "@/lib/haptic";
import DragSheet from "@/components/ui/DragSheet";

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
        <DragSheet
            open={open}
            onClose={onClose}
            label="크루원 선택"
            maxHeightClassName="max-h-[85%]"
        >
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
                        <div
                            className="flex-1 overflow-y-auto px-3 pb-3"
                            style={{ overscrollBehavior: "contain" }}
                        >
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
        </DragSheet>
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
    const handleToggle = useCallback(() => {
        onToggle(member.id);
    }, [onToggle, member.id]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggle();
            }
        },
        [handleToggle],
    );

    const handleCheckboxClick = useCallback(
        (e: React.MouseEvent<HTMLSpanElement>) => {
            e.stopPropagation();
        },
        [],
    );

    return (
        <li>
            <div
                role="button"
                tabIndex={0}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-colors cursor-pointer ${
                    checked ? "bg-rh-accent/20" : "hover:bg-rh-bg-muted/30"
                }`}
            >
                <span onClick={handleCheckboxClick}>
                    <AdminCheckbox
                        checked={checked}
                        onCheckedChange={handleToggle}
                    />
                </span>
                <AdminAvatar name={member.name} size={36} />
                <div className="flex-1 flex flex-col items-start">
                    <span className="text-sm font-medium text-white">
                        {member.name}
                    </span>
                    <span className="text-xs text-rh-text-tertiary">
                        크루원
                    </span>
                </div>
            </div>
        </li>
    );
});

export default AdminMemberPickerSheet;
