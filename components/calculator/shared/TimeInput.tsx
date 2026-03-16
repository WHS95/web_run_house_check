"use client";

import React from "react";

interface TimeInputProps {
    hours: string;
    minutes: string;
    seconds: string;
    onHoursChange: (value: string) => void;
    onMinutesChange: (value: string) => void;
    onSecondsChange: (value: string) => void;
    label?: string;
    /** 시간 필드 숨김 (페이스 입력 등 분:초만 필요할 때) */
    hideHours?: boolean;
}

export default function TimeInput({
    hours,
    minutes,
    seconds,
    onHoursChange,
    onMinutesChange,
    onSecondsChange,
    label,
    hideHours = false,
}: TimeInputProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>
                    {label}
                </span>
            )}
            <div className="flex items-center gap-2">
                {!hideHours && (
                    <>
                        <div className="flex flex-col items-center gap-1 flex-1">
                            <div
                                className="flex items-center justify-center w-full h-12 rounded-lg border"
                                style={{
                                    backgroundColor: "#2B3644",
                                    borderColor: "#374151",
                                }}
                            >
                                <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    value={hours}
                                    onChange={(e) => onHoursChange(e.target.value)}
                                    className="w-full text-center text-base font-semibold text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <span
                                className="text-[11px] font-medium"
                                style={{ color: "#64748B" }}
                            >
                                시
                            </span>
                        </div>
                        <span
                            className="text-xl font-semibold mb-5"
                            style={{ color: "#475569" }}
                        >
                            :
                        </span>
                    </>
                )}
                <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                        className="flex items-center justify-center w-full h-12 rounded-lg border"
                        style={{
                            backgroundColor: "#2B3644",
                            borderColor: "#374151",
                        }}
                    >
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutes}
                            onChange={(e) => onMinutesChange(e.target.value)}
                            className="w-full text-center text-base font-semibold text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <span
                        className="text-[11px] font-medium"
                        style={{ color: "#64748B" }}
                    >
                        분
                    </span>
                </div>
                <span
                    className="text-xl font-semibold mb-5"
                    style={{ color: "#475569" }}
                >
                    :
                </span>
                <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                        className="flex items-center justify-center w-full h-12 rounded-lg border"
                        style={{
                            backgroundColor: "#2B3644",
                            borderColor: "#374151",
                        }}
                    >
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={seconds}
                            onChange={(e) => onSecondsChange(e.target.value)}
                            className="w-full text-center text-base font-semibold text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <span
                        className="text-[11px] font-medium"
                        style={{ color: "#64748B" }}
                    >
                        초
                    </span>
                </div>
            </div>
        </div>
    );
}
