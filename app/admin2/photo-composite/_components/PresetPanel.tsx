"use client";

import type {
    PresetPosition,
    PresetSize,
} from "@/lib/domain/photo-composite/types";

const POSITIONS: { value: PresetPosition; label: string }[] = [
    { value: "top-left", label: "↖" },
    { value: "top-right", label: "↗" },
    { value: "center", label: "◯" },
    { value: "bottom-left", label: "↙" },
    { value: "bottom-right", label: "↘" },
];

const SIZES: PresetSize[] = ["S", "M", "L"];

interface Props {
    position: PresetPosition;
    size: PresetSize;
    opacity: number;
    onChange: (next: {
        position?: PresetPosition;
        size?: PresetSize;
        opacity?: number;
    }) => void;
    onEnterFreeMode: () => void;
}

export default function PresetPanel({
    position,
    size,
    opacity,
    onChange,
    onEnterFreeMode,
}: Props) {
    return (
        <div className='space-y-3 p-3 rounded-xl bg-rh-bg-surface'>
            <div>
                <p className='text-xs text-rh-text-tertiary mb-1.5'>위치</p>
                <div className='grid grid-cols-5 gap-1.5'>
                    {POSITIONS.map((p) => (
                        <button
                            key={p.value}
                            type='button'
                            onClick={() => onChange({ position: p.value })}
                            className={`h-10 rounded-md text-base ${
                                position === p.value
                                    ? "bg-rh-accent text-white"
                                    : "bg-rh-bg-muted text-rh-text-secondary"
                            }`}
                            aria-label={p.value}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className='text-xs text-rh-text-tertiary mb-1.5'>크기</p>
                <div className='grid grid-cols-3 gap-1.5'>
                    {SIZES.map((s) => (
                        <button
                            key={s}
                            type='button'
                            onClick={() => onChange({ size: s })}
                            className={`h-10 rounded-md text-sm ${
                                size === s
                                    ? "bg-rh-accent text-white"
                                    : "bg-rh-bg-muted text-rh-text-secondary"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className='text-xs text-rh-text-tertiary mb-1.5'>
                    투명도 {Math.round(opacity * 100)}%
                </p>
                <input
                    type='range'
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) =>
                        onChange({ opacity: Number(e.target.value) })
                    }
                    className='w-full accent-rh-accent'
                />
            </div>
            <button
                type='button'
                onClick={onEnterFreeMode}
                className='w-full h-10 rounded-md bg-rh-bg-muted text-rh-text-primary text-sm'
            >
                직접 조정
            </button>
        </div>
    );
}
