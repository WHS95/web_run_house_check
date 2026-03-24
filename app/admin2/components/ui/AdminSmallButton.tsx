"use client";
import { memo } from "react";

interface AdminSmallButtonProps {
    children: string;
    onClick?: () => void;
}

const AdminSmallButton = memo(function AdminSmallButton({
    children,
    onClick,
}: AdminSmallButtonProps) {
    return (
        <button
            className="h-8 px-3 rounded-lg bg-rh-accent text-xs font-semibold text-white"
            onClick={onClick}
        >
            {children}
        </button>
    );
});

export default AdminSmallButton;
