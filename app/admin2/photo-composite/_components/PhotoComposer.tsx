"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhotoUploadStep from "./PhotoUploadStep";
import LogoSourcePicker from "./LogoSourcePicker";
import PresetPanel from "./PresetPanel";
import FreePanel from "./FreePanel";
import KonvaStage from "./KonvaStage";
import SaveButton from "./SaveButton";
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
    const [freeTransform, setFreeTransform] = useState<LogoTransform | null>(
        null,
    );
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

    const presetTransform = useMemo<LogoTransform | null>(() => {
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

    const activeTransform =
        mode === "free" && freeTransform
            ? { ...freeTransform, opacity }
            : presetTransform;

    const enterFreeMode = useCallback(() => {
        if (presetTransform) setFreeTransform(presetTransform);
        setMode("free");
    }, [presetTransform]);

    const exitToPreset = useCallback(() => {
        setFreeTransform(null);
        setMode("preset");
    }, []);

    const resetToPreset = useCallback(() => {
        if (presetTransform) setFreeTransform(presetTransform);
    }, [presetTransform]);

    const handleFreeChange = useCallback((next: LogoTransform) => {
        setFreeTransform(next);
    }, []);

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
                        transform={activeTransform}
                        containerWidth={containerWidth}
                        selectable={mode === "free"}
                        onTransformChange={handleFreeChange}
                    />
                )}
            </div>
            <SaveButton
                photoBitmap={photoBitmap}
                logoBitmap={logoBitmap}
                transform={activeTransform}
                crewName={crewName}
            />
            {mode === "preset" ? (
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
                    onEnterFreeMode={enterFreeMode}
                />
            ) : (
                <FreePanel
                    opacity={opacity}
                    onOpacityChange={setOpacity}
                    onReset={resetToPreset}
                    onBackToPreset={exitToPreset}
                />
            )}
        </div>
    );
}
