"use client";

import {
    memo,
    useCallback,
    useMemo,
    useState,
    useTransition,
} from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import { haptic } from "@/lib/haptic";
import { updateCrewMemberRoleAction } from "@/app/master/actions";
import type { CrewMemberRow } from "@/lib/domain/master/types";

interface MembersClientProps {
    crewId: string;
    initialMembers: CrewMemberRow[];
}

type CrewRole = "CREW_MANAGER" | "MEMBER";

function isCrewManager(role: string | null | undefined): boolean {
    return role === "CREW_MANAGER";
}

function getInitial(name: string | null): string {
    if (!name) return "?";
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed.charAt(0) : "?";
}

function MembersClient({ crewId, initialMembers }: MembersClientProps) {
    const [members, setMembers] =
        useState<CrewMemberRow[]>(initialMembers);
    const [query, setQuery] = useState("");
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    const handleQueryChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
        },
        []
    );

    const handleToggleRole = useCallback(
        (userId: string, currentRole: string | null) => {
            const nextRole: CrewRole = isCrewManager(currentRole)
                ? "MEMBER"
                : "CREW_MANAGER";

            haptic.medium();
            setError(null);
            setSuccess(null);
            setPendingId(userId);

            startTransition(async () => {
                try {
                    const result = await updateCrewMemberRoleAction({
                        crewId,
                        userId,
                        newRole: nextRole,
                    });
                    if (result.success) {
                        // 로컬 patch — 불필요한 refetch 회피
                        setMembers((prev) =>
                            prev.map((m) =>
                                m.id === userId
                                    ? { ...m, crew_role: nextRole }
                                    : m
                            )
                        );
                        setSuccess(
                            result.message ??
                                (nextRole === "CREW_MANAGER"
                                    ? "운영진으로 승격되었습니다."
                                    : "일반 멤버로 변경되었습니다.")
                        );
                    } else {
                        setError(
                            result.message ??
                                "권한 변경에 실패했습니다."
                        );
                    }
                } catch {
                    setError("권한 변경 중 오류가 발생했습니다.");
                } finally {
                    setPendingId(null);
                }
            });
        },
        [crewId]
    );

    const filteredMembers = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? members.filter((m) => {
                  const name = (m.first_name ?? "").toLowerCase();
                  const email = (m.email ?? "").toLowerCase();
                  return name.includes(q) || email.includes(q);
              })
            : members;

        // 정렬: 운영진 우선, 그 다음 이름 가나다순
        return [...base].sort((a, b) => {
            const aManager = isCrewManager(a.crew_role) ? 0 : 1;
            const bManager = isCrewManager(b.crew_role) ? 0 : 1;
            if (aManager !== bManager) return aManager - bManager;
            const aName = a.first_name ?? "";
            const bName = b.first_name ?? "";
            return aName.localeCompare(bName, "ko");
        });
    }, [members, query]);

    const managerCount = useMemo(
        () =>
            members.reduce(
                (acc, m) => acc + (isCrewManager(m.crew_role) ? 1 : 0),
                0
            ),
        [members]
    );

    return (
        <div className="space-y-4">
            {/* 카운트 */}
            <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-white">
                    멤버 {members.length}명
                </span>
                <span className="text-[12px] text-rh-text-tertiary">
                    운영진 {managerCount}명
                </span>
            </div>

            {/* 검색 */}
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-rh-text-tertiary pointer-events-none"
                />
                <Input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="이름 또는 이메일 검색"
                    className="pl-9 bg-rh-bg-surface border-rh-border text-white placeholder:text-rh-text-tertiary"
                />
            </div>

            {/* 알림 */}
            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-rh-status-error bg-rh-bg-surface px-4 py-3"
                >
                    <p className="text-[13px] text-rh-status-error">
                        {error}
                    </p>
                </div>
            )}
            {success && !error && (
                <div className="rounded-lg border border-rh-accent/40 bg-rh-bg-surface px-4 py-3">
                    <p className="text-[13px] text-rh-accent">
                        {success}
                    </p>
                </div>
            )}

            {/* 리스트 */}
            {filteredMembers.length === 0 ? (
                <div className="flex items-center justify-center py-12 rounded-xl bg-rh-bg-surface">
                    <p className="text-sm text-rh-text-tertiary">
                        조건에 맞는 멤버가 없습니다
                    </p>
                </div>
            ) : (
                <AnimatedList className="space-y-2" maxStaggerSec={0.6}>
                    {filteredMembers.map((m) => (
                        <AnimatedItem key={m.id}>
                            <MemberRow
                                member={m}
                                isPending={pendingId === m.id}
                                onToggleRole={handleToggleRole}
                            />
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            )}
        </div>
    );
}

export default memo(MembersClient);

// ─── Row ───

interface MemberRowProps {
    member: CrewMemberRow;
    isPending: boolean;
    onToggleRole: (userId: string, currentRole: string | null) => void;
}

const MemberRow = memo(function MemberRow({
    member,
    isPending,
    onToggleRole,
}: MemberRowProps) {
    const manager = isCrewManager(member.crew_role);
    const handleClick = useCallback(() => {
        onToggleRole(member.id, member.crew_role);
    }, [member.id, member.crew_role, onToggleRole]);

    const subText = member.email ?? member.phone ?? "";

    return (
        <div className="flex items-center gap-3 bg-rh-bg-surface rounded-xl px-4 py-3">
            <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-rh-bg-muted text-[13px] font-semibold text-white">
                {getInitial(member.first_name)}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white truncate">
                    {member.first_name ?? "이름 미등록"}
                </p>
                {subText && (
                    <p className="text-[11px] text-rh-text-tertiary truncate mt-0.5">
                        {subText}
                    </p>
                )}
            </div>
            <span
                className={
                    manager
                        ? "rounded-full px-2.5 py-1 text-[11px] font-medium bg-rh-accent/20 text-rh-accent"
                        : "rounded-full px-2.5 py-1 text-[11px] font-medium bg-rh-bg-muted text-rh-text-secondary"
                }
            >
                {manager ? "운영진" : "일반"}
            </span>
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-rh-bg-primary text-white active:opacity-70 transition-opacity disabled:opacity-40"
                aria-label={
                    manager
                        ? "일반 멤버로 변경"
                        : "운영진으로 승격"
                }
            >
                {isPending
                    ? "변경 중"
                    : manager
                      ? "강등"
                      : "승격"}
            </button>
        </div>
    );
});
