"use client";
import { memo, forwardRef } from "react";
import { Check } from "lucide-react";

interface AdminLabeledInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    helperText?: string;
    type?: string;
    saved?: boolean;
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
                saved = false,
            },
            ref,
        ) {
            return (
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-rh-text-secondary">
                        {label}
                    </label>
                    <div className="relative">
                        <input
                            ref={ref}
                            type={type}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className={`w-full h-12 px-4 ${saved ? "pr-10" : ""} rounded-lg bg-rh-bg-surface border text-sm text-white placeholder:text-rh-text-muted outline-none transition-colors ${
                                saved
                                    ? "border-rh-accent/40 focus:border-rh-accent"
                                    : "border-rh-border focus:border-rh-accent"
                            }`}
                        />
                        <div
                            className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${
                                saved ? "opacity-100 scale-100" : "opacity-0 scale-75"
                            }`}
                        >
                            <Check size={15} style={{ color: "var(--rh-accent)" }} strokeWidth={2.5} />
                        </div>
                    </div>
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
