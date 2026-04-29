/**
 * 위도 유효성 (-90 ~ 90).
 */
export function 위도_유효한가(latitude: number): boolean {
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

/**
 * 경도 유효성 (-180 ~ 180).
 */
export function 경도_유효한가(longitude: number): boolean {
    return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

/**
 * 좌표(위/경도) 유효성 통합 검사.
 */
export function 좌표_유효한가(
    latitude: number,
    longitude: number
): boolean {
    return 위도_유효한가(latitude) && 경도_유효한가(longitude);
}
