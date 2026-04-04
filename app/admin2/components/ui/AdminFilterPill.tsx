"use client";
import { memo } from "react";

interface AdminFilterPillProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

const AdminFilterPill = memo(
    function AdminFilterPill({
        label,
        active,
        onClick,
    }: AdminFilterPillProps) {
        return (
            <button
                onClick={onClick}
                className={
                    "rounded-full px-3.5 py-1.5"
                    + " text-xs transition-colors"
                    + ` ${
                        active
                            ? "bg-rh-accent text-white"
                              + " font-semibold"
                            : "bg-rh-bg-surface"
                              + " text-rh-text-tertiary"
                    }`
                }
            >
                {label}
            </button>
        );
    },
);

export default AdminFilterPill;
