"use client";

import { useCallback } from "react";

interface RadiusSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

const PRESETS = [30, 50, 100, 200, 500];

export default function RadiusSlider({
    value,
    onChange,
    min = 30,
    max = 500,
    step = 10,
}: RadiusSliderProps) {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(Number(e.target.value));
        },
        [onChange]
    );

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-rh-caption text-rh-text-secondary">
                    허용 반경
                </label>
                <span className="text-rh-body font-semibold text-rh-accent">
                    {value}m
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, #669FF2 0%, #669FF2 ${percentage}%, #4C525E ${percentage}%, #4C525E 100%)`,
                }}
            />
            <div className="flex justify-between gap-1">
                {PRESETS.map((preset) => (
                    <button
                        key={preset}
                        type="button"
                        onClick={() => onChange(preset)}
                        className={`px-2 py-1 rounded-rh-sm text-rh-small ${
                            value === preset
                                ? "bg-rh-accent text-white"
                                : "bg-rh-bg-muted/30 text-rh-text-tertiary"
                        }`}
                    >
                        {preset}m
                    </button>
                ))}
            </div>
        </div>
    );
}
