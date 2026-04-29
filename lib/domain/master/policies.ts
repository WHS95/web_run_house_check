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
