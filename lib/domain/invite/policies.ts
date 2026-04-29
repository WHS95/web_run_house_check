/**
 * 초대코드 도메인 정책.
 * - 커스텀 코드 형식 검증
 * - 어드민/마스터 코드 랜덤 생성
 */

const CUSTOM_CODE_REGEX = /^[A-Z0-9]{7}$/;
const CHARS_ADMIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CHARS_MASTER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CODE_LENGTH = 7;

/**
 * 사용자가 입력한 커스텀 초대코드가 형식적으로 유효한가?
 * (영문 대문자/숫자 7자리)
 */
export function 커스텀코드_유효한가(code: string): boolean {
    return CUSTOM_CODE_REGEX.test(code);
}

/**
 * 7자리 admin 초대코드 랜덤 생성 (대문자+숫자).
 */
export function 어드민코드_생성(): string {
    let result = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        result += CHARS_ADMIN.charAt(
            Math.floor(Math.random() * CHARS_ADMIN.length)
        );
    }
    return result;
}

/**
 * 7자리 master 초대코드 랜덤 생성 (대소문자).
 */
export function 마스터코드_생성(): string {
    let result = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        result += CHARS_MASTER.charAt(
            Math.floor(Math.random() * CHARS_MASTER.length)
        );
    }
    return result;
}
