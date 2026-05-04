"use client";

import { useEffect, useRef, useState } from "react";
import { 로고업로드_검증 } from "@/lib/domain/photo-composite/validators";
import { loadImageFromUrl } from "../_lib/loadImage";
import type { LogoSource } from "@/lib/domain/photo-composite/types";

interface Props {
    crewLogoUrl: string | null;
    onSelected: (source: LogoSource, bitmap: ImageBitmap) => void;
}

export default function LogoSourcePicker({ crewLogoUrl, onSelected }: Props) {
    const [mode, setMode] = useState<"crew" | "upload">(
        crewLogoUrl ? "crew" : "upload",
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (mode !== "crew" || !crewLogoUrl) return;
        let cancelled = false;
        setBusy(true);
        setError(null);
        loadImageFromUrl(crewLogoUrl)
            .then((bitmap) => {
                if (cancelled) {
                    bitmap.close();
                    return;
                }
                onSelected({ kind: "crew", url: crewLogoUrl }, bitmap);
            })
            .catch(() => {
                if (!cancelled) setError("크루 로고를 불러올 수 없어요.");
            })
            .finally(() => {
                if (!cancelled) setBusy(false);
            });
        return () => {
            cancelled = true;
        };
    }, [mode, crewLogoUrl, onSelected]);

    async function handleFile(file: File) {
        setError(null);
        const v = 로고업로드_검증(file);
        if (!v.ok) {
            setError(v.reason);
            return;
        }
        setBusy(true);
        try {
            const objectUrl = URL.createObjectURL(file);
            const bitmap = await createImageBitmap(file);
            onSelected({ kind: "upload", objectUrl }, bitmap);
        } catch {
            setError("로고를 불러올 수 없어요.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className='space-y-2'>
            <div className='flex gap-2'>
                <button
                    type='button'
                    disabled={!crewLogoUrl}
                    onClick={() => setMode("crew")}
                    className={`flex-1 h-10 rounded-lg text-sm ${
                        mode === "crew"
                            ? "bg-rh-accent text-white"
                            : "bg-rh-bg-surface text-rh-text-secondary"
                    } disabled:opacity-40`}
                >
                    크루 로고
                </button>
                <button
                    type='button'
                    onClick={() => {
                        setMode("upload");
                        inputRef.current?.click();
                    }}
                    className={`flex-1 h-10 rounded-lg text-sm ${
                        mode === "upload"
                            ? "bg-rh-accent text-white"
                            : "bg-rh-bg-surface text-rh-text-secondary"
                    }`}
                >
                    PNG 업로드
                </button>
            </div>
            <input
                ref={inputRef}
                type='file'
                accept='image/png'
                className='hidden'
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
            {busy && (
                <p className='text-rh-text-tertiary text-xs'>
                    로고 불러오는 중…
                </p>
            )}
            {error && (
                <p className='text-rh-status-error text-xs'>{error}</p>
            )}
        </div>
    );
}
