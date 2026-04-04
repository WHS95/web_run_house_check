"use client";

import {
    memo,
    useState,
    useCallback,
    useMemo,
} from "react";
import FadeIn
    from "@/components/atoms/FadeIn";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import {
    AdminBadge,
} from "@/app/admin2/components/ui";
import AdminProgressBar
    from "@/app/admin2/components/ui/AdminProgressBar";
import AdminFilterPill
    from "@/app/admin2/components/ui/AdminFilterPill";

/* ── 타입 ── */
interface MemberData {
    userId: string;
    name: string;
    attendCount: number;
    hostCount: number;
    attendanceRate: number;
    isActive: boolean;
}

interface Props {
    year: number;
    month: number;
    totalMembers: number;
    attendedCount: number;
    absentCount: number;
    members: MemberData[];
}

type Filter = "전체" | "참여" | "미참여";

/* ── 멤버 카드 ── */
const MemberCard = memo(function MemberCard({
    member,
}: {
    member: MemberData;
}) {
    return (
        <div
            className={
                "bg-rh-bg-surface rounded-xl"
                + " px-3.5 py-3 flex items-center"
                + " gap-3"
                + (member.isActive
                    ? ""
                    : " opacity-50")
            }
        >
            {/* 아바타 */}
            <div
                className={
                    "w-9 h-9 rounded-full"
                    + " flex items-center"
                    + " justify-center"
                    + " text-white text-xs"
                    + " font-semibold shrink-0"
                    + (member.isActive
                        ? " bg-rh-accent"
                        : " bg-rh-bg-muted")
                }
            >
                {member.name.charAt(0)}
            </div>

            {/* 정보 */}
            <div className="flex-1 space-y-1.5">
                {/* 상단: 이름 + 통계/뱃지 */}
                <div
                    className={
                        "flex items-center"
                        + " justify-between"
                    }
                >
                    <span
                        className={
                            "font-semibold"
                            + (member.isActive
                                ? " text-white"
                                : " text-rh-text-secondary")
                        }
                        style={{ fontSize: 13 }}
                    >
                        {member.name}
                    </span>
                    {member.isActive ? (
                        <span
                            className={
                                "text-rh-accent"
                            }
                            style={{ fontSize: 11 }}
                        >
                            {member.attendCount}회
                            {" · "}
                            개설 {member.hostCount}회
                        </span>
                    ) : (
                        <AdminBadge
                            variant="muted"
                        >
                            미참여
                        </AdminBadge>
                    )}
                </div>

                {/* 프로그레스 바 */}
                <AdminProgressBar
                    percent={
                        member.isActive
                            ? member.attendanceRate
                            : 0
                    }
                />

                {/* 출석률 */}
                <div
                    className={
                        "flex items-center"
                        + " justify-between"
                    }
                >
                    <span
                        className={
                            "text-rh-text-muted"
                        }
                        style={{ fontSize: 10 }}
                    >
                        출석률
                    </span>
                    <span
                        className={
                            "font-semibold"
                            + (member.isActive
                                ? " text-rh-accent"
                                : " text-rh-text-muted")
                        }
                        style={{ fontSize: 10 }}
                    >
                        {Math.round(
                            member.attendanceRate,
                        )}
                        %
                    </span>
                </div>
            </div>
        </div>
    );
});

/* ── 메인 클라이언트 컴포넌트 ── */
export default function OverallDetailClient({
    year,
    month,
    totalMembers,
    attendedCount,
    absentCount,
    members,
}: Props) {
    const [filter, setFilter] =
        useState<Filter>("전체");

    const handleFilter = useCallback(
        (f: Filter) => setFilter(f),
        [],
    );

    const filteredMembers = useMemo(() => {
        if (filter === "참여") {
            return members.filter(
                (m) => m.isActive,
            );
        }
        if (filter === "미참여") {
            return members.filter(
                (m) => !m.isActive,
            );
        }
        return members;
    }, [members, filter]);

    return (
        <FadeIn>
            <div className="space-y-4">
                {/* 월 라벨 */}
                <div
                    className={
                        "flex items-center"
                        + " justify-center h-8"
                    }
                >
                    <span
                        className={
                            "text-sm font-semibold"
                            + " text-rh-text-secondary"
                        }
                    >
                        {year}년 {month}월
                    </span>
                </div>

                {/* 요약 카드 */}
                <div
                    className={
                        "bg-rh-bg-surface"
                        + " rounded-xl p-3.5"
                        + " grid grid-cols-3"
                        + " text-center"
                    }
                >
                    <div>
                        <p
                            className={
                                "text-rh-text-secondary"
                            }
                            style={{ fontSize: 11 }}
                        >
                            전체 인원
                        </p>
                        <p
                            className={
                                "text-white"
                                + " font-bold mt-0.5"
                            }
                            style={{ fontSize: 15 }}
                        >
                            {totalMembers}명
                        </p>
                    </div>
                    <div>
                        <p
                            className={
                                "text-rh-text-secondary"
                            }
                            style={{ fontSize: 11 }}
                        >
                            참여 인원
                        </p>
                        <p
                            className={
                                "text-rh-accent"
                                + " font-bold mt-0.5"
                            }
                            style={{ fontSize: 15 }}
                        >
                            {attendedCount}명
                        </p>
                    </div>
                    <div>
                        <p
                            className={
                                "text-rh-text-secondary"
                            }
                            style={{ fontSize: 11 }}
                        >
                            미참여
                        </p>
                        <p
                            className={
                                "text-rh-text-secondary"
                                + " font-bold mt-0.5"
                            }
                            style={{ fontSize: 15 }}
                        >
                            {absentCount}명
                        </p>
                    </div>
                </div>

                {/* 필터 */}
                <div className="flex gap-2">
                    {(
                        [
                            "전체",
                            "참여",
                            "미참여",
                        ] as const
                    ).map((f) => (
                        <AdminFilterPill
                            key={f}
                            label={f}
                            active={filter === f}
                            onClick={() =>
                                handleFilter(f)
                            }
                        />
                    ))}
                </div>

                {/* 멤버 리스트 */}
                {filteredMembers.length > 0 ? (
                    <AnimatedList
                        className="space-y-2"
                    >
                        {filteredMembers.map(
                            (m) => (
                                <AnimatedItem
                                    key={m.userId}
                                >
                                    <MemberCard
                                        member={m}
                                    />
                                </AnimatedItem>
                            ),
                        )}
                    </AnimatedList>
                ) : (
                    <div
                        className={
                            "text-center py-10"
                            + " text-rh-text-tertiary"
                            + " text-sm"
                        }
                    >
                        해당 조건의 멤버가
                        없습니다.
                    </div>
                )}
            </div>
        </FadeIn>
    );
}
