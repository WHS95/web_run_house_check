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
