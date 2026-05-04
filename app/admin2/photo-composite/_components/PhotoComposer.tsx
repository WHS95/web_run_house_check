"use client";

import { useCallback, useEffect, useState } from "react";
import PhotoUploadStep from "./PhotoUploadStep";
import LogoSourcePicker from "./LogoSourcePicker";
import type { LogoSource } from "@/lib/domain/photo-composite/types";

interface Props {
    crewName: string;
    crewLogoUrl: string | null;
}

export default function PhotoComposer({ crewName, crewLogoUrl }: Props) {
    const [photoBitmap, setPhotoBitmap] = useState<ImageBitmap | null>(null);
    const [logoBitmap, setLogoBitmap] = useState<ImageBitmap | null>(null);
    const [logoSource, setLogoSource] = useState<LogoSource | null>(null);

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
            <div className='aspect-video rounded-xl bg-rh-bg-surface flex items-center justify-center text-rh-text-tertiary text-xs'>
                {logoBitmap
                    ? `로고 로드 완료 (${logoBitmap.width}×${logoBitmap.height})`
                    : "로고를 선택해주세요"}
            </div>
        </div>
    );
}
