"use client";
import { memo } from "react";
import { Check } from "lucide-react";

interface AdminCheckboxProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: number;
}

const AdminCheckbox = memo(function AdminCheckbox({
    checked,
    onCheckedChange,
    disabled = false,
    size = 20,
}: AdminCheckboxProps) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={`flex items-center justify-center rounded-[6px] border transition-colors ${
                checked
                    ? "bg-rh-accent border-rh-accent"
                    : "bg-transparent border-rh-border"
            } ${disabled ? "opacity-40" : ""}`}
            style={{ width: size, height: size }}
        >
            {checked && (
                <Check
                    size={size - 6}
                    strokeWidth={3}
                    className="text-white"
                />
            )}
        </button>
    );
});

export default AdminCheckbox;
