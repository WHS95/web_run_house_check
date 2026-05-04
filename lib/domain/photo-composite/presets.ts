import type {
    LogoTransform,
    PhotoSize,
    PresetPosition,
    PresetSize,
} from "./types";
import { PRESET_SIZE_RATIO } from "./types";

const PRESET_MARGIN = 32;

/**
 * 5개 프리셋 위치 × 3개 사이즈로 로고 transform 산출.
 * 로고 너비는 사진의 long-edge × 사이즈비율(8/12/18%).
 * height는 로고 비율(aspectRatio = width/height)에서 자동 계산.
 */
export function 프리셋좌표산출(
    position: PresetPosition,
    size: PresetSize,
    photo: PhotoSize,
    logoAspectRatio: number,
): LogoTransform {
    const longEdge = Math.max(photo.width, photo.height);
    const width = longEdge * PRESET_SIZE_RATIO[size];
    const height = width / logoAspectRatio;

    let x: number;
    let y: number;

    switch (position) {
        case "top-left":
            x = PRESET_MARGIN;
            y = PRESET_MARGIN;
            break;
        case "top-right":
            x = photo.width - PRESET_MARGIN - width;
            y = PRESET_MARGIN;
            break;
        case "center":
            x = (photo.width - width) / 2;
            y = (photo.height - height) / 2;
            break;
        case "bottom-left":
            x = PRESET_MARGIN;
            y = photo.height - PRESET_MARGIN - height;
            break;
        case "bottom-right":
            x = photo.width - PRESET_MARGIN - width;
            y = photo.height - PRESET_MARGIN - height;
            break;
    }

    return { x, y, width, rotation: 0, opacity: 1 };
}
