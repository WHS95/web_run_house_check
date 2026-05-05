import { 다운스케일치수계산 } from "@/lib/domain/photo-composite/transforms";
import type { LogoTransform } from "@/lib/domain/photo-composite/types";

interface ExportInput {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap;
    transform: LogoTransform;
    /** 출력 long-edge px (예: 2560) */
    outputLongEdge: number;
}

/**
 * 편집 좌표계의 transform을 출력 캔버스 좌표계로 스케일하고
 * JPEG q0.92로 export.
 */
export async function exportComposite({
    photoBitmap,
    logoBitmap,
    transform,
    outputLongEdge,
}: ExportInput): Promise<Blob> {
    const out = 다운스케일치수계산(
        { width: photoBitmap.width, height: photoBitmap.height },
        outputLongEdge,
    );
    const ratio = out.width / photoBitmap.width;

    const canvas = document.createElement("canvas");
    canvas.width = out.width;
    canvas.height = out.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // 1) 사진 그리기
    ctx.drawImage(photoBitmap, 0, 0, out.width, out.height);

    // 2) 로고 그리기 (회전·투명도 포함)
    const logoAspect = logoBitmap.width / logoBitmap.height;
    const lw = transform.width * ratio;
    const lh = (transform.width / logoAspect) * ratio;
    const lx = transform.x * ratio;
    const ly = transform.y * ratio;

    ctx.save();
    ctx.globalAlpha = transform.opacity;
    // 회전축은 로고 중심
    ctx.translate(lx + lw / 2, ly + lh / 2);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.drawImage(logoBitmap, -lw / 2, -lh / 2, lw, lh);
    ctx.restore();

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("toBlob 실패"));
            },
            "image/jpeg",
            0.92,
        );
    });
}

/**
 * 다운로드/공유 폴백.
 * Web Share API 가능하면 공유 시트, 아니면 a[download]로 강제 저장.
 */
export async function downloadOrShare(
    blob: Blob,
    filename: string,
): Promise<void> {
    const file = new File([blob], filename, { type: blob.type });

    if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] })
    ) {
        try {
            await navigator.share({ files: [file] });
            return;
        } catch (err) {
            // user cancel은 무시
            if ((err as Error).name === "AbortError") return;
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
