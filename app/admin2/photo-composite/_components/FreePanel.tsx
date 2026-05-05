"use client";

interface Props {
    opacity: number;
    onOpacityChange: (v: number) => void;
    onReset: () => void;
    onBackToPreset: () => void;
}

export default function FreePanel({
    opacity,
    onOpacityChange,
    onReset,
    onBackToPreset,
}: Props) {
    return (
        <div className='space-y-3 p-3 rounded-xl bg-rh-bg-surface'>
            <p className='text-xs text-rh-text-tertiary'>
                로고를 드래그·핀치(크기/회전)로 직접 조정하세요.
            </p>
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
                    onChange={(e) => onOpacityChange(Number(e.target.value))}
                    className='w-full accent-rh-accent'
                />
            </div>
            <div className='flex gap-2'>
                <button
                    type='button'
                    onClick={onReset}
                    className='flex-1 h-10 rounded-md bg-rh-bg-muted text-rh-text-secondary text-sm'
                >
                    원위치 리셋
                </button>
                <button
                    type='button'
                    onClick={onBackToPreset}
                    className='flex-1 h-10 rounded-md bg-rh-bg-muted text-rh-text-secondary text-sm'
                >
                    프리셋으로 복귀
                </button>
            </div>
        </div>
    );
}
