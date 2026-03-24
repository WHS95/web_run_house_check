"use client";
import { memo, forwardRef } from "react";

interface AdminLabeledInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    helperText?: string;
    type?: string;
}

const AdminLabeledInput = memo(
    forwardRef<HTMLInputElement, AdminLabeledInputProps>(
        function AdminLabeledInput(
            {
                label,
                value,
                onChange,
                placeholder,
                helperText,
                type = "text",
            },
            ref,
        ) {
            return (
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-rh-text-secondary">
                        {label}
                    </label>
                    <input
                        ref={ref}
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="h-12 px-4 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white placeholder:text-rh-text-muted outline-none focus:border-rh-accent transition-colors"
                    />
                    {helperText && (
                        <span className="text-[11px] text-rh-text-tertiary">
                            {helperText}
                        </span>
                    )}
                </div>
            );
        },
    ),
);

export default AdminLabeledInput;
