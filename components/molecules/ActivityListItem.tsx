"use client";

import React from "react";

interface ActivityListItemProps {
    name: string;
    meta: string;
    badgeText?: string;
}

const ActivityListItem: React.FC<ActivityListItemProps> = ({
    name,
    meta,
    badgeText = "출석완료",
}) => (
    <div className="flex items-center gap-3 rounded-rh-md bg-rh-bg-surface px-4 py-3">
        {/* 상태 점 */}
        <div className="h-2 w-2 shrink-0 rounded-full bg-rh-accent/70" />

        {/* 이름 + 메타 */}
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-xs text-rh-text-tertiary truncate">
                {meta}
            </p>
        </div>

        {/* 배지 */}
        <span className="shrink-0 rounded-full bg-rh-accent/20 px-2.5 py-1 text-[11px] font-medium text-rh-accent">
            {badgeText}
        </span>
    </div>
);

export default ActivityListItem;
