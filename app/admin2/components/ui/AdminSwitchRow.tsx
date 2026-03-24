"use client";
import { memo } from "react";
import { Switch } from "@/components/ui/switch";

interface AdminSwitchRowProps {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

const AdminSwitchRow = memo(function AdminSwitchRow({
    label,
    checked,
    onCheckedChange,
}: AdminSwitchRowProps) {
    return (
        <div className="flex items-center justify-between h-[52px] px-4 rounded-xl bg-rh-bg-surface">
            <span className="text-sm font-medium text-white">
                {label}
            </span>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
            />
        </div>
    );
});

export default AdminSwitchRow;
