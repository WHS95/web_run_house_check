"use client";
import { memo, useCallback } from "react";
import { X } from "lucide-react";
import AdminAvatar from "./AdminAvatar";

interface AdminMemberChipProps {
    name: string;
    onRemove: () => void;
}

const AdminMemberChip = memo(function AdminMemberChip({
    name,
    onRemove,
}: AdminMemberChipProps) {
    const handleRemove = useCallback(() => {
        onRemove();
    }, [onRemove]);

    return (
        <div className="inline-flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-full bg-rh-bg-surface border border-rh-border">
            <AdminAvatar name={name} size={24} />
            <span className="text-xs font-medium text-white">
                {name}
            </span>
            <button
                type="button"
                onClick={handleRemove}
                className="flex items-center justify-center w-4 h-4 text-rh-text-tertiary hover:text-white transition-colors"
                aria-label={`${name} 제거`}
            >
                <X size={14} />
            </button>
        </div>
    );
});

export default AdminMemberChip;
