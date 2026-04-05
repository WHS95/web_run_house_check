"use client";
import { memo, useCallback } from "react";

interface Option {
    value: string;
    label: string;
    badge?: number;
}

interface AdminSegmentedControlProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}

const AdminSegmentedControl = memo(function AdminSegmentedControl({
    options,
    value,
    onChange,
}: AdminSegmentedControlProps) {
    return (
        <div className="flex p-1 rounded-xl bg-rh-bg-surface border border-rh-border">
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <SegmentButton
                        key={opt.value}
                        option={opt}
                        active={active}
                        onSelect={onChange}
                    />
                );
            })}
        </div>
    );
});

interface SegmentButtonProps {
    option: Option;
    active: boolean;
    onSelect: (value: string) => void;
}

const SegmentButton = memo(function SegmentButton({
    option,
    active,
    onSelect,
}: SegmentButtonProps) {
    const handleClick = useCallback(() => {
        onSelect(option.value);
    }, [onSelect, option.value]);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-colors ${
                active
                    ? "bg-rh-accent text-white"
                    : "text-rh-text-secondary"
            }`}
        >
            <span>{option.label}</span>
            {typeof option.badge === "number" && (
                <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                        active
                            ? "bg-white/25 text-white"
                            : "bg-rh-bg-muted text-rh-text-secondary"
                    }`}
                >
                    {option.badge}
                </span>
            )}
        </button>
    );
});

export default AdminSegmentedControl;
