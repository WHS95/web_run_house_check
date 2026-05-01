/**
 * 마스터(SUPER_ADMIN, role_id=1) 권한인가?
 */
export function 마스터_권한인가(
    roleCheck: { role_id: number | null | undefined } | null | undefined
): boolean {
    return roleCheck?.role_id === 1;
}

/**
 * 크루 멤버 역할로 유효한가? (CREW_MANAGER, MEMBER만 허용)
 */
export function 유효한_크루역할인가(role: unknown): role is 'CREW_MANAGER' | 'MEMBER' {
    return role === 'CREW_MANAGER' || role === 'MEMBER';
}

/**
 * 크루 이름 검증 — 빈 문자열/공백만 거부.
 */
export function 유효한_크루이름인가(name: unknown): boolean {
    return typeof name === 'string' && name.trim().length > 0;
}

/**
 * 크루 region 입력 검증 — 빈 문자열은 거부, 50자 이내.
 */
export function 유효한_지역인가(region: unknown): boolean {
    if (typeof region !== 'string') return false;
    const trimmed = region.trim();
    return trimmed.length > 0 && trimmed.length <= 50;
}

/**
 * 크루 설명 검증 — 1000자 이내(빈 값은 허용).
 */
export function 유효한_설명인가(description: unknown): boolean {
    if (description === null || description === undefined) return true;
    if (typeof description !== 'string') return false;
    return description.length <= 1000;
}

/**
 * accuracy_range 입력 검증 (0 < value <= 5000m).
 */
export function 유효한_정확도범위인가(value: unknown): boolean {
    if (typeof value !== 'number') return false;
    if (!Number.isFinite(value)) return false;
    return value > 0 && value <= 5000;
}
