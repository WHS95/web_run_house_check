/**
 * 단체 사진 합성 도메인 타입.
 *
 * 좌표계: 사진 좌상단 (0,0), 단위는 px (편집 캔버스 기준).
 * Konva Stage에 그대로 매핑되며, export 시 출력 캔버스 비율로 스케일된다.
 */

export type PresetPosition =
    | "top-left"
    | "top-right"
    | "center"
    | "bottom-left"
    | "bottom-right";

export type PresetSize = "S" | "M" | "L";

export const PRESET_SIZE_RATIO: Record<PresetSize, number> = {
    S: 0.08,
    M: 0.12,
    L: 0.18,
} as const;

export interface PhotoSize {
    width: number;
    height: number;
}

export interface LogoTransform {
    /** 로고 좌상단 X (편집 캔버스 px) */
    x: number;
    /** 로고 좌상단 Y (편집 캔버스 px) */
    y: number;
    /** 로고 너비 (편집 캔버스 px). 비율 잠금이라 height = width / aspectRatio */
    width: number;
    /** 회전 각도 (deg, 시계방향) */
    rotation: number;
    /** 투명도 (0~1) */
    opacity: number;
}

export type LogoSource =
    | { kind: "crew"; url: string }
    | { kind: "upload"; objectUrl: string };

export interface ComposeInput {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap;
    transform: LogoTransform;
    /** 출력 캔버스 long-edge px (예: 2560) */
    outputLongEdge: number;
}
