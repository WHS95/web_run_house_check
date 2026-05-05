"use client";

import { useRef, useState } from "react";
import { 사진업로드_검증 } from "@/lib/domain/photo-composite/validators";
import { loadAndDownscale } from "../_lib/loadImage";

interface Props {
    onLoaded: (bitmap: ImageBitmap) => void;
}

const EDIT_LONG_EDGE = 1600;

export default function PhotoUploadStep({ onLoaded }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function handleFile(file: File) {
        setError(null);
        const v = 사진업로드_검증(file);
        if (!v.ok) {
            setError(v.reason);
            return;
        }
        setBusy(true);
        try {
            const bitmap = await loadAndDownscale(file, EDIT_LONG_EDGE);
            onLoaded(bitmap);
        } catch {
            setError("사진을 불러올 수 없어요. 다른 파일을 시도해주세요.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className='flex-1 flex flex-col items-center justify-center px-4 gap-4'>
            <button
                type='button'
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className='w-full max-w-xs h-32 rounded-xl bg-rh-bg-surface border-2 border-dashed border-rh-border text-rh-text-secondary text-sm disabled:opacity-50'
            >
                {busy ? "불러오는 중…" : "단체 사진 선택"}
            </button>
            <input
                ref={inputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp'
                capture='environment'
                className='hidden'
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
            {error && (
                <p className='text-rh-status-error text-sm text-center'>
                    {error}
                </p>
            )}
        </div>
    );
}
