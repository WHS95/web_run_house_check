"use client";

import { useState } from "react";
import { exportComposite, downloadOrShare } from "../_lib/exportImage";
import type { LogoTransform } from "@/lib/domain/photo-composite/types";

interface Props {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap | null;
    transform: LogoTransform | null;
    crewName: string;
}

const OUTPUT_LONG_EDGE = 2560;

export default function SaveButton({
    photoBitmap,
    logoBitmap,
    transform,
    crewName,
}: Props) {
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const disabled = !logoBitmap || !transform || busy;

    async function handleSave() {
        if (!logoBitmap || !transform) return;
        setBusy(true);
        setToast(null);
        try {
            const blob = await exportComposite({
                photoBitmap,
                logoBitmap,
                transform,
                outputLongEdge: OUTPUT_LONG_EDGE,
            });
            const stamp = new Date()
                .toISOString()
                .slice(0, 10)
                .replaceAll("-", "");
            const safeName = (crewName || "crew").replace(/\s+/g, "-");
            await downloadOrShare(blob, `${safeName}-${stamp}.jpg`);
            setToast("이미지가 저장됐어요");
        } catch {
            setToast("저장에 실패했어요. 다시 시도해주세요.");
        } finally {
            setBusy(false);
            setTimeout(() => setToast(null), 2500);
        }
    }

    return (
        <div className='space-y-2'>
            <button
                type='button'
                onClick={handleSave}
                disabled={disabled}
                className='w-full h-12 rounded-lg bg-rh-accent text-white font-semibold disabled:opacity-50'
            >
                {busy ? "저장 중…" : "저장 / 공유"}
            </button>
            {toast && (
                <p className='text-center text-sm text-rh-text-secondary'>
                    {toast}
                </p>
            )}
        </div>
    );
}
