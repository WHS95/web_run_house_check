"use client";

import {
    memo,
    useCallback,
    useDeferredValue,
    useMemo,
    useState,
} from "react";
import { Search } from "lucide-react";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import type {
    CrewActivityStatus,
    CrewListItem,
} from "@/lib/domain/master/types";
import CrewListRow from "./CrewListRow";

type FilterKey = "all" | CrewActivityStatus;

interface FilterChip {
    key: FilterKey;
    label: string;
}

const FILTERS: ReadonlyArray<FilterChip> = [
    { key: "all", label: "전체" },
    { key: "active", label: "활성" },
    { key: "idle", label: "정체" },
    { key: "dormant", label: "휴면" },
];

interface CrewListClientProps {
    items: CrewListItem[];
}

function CrewListClientImpl({ items }: CrewListClientProps) {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterKey>("all");
    const deferredQuery = useDeferredValue(query);

    const handleQueryChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
        },
        []
    );

    const handleFilterClick = useCallback((key: FilterKey) => {
        setFilter(key);
    }, []);

    const filtered = useMemo(() => {
        const trimmed = deferredQuery.trim().toLowerCase();
        const list = items.filter((c) => {
            if (filter !== "all" && c.activity_status !== filter) {
                return false;
            }
            if (!trimmed) return true;
            const name = c.name?.toLowerCase() ?? "";
            const region = c.region?.toLowerCase() ?? "";
            return name.includes(trimmed) || region.includes(trimmed);
        });

        // 정렬: 최근 출석 desc(없으면 epoch 0) → 동률이면 created_at desc
        return list.sort((a, b) => {
            const aTs = a.last_attendance_at
                ? new Date(a.last_attendance_at).getTime()
                : 0;
            const bTs = b.last_attendance_at
                ? new Date(b.last_attendance_at).getTime()
                : 0;
            if (bTs !== aTs) return bTs - aTs;
            const aCreated = a.created_at
                ? new Date(a.created_at).getTime()
                : 0;
            const bCreated = b.created_at
                ? new Date(b.created_at).getTime()
                : 0;
            return bCreated - aCreated;
        });
    }, [items, deferredQuery, filter]);

    return (
        <div className="space-y-3">
            {/* 검색 */}
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-rh-text-tertiary pointer-events-none"
                />
                <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="크루명 또는 지역 검색"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-rh-bg-surface text-[14px] text-white placeholder:text-rh-text-tertiary focus:outline-none focus:ring-1 focus:ring-rh-accent"
                />
            </div>

            {/* 필터 칩 */}
            <div className="flex items-center gap-2 overflow-x-auto">
                {FILTERS.map((f) => (
                    <FilterChipButton
                        key={f.key}
                        active={filter === f.key}
                        label={f.label}
                        filterKey={f.key}
                        onClick={handleFilterClick}
                    />
                ))}
            </div>

            {/* 결과 카운트 */}
            <p className="text-[12px] text-rh-text-tertiary">
                총 {filtered.length}개 크루
            </p>

            {/* 리스트 */}
            {filtered.length === 0 ? (
                <div className="flex items-center justify-center py-10 rounded-xl bg-rh-bg-surface">
                    <p className="text-sm text-rh-text-tertiary">
                        조건에 맞는 크루가 없습니다
                    </p>
                </div>
            ) : (
                <AnimatedList
                    className="space-y-2"
                    maxStaggerSec={1}
                >
                    {filtered.map((crew) => (
                        <AnimatedItem key={crew.id}>
                            <CrewListRow crew={crew} />
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            )}
        </div>
    );
}

const CrewListClient = memo(CrewListClientImpl);
export default CrewListClient;

interface FilterChipButtonProps {
    active: boolean;
    label: string;
    filterKey: FilterKey;
    onClick: (key: FilterKey) => void;
}

const FilterChipButton = memo(function FilterChipButton({
    active,
    label,
    filterKey,
    onClick,
}: FilterChipButtonProps) {
    const handleClick = useCallback(() => {
        onClick(filterKey);
    }, [filterKey, onClick]);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={
                "shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition-colors " +
                (active
                    ? "bg-rh-accent text-white"
                    : "bg-rh-bg-surface text-rh-text-secondary")
            }
        >
            {label}
        </button>
    );
});
