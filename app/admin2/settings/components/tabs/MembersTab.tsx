"use client";

import {
    memo,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
    AdminSearchBar,
    AdminDivider,
    AdminAlertDialog,
} from "@/app/admin2/components/ui";
import { haptic } from "@/lib/haptic";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";

// API에서 반환하는 크루 멤버 타입
interface CrewMember {
    id: string;
    first_name: string | null;
    email: string | null;
    phone: string | null;
    birth_year: number | null;
    profile_image_url: string | null;
    is_crew_verified: boolean;
    created_at: string;
    crew_role: "OWNER" | "CREW_MANAGER" | "MEMBER";
}

interface MembersTabProps {
    crewId: string;
}

// 아바타 색상 (블루 톤 계열)
const AVATAR_COLORS = [
    "bg-rh-accent",
    "bg-rh-status-success",
    "bg-rh-status-warning",
    "bg-rh-status-error",
    "bg-rh-bg-muted",
];

// 이름 기반 아바타 색상 결정
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

// "홍길동(95)" 형식의 표시 이름
function getDisplayName(m: CrewMember): string {
    const name = m.first_name || "이름없음";
    if (m.birth_year) {
        const yearSuffix = String(
            m.birth_year
        ).slice(-2);
        return `${name}(${yearSuffix})`;
    }
    return name;
}

// 이름의 첫 글자 (아바타용)
function getInitial(m: CrewMember): string {
    const name = m.first_name || "?";
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
    const [adminsOpen, setAdminsOpen] =
        useState(true);
    const [membersOpen, setMembersOpen] =
        useState(true);

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
                const isAdmin =
                    actionType === "promote";
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
                            userId: actionTarget.id,
                            isAdmin,
                        }),
                    }
                );
                if (res.ok) {
                    haptic.success();
                    // 로컬 상태 업데이트
                    setMembers((prev) =>
                        prev.map((m) =>
                            m.id === actionTarget.id
                                ? {
                                      ...m,
                                      crew_role: isAdmin
                                          ? "CREW_MANAGER"
                                          : "MEMBER",
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

    // 운영진 필터링 (OWNER, CREW_MANAGER)
    const admins = useMemo(
        () =>
            members.filter(
                (m) =>
                    m.crew_role === "OWNER" ||
                    m.crew_role === "CREW_MANAGER"
            ),
        [members]
    );

    // 일반 멤버 필터링
    const regularMembers = useMemo(
        () =>
            members.filter(
                (m) => m.crew_role === "MEMBER"
            ),
        [members]
    );

    // 검색 필터링
    const filteredMembers = useMemo(() => {
        if (!search) return regularMembers;
        const term = search.toLowerCase();
        return regularMembers.filter((m) =>
            getDisplayName(m)
                .toLowerCase()
                .includes(term)
        );
    }, [regularMembers, search]);

    // 로딩 스켈레톤 (정적, animate-pulse 금지)
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
            {/* 운영진 섹션 */}
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => {
                        haptic.light();
                        setAdminsOpen((v) => !v);
                    }}
                    className={
                        "flex items-center"
                        + " justify-between w-full"
                    }
                >
                    <div
                        className={
                            "flex items-baseline gap-2"
                        }
                    >
                        <h3
                            className={
                                "text-sm font-semibold"
                                + " text-white"
                            }
                        >
                            운영진
                        </h3>
                        <span
                            className={
                                "text-xs"
                                + " text-rh-text-secondary"
                            }
                        >
                            {admins.length}명
                        </span>
                    </div>
                    <ChevronDown
                        className={
                            "w-4 h-4"
                            + " text-rh-text-secondary"
                            + " transition-transform"
                            + (adminsOpen
                                ? ""
                                : " -rotate-90")
                        }
                    />
                </button>

                {adminsOpen && (
                <AnimatedList
                    className="space-y-2"
                >
                    {admins.map((m) => (
                        <AnimatedItem
                            key={m.id}
                        >
                            <div
                                onClick={
                                    m.crew_role !==
                                    "OWNER"
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
                                    + (m.crew_role !==
                                    "OWNER"
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
                                    {/* 아바타 */}
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
                                                  m.first_name
                                                  || ""
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
                            </div>
                        </AnimatedItem>
                    ))}
                </AnimatedList>
                )}
            </div>

            <AdminDivider />

            {/* 멤버 섹션 */}
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => {
                        haptic.light();
                        setMembersOpen((v) => !v);
                    }}
                    className={
                        "flex items-center"
                        + " justify-between w-full"
                    }
                >
                    <div
                        className={
                            "flex items-baseline gap-2"
                        }
                    >
                        <h3
                            className={
                                "text-sm font-semibold"
                                + " text-white"
                            }
                        >
                            멤버
                        </h3>
                        <span
                            className={
                                "text-xs"
                                + " text-rh-text-secondary"
                            }
                        >
                            {regularMembers.length}명
                        </span>
                    </div>
                    <ChevronDown
                        className={
                            "w-4 h-4"
                            + " text-rh-text-secondary"
                            + " transition-transform"
                            + (membersOpen
                                ? ""
                                : " -rotate-90")
                        }
                    />
                </button>

                {membersOpen && (
                <>
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
                    placeholder="이름으로 검색"
                />

                <AnimatedList
                    className="space-y-2"
                >
                    {filteredMembers.map((m) => (
                        <AnimatedItem
                            key={m.id}
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
                                    {/* 아바타 */}
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
                                                  m.first_name
                                                  || ""
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
                                <button
                                    type="button"
                                    onClick={() => {
                                        haptic.light();
                                        setActionTarget(
                                            m
                                        );
                                        setActionType(
                                            "promote"
                                        );
                                    }}
                                    aria-label="운영진으로 등록"
                                    className={
                                        "w-8 h-8"
                                        + " rounded-full"
                                        + " flex"
                                        + " items-center"
                                        + " justify-center"
                                        + " bg-rh-accent"
                                        + " text-white"
                                        + " active:opacity-80"
                                        + " transition-opacity"
                                    }
                                >
                                    <Plus
                                        className="w-4 h-4"
                                    />
                                </button>
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
                </>
                )}
            </div>

            {/* 권한 변경 확인 다이얼로그 */}
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
