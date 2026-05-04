"use client";

import { useEffect, useState } from "react";
import PhotoUploadStep from "./PhotoUploadStep";

interface Props {
    crewName: string;
    crewLogoUrl: string | null;
}

export default function PhotoComposer({ crewName, crewLogoUrl }: Props) {
    const [photoBitmap, setPhotoBitmap] = useState<ImageBitmap | null>(null);

    useEffect(() => {
        return () => {
            photoBitmap?.close();
        };
    }, [photoBitmap]);

    if (!photoBitmap) {
        return <PhotoUploadStep onLoaded={setPhotoBitmap} />;
    }

    return (
        <div className='flex-1 px-4 pt-4 pb-4 space-y-3'>
            <div className='text-rh-text-secondary text-sm'>
                {crewName} · 사진 {photoBitmap.width}×{photoBitmap.height}
                {crewLogoUrl ? " · 로고 있음" : " · 로고 없음"}
            </div>
            <div className='aspect-video rounded-xl bg-rh-bg-surface flex items-center justify-center text-rh-text-tertiary text-sm'>
                다음 Task에서 합성 캔버스 진입
            </div>
            <button
                type='button'
                onClick={() => {
                    photoBitmap.close();
                    setPhotoBitmap(null);
                }}
                className='w-full h-12 rounded-lg bg-rh-bg-surface text-rh-text-primary'
            >
                다른 사진 선택
            </button>
        </div>
    );
}
