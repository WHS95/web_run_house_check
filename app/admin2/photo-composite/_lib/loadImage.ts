import { 다운스케일치수계산 } from "@/lib/domain/photo-composite/transforms";

/**
 * File → ImageBitmap 다운스케일.
 * EXIF 회전 자동 보정, long-edge 한도까지 축소.
 *
 * 도메인 함수(다운스케일치수계산)를 호출해 비율 계산만 위임받고,
 * 실제 디코딩/리사이즈는 브라우저 API에 위임.
 */
export async function loadAndDownscale(
    file: File,
    longEdgeLimit: number,
): Promise<ImageBitmap> {
    const original = await createImageBitmap(file, {
        imageOrientation: "from-image",
    });
    const { width, height } = 다운스케일치수계산(
        { width: original.width, height: original.height },
        longEdgeLimit,
    );
    if (width === original.width && height === original.height) {
        return original;
    }
    const resized = await createImageBitmap(original, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: "high",
    });
    original.close();
    return resized;
}

/**
 * 외부 URL → ImageBitmap (크루 로고용).
 * CORS는 Supabase public bucket이라 기본 허용.
 */
export async function loadImageFromUrl(url: string): Promise<ImageBitmap> {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`로고 로드 실패: ${res.status}`);
    const blob = await res.blob();
    return createImageBitmap(blob);
}
