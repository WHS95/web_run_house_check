/**
 * 단체사진/로고 업로드 입력 검증.
 *
 * MIME과 크기만 검증하고, 실제 디코딩 가능한지는 호출자가 createImageBitmap에서 판단.
 * (도메인 레이어는 브라우저 API에 의존하지 않는다.)
 */

const PHOTO_MAX_SIZE = 20 * 1024 * 1024; // 20MB
const LOGO_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const PHOTO_ALLOWED_MIME: ReadonlySet<string> = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const LOGO_ALLOWED_MIME: ReadonlySet<string> = new Set(["image/png"]);

export type ValidationResult =
    | { ok: true }
    | { ok: false; reason: string };

export function 사진업로드_검증(file: File): ValidationResult {
    if (file.type === "image/heic" || file.type === "image/heif") {
        return {
            ok: false,
            reason: "HEIC 형식은 아직 지원하지 않아요. JPG로 변환 후 올려주세요.",
        };
    }
    if (!PHOTO_ALLOWED_MIME.has(file.type)) {
        return { ok: false, reason: "이미지 파일만 업로드할 수 있어요." };
    }
    if (file.size > PHOTO_MAX_SIZE) {
        return { ok: false, reason: "사진 크기는 20MB 이하여야 해요." };
    }
    return { ok: true };
}

export function 로고업로드_검증(file: File): ValidationResult {
    if (!LOGO_ALLOWED_MIME.has(file.type)) {
        return { ok: false, reason: "PNG 파일만 업로드할 수 있어요." };
    }
    if (file.size > LOGO_MAX_SIZE) {
        return { ok: false, reason: "로고 크기는 5MB 이하여야 해요." };
    }
    return { ok: true };
}
