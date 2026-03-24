"use client";
import { memo } from "react";
import { ChevronDown } from "lucide-react";

interface AdminSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    label?: string;
}

const AdminSelect = memo(function AdminSelect({
    value,
    onChange,
    options,
    placeholder = "선택해주세요",
    label,
}: AdminSelectProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-xs font-medium text-rh-text-secondary">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-12 px-4 pr-10 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white appearance-none outline-none focus:border-rh-accent transition-colors"
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-rh-text-muted pointer-events-none"
                />
            </div>
        </div>
    );
});

export default AdminSelect;
