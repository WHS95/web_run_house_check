"use client";

import React from "react";

interface ChipOption {
    value: string;
    label: string;
}

interface ChipSelectorProps {
    options: ChipOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function ChipSelector({
    options,
    value,
    onChange,
    label,
}: ChipSelectorProps) {
    return (
        <div className="flex flex-col gap-2">
            {label && (
                <span className="text-sm font-semibold text-white">
                    {label}
                </span>
            )}
            <div className="flex gap-2">
                {options.map((option) => {
                    const isActive = option.value === value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className="flex-1 flex items-center justify-center h-10 rounded-lg text-[13px] transition-colors active:opacity-80"
                            style={
                                isActive
                                    ? {
                                          backgroundColor: "#669FF2",
                                          color: "#FFFFFF",
                                          fontWeight: 600,
                                      }
                                    : {
                                          backgroundColor: "#1D2530",
                                          color: "#94A3B8",
                                          fontWeight: 500,
                                          border: "1px solid #374151",
                                      }
                            }
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
