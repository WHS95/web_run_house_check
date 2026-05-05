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

    // 정리 책임을 단일 owner로: 교체 시점은 setter 콜백에서, 언마운트 시점은
    // 아래 unmount-only effect에서 ref를 통해 처리. deps-driven cleanup과
    // setter 콜백이 동시에 close()를 호출해 이중 close가 발생하던 버그를 차단.
    const photoBitmapRef = useRef<ImageBitmap | null>(null);
    const logoBitmapRef = useRef<ImageBitmap | null>(null);
    const logoSourceRef = useRef<LogoSource | null>(null);
    useEffect(() => {
        photoBitmapRef.current = photoBitmap;
    }, [photoBitmap]);
    useEffect(() => {
        logoBitmapRef.current = logoBitmap;
    }, [logoBitmap]);
    useEffect(() => {
        logoSourceRef.current = logoSource;
    }, [logoSource]);

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

    // unmount 단일 cleanup (deps 빈 배열). 교체 시 정리는 setter 콜백 책임.
    useEffect(() => {
        return () => {
            photoBitmapRef.current?.close();
            logoBitmapRef.current?.close();
            const src = logoSourceRef.current;
            if (src?.kind === "upload") {
                URL.revokeObjectURL(src.objectUrl);
            }
        };
    }, []);

    const handleLogoSelected = useCallback(
        (source: LogoSource, bitmap: ImageBitmap) => {
            setLogoBitmap((prev) => {
                if (prev && prev !== bitmap) prev.close();
                return bitmap;
            });
            setLogoSource((prev) => {
                if (prev?.kind === "upload" && prev !== source) {
                    URL.revokeObjectURL(prev.objectUrl);
                }
                return source;
            });
        },
        [],
    );

    const handlePhotoLoaded = useCallback((bitmap: ImageBitmap) => {
        setPhotoBitmap((prev) => {
            if (prev && prev !== bitmap) prev.close();
            return bitmap;
        });
    }, []);

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
        return <PhotoUploadStep onLoaded={handlePhotoLoaded} />;
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
