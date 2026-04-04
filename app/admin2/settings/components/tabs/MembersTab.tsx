"use client";

import {
    memo,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    AdminSearchBar,
    AdminBadge,
    AdminSmallButton,
    AdminDivider,
    AdminAlertDialog,
} from "@/app/admin2/components/ui";
import { haptic } from "@/lib/haptic";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";

interface CrewMember {
    user_id: string;
    first_name: string;
    last_name: string | null;
    role: string;
    is_crew_verified: boolean;
    email?: string;
    joined_at?: string;
}

interface MembersTabProps {
    crewId: string;
}

// 아바타 색상
const AVATAR_COLORS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
];

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash =
            name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[
        Math.abs(hash) % AVATAR_COLORS.length
    ];
}

function getDisplayName(m: CrewMember) {
    return m.last_name
        ? `${m.last_name}${m.first_name}`
        : m.first_name;
}

function getInitial(m: CrewMember) {
    const name = getDisplayName(m);
    return name.charAt(0);
}

const MembersTab = memo(function MembersTab({
    crewId,
}: MembersTabProps) {
    const [members, setMembers] = useState<
        CrewMember[]
    >([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionTarget, setActionTarget] =
        useState<CrewMember | null>(null);
    const [actionType, setActionType] = useState<
        "promote" | "demote" | null
    >(null);

    // 멤버 목록 조회
    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/admin/crew-members`
                + `?crewId=${crewId}`
            );
            const result = await res.json();
            if (res.ok && result.success) {
                setMembers(result.data || []);
            }
        } catch {
            // 에러 무시
        } finally {
            setLoading(false);
        }
    }, [crewId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // 권한 변경
    const handleRoleChange =
        useCallback(async () => {
            if (!actionTarget || !actionType) return;
            haptic.medium();

            try {
                const newRole =
                    actionType === "promote"
                        ? "admin"
                        : "member";
                const res = await fetch(
                    "/api/admin/crew-members",
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            crewId,
                            userId:
                                actionTarget.user_id,
                            role: newRole,
                        }),
                    }
                );
                if (res.ok) {
                    haptic.success();
                    setMembers((prev) =>
                        prev.map((m) =>
                            m.user_id ===
                            actionTarget.user_id
                                ? {
                                      ...m,
                                      role: newRole,
                                  }
                                : m
                        )
                    );
                }
            } catch {
                haptic.error();
            } finally {
                setActionTarget(null);
                setActionType(null);
            }
        }, [actionTarget, actionType, crewId]);

    // 필터링
    const admins = members.filter(
        (m) =>
            m.role === "admin" ||
            m.role === "owner"
    );
    const regularMembers = members.filter(
        (m) => m.role === "member"
    );

    const filteredMembers = search
        ? regularMembers.filter((m) =>
              getDisplayName(m)
                  .toLowerCase()
                  .includes(search.toLowerCase())
          )
        : regularMembers;

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={
                            "h-16 rounded-xl"
                            + " bg-rh-bg-surface"
                        }
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 운영진 목록 */}
            <div className="space-y-3">
                <div
                    className={
                        "flex items-center"
                        + " justify-between"
                    }
                >
                    <h3
                        className={
                            "text-sm font-semibold"
                            + " text-white"
                        }
                    >
                        운영진 목록
                    </h3>
                    <span
                        className={
                            "text-xs"
                            + " text-rh-text-secondary"
                        }
                    >
                        {admins.length}인
                    </span>
                </div>

                <AnimatedList
                    className="space-y-2"
                >
                    {admins.map((m) => (
                        <AnimatedItem
                            key={m.user_id}
                        >
                            <div
                                onClick={
                                    m.role !== "owner"
                                        ? () => {
                                              haptic.light();
                                              setActionTarget(
                                                  m
                                              );
                                              setActionType(
                                                  "demote"
                                              );
                                          }
                                        : undefined
                                }
                                className={
                                    "flex items-center"
                                    + " justify-between"
                                    + " px-4 py-3"
                                    + " rounded-xl"
                                    + " bg-rh-bg-surface"
                                    + (m.role !==
                                    "owner"
                                        ? " cursor-pointer"
                                        : "")
                                }
                            >
                                <div
                                    className={
                                        "flex"
                                        + " items-center"
                                        + " gap-3"
                                    }
                                >
                                    <div
                                        className={
                                            "w-10 h-10"
                                            + " rounded-full"
                                            + " flex"
                                            + " items-center"
                                            + " justify-center"
                                            + " text-white"
                                            + " text-sm"
                                            + " font-bold "
                                            + getAvatarColor(
                                                  getDisplayName(
                                                      m
                                                  )
                                              )
                                        }
                                    >
                                        {getInitial(
                                            m
                                        )}
                                    </div>
                                    <div>
                                        <div
                                            className={
                                                "flex"
                                                + " items-center"
                                                + " gap-2"
                                            }
                                        >
                                            <span
                                                className={
                                                    "text-sm"
                                                    + " font-semibold"
                                                    + " text-white"
                                                }
                                            >
                                                {getDisplayName(
                                                    m
                                                )}
                                            </span>
                                            {m.role ===
                                            "owner" ? (
                                                <AdminBadge variant="accent">
                                                    크루장
                                                </AdminBadge>
                                            ) : (
                                                <AdminBadge variant="outline">
                                                    운영진
                                                </AdminBadge>
                                            )}
                                        </div>
                                        <span
                                            className={
                                                "text-xs"
                                                + " text-rh-text-secondary"
                                            }
                                        >
                                            {m.role ===
                                            "owner"
                                                ? "크루장 · 전체 권한"
                                                : "운영진 · 출석/회원 관리"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            </div>

            <AdminDivider />

            {/* 멤버 목록 */}
            <div className="space-y-3">
                <h3
                    className={
                        "text-sm font-semibold"
                        + " text-white"
                    }
                >
                    멤버 목록
                </h3>
                <p
                    className={
                        "text-xs"
                        + " text-rh-text-secondary"
                    }
                >
                    운영진으로 추가할 멤버를
                    선택하세요
                </p>

                {/* 검색 */}
                <AdminSearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="검색어를 입력하세요"
                />

                <AnimatedList
                    className="space-y-2"
                >
                    {filteredMembers.map((m) => (
                        <AnimatedItem
                            key={m.user_id}
                        >
                            <div
                                className={
                                    "flex"
                                    + " items-center"
                                    + " justify-between"
                                    + " px-4 py-3"
                                    + " rounded-xl"
                                    + " bg-rh-bg-surface"
                                }
                            >
                                <div
                                    className={
                                        "flex"
                                        + " items-center"
                                        + " gap-3"
                                    }
                                >
                                    <div
                                        className={
                                            "w-10 h-10"
                                            + " rounded-full"
                                            + " flex"
                                            + " items-center"
                                            + " justify-center"
                                            + " text-white"
                                            + " text-sm"
                                            + " font-bold "
                                            + getAvatarColor(
                                                  getDisplayName(
                                                      m
                                                  )
                                              )
                                        }
                                    >
                                        {getInitial(
                                            m
                                        )}
                                    </div>
                                    <span
                                        className={
                                            "text-sm"
                                            + " font-semibold"
                                            + " text-white"
                                        }
                                    >
                                        {getDisplayName(
                                            m
                                        )}
                                    </span>
                                </div>
                                <AdminSmallButton
                                    onClick={() => {
                                        setActionTarget(
                                            m
                                        );
                                        setActionType(
                                            "promote"
                                        );
                                    }}
                                >
                                    권한 부여
                                </AdminSmallButton>
                            </div>
                        </AnimatedItem>
                    ))}
                    {filteredMembers.length ===
                        0 && (
                        <p
                            className={
                                "py-8 text-center"
                                + " text-sm"
                                + " text-rh-text-secondary"
                            }
                        >
                            {search
                                ? "검색 결과가 없습니다"
                                : "일반 멤버가 없습니다"}
                        </p>
                    )}
                </AnimatedList>
            </div>

            {/* 권한 변경 확인 */}
            <AdminAlertDialog
                open={
                    !!actionTarget && !!actionType
                }
                onClose={() => {
                    setActionTarget(null);
                    setActionType(null);
                }}
                onConfirm={handleRoleChange}
                title={
                    actionType === "promote"
                        ? "운영진으로 등록하시겠습니까?"
                        : "운영진을 해제하시겠습니까?"
                }
                description={
                    actionTarget
                        ? actionType === "promote"
                            ? `${getDisplayName(actionTarget)}님을 운영진으로 등록합니다. 이 작업은 즉시 적용됩니다.`
                            : `${getDisplayName(actionTarget)}님을 일반 멤버로 변경합니다. 이 작업은 즉시 적용됩니다.`
                        : ""
                }
                confirmLabel={
                    actionType === "promote"
                        ? "등록"
                        : "해제"
                }
                confirmVariant={
                    actionType === "demote"
                        ? "danger"
                        : "primary"
                }
            />
        </div>
    );
});

export default MembersTab;
