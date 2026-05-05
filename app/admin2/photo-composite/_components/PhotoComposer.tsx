"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhotoUploadStep from "./PhotoUploadStep";
import LogoSourcePicker from "./LogoSourcePicker";
import PresetPanel from "./PresetPanel";
import KonvaStage from "./KonvaStage";
import { 프리셋좌표산출 } from "@/lib/domain/photo-composite/presets";
import type {
    LogoSource,
    LogoTransform,
    PresetPosition,
    PresetSize,
} from "@/lib/domain/photo-composite/types";

interface Props {
    crewName: string;
    crewLogoUrl: string | null;
}

export default function PhotoComposer({ crewName, crewLogoUrl }: Props) {
    const [photoBitmap, setPhotoBitmap] = useState<ImageBitmap | null>(null);
    const [logoBitmap, setLogoBitmap] = useState<ImageBitmap | null>(null);
    const [logoSource, setLogoSource] = useState<LogoSource | null>(null);

    const [mode, setMode] = useState<"preset" | "free">("preset");
    const [presetPosition, setPresetPosition] =
        useState<PresetPosition>("bottom-right");
    const [presetSize, setPresetSize] = useState<PresetSize>("M");
    const [opacity, setOpacity] = useState(1);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                setContainerWidth(e.contentRect.width);
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [photoBitmap]);

    useEffect(() => {
        return () => {
            photoBitmap?.close();
            logoBitmap?.close();
            if (logoSource?.kind === "upload") {
                URL.revokeObjectURL(logoSource.objectUrl);
            }
        };
    }, [photoBitmap, logoBitmap, logoSource]);

    const handleLogoSelected = useCallback(
        (source: LogoSource, bitmap: ImageBitmap) => {
            setLogoBitmap((prev) => {
                prev?.close();
                return bitmap;
            });
            setLogoSource((prev) => {
                if (prev?.kind === "upload") {
                    URL.revokeObjectURL(prev.objectUrl);
                }
                return source;
            });
        },
        [],
    );

    const transform = useMemo<LogoTransform | null>(() => {
        if (!photoBitmap || !logoBitmap) return null;
        const aspectRatio = logoBitmap.width / logoBitmap.height;
        const t = 프리셋좌표산출(
            presetPosition,
            presetSize,
            { width: photoBitmap.width, height: photoBitmap.height },
            aspectRatio,
        );
        return { ...t, opacity };
    }, [photoBitmap, logoBitmap, presetPosition, presetSize, opacity]);

    if (!photoBitmap) {
        return <PhotoUploadStep onLoaded={setPhotoBitmap} />;
    }

    return (
        <div className='flex-1 px-4 pt-4 pb-4 space-y-3 overflow-y-auto'>
            <div className='text-rh-text-secondary text-xs'>
                {crewName} · {photoBitmap.width}×{photoBitmap.height}
            </div>
            <LogoSourcePicker
                crewLogoUrl={crewLogoUrl}
                onSelected={handleLogoSelected}
            />
            <div
                ref={containerRef}
                className='rounded-xl overflow-hidden bg-black'
            >
                {containerWidth > 0 && (
                    <KonvaStage
                        photoBitmap={photoBitmap}
                        logoBitmap={logoBitmap}
                        transform={transform}
                        containerWidth={containerWidth}
                    />
                )}
            </div>
            {mode === "preset" && (
                <PresetPanel
                    position={presetPosition}
                    size={presetSize}
                    opacity={opacity}
                    onChange={(next) => {
                        if (next.position) setPresetPosition(next.position);
                        if (next.size) setPresetSize(next.size);
                        if (next.opacity !== undefined)
                            setOpacity(next.opacity);
                    }}
                    onEnterFreeMode={() => setMode("free")}
                />
            )}
            {mode === "free" && (
                <div className='p-3 rounded-xl bg-rh-bg-surface text-rh-text-tertiary text-xs'>
                    자유 배치 모드는 다음 Task에서 활성화됩니다.
                    <button
                        type='button'
                        onClick={() => setMode("preset")}
                        className='mt-2 w-full h-9 rounded bg-rh-bg-muted'
                    >
                        프리셋으로 복귀
                    </button>
                </div>
            )}
        </div>
    );
}
