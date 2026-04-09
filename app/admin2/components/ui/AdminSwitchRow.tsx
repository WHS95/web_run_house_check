"use client";
import { memo } from "react";
import { Switch } from "@/components/ui/switch";

interface AdminSwitchRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

const AdminSwitchRow = memo(function AdminSwitchRow({
    label,
    description,
    checked,
    onCheckedChange,
}: AdminSwitchRowProps) {
    return (
        <div
            className={
                "flex items-center"
                + " justify-between"
                + " min-h-[52px] px-4 py-3"
                + " rounded-xl bg-rh-bg-surface"
            }
        >
            <div className="min-w-0 flex-1 mr-3">
                <span
                    className={
                        "text-sm font-medium"
                        + " text-white"
                    }
                >
                    {label}
                </span>
                {description && (
                    <p
                        className={
                            "text-xs"
                            + " text-rh-text-secondary"
                            + " mt-0.5"
                        }
                    >
                        {description}
                    </p>
                )}
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
            />
        </div>
    );
});

export default AdminSwitchRow;
