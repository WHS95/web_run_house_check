import type { LogoTransform, PhotoSize } from "./types";

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

/**
 * 로고가 사진 영역에서 너무 벗어나지 않도록 위치 보정.
 * minVisibleRatio (0~1): 로고의 최소 가시 면적 비율. 0.5면 절반은 안에 있어야.
 *
 * 회전은 보정하지 않는다 (회전된 로고의 정확한 bounding box는 비싸고,
 * 사용자 의도상 로고 절반만 보이는 정도는 허용).
 */
export function 클램프적용하기(
    t: LogoTransform,
    photo: PhotoSize,
    aspectRatio: number,
): LogoTransform {
    const minVisibleRatio = 0.5;
    const height = t.width / aspectRatio;
    const minXVisible = t.width * minVisibleRatio;
    const minYVisible = height * minVisibleRatio;
    const minX = -(t.width - minXVisible);
    const maxX = photo.width - minXVisible;
    const minY = -(height - minYVisible);
    const maxY = photo.height - minYVisible;
    return {
        ...t,
        x: Math.min(maxX, Math.max(minX, t.x)),
        y: Math.min(maxY, Math.max(minY, t.y)),
    };
}
