import type { PhotoSize } from "./types";

/**
 * 사진 long-edge를 한도 이하로 줄인 새 치수 산출.
 * 비율 유지, 한도 이하면 원본 그대로 반환.
 */
export function 다운스케일치수계산(
    src: PhotoSize,
    longEdgeLimit: number,
): PhotoSize {
    const longEdge = Math.max(src.width, src.height);
    if (longEdge <= longEdgeLimit) return src;
    const ratio = longEdgeLimit / longEdge;
    return {
        width: Math.round(src.width * ratio),
        height: Math.round(src.height * ratio),
    };
}
