/**
 * 마스터(SUPER_ADMIN, role_id=1) 권한인가?
 */
export function 마스터_권한인가(
    roleCheck: { role_id: number | null | undefined } | null | undefined
): boolean {
    return roleCheck?.role_id === 1;
}

/**
 * 관리자 모드(/admin2) 접근 가능한가?
 *
 * - role_id=1 (MASTER_ADMIN): 서비스 전체 권한자. 동시에 특정 크루의 크루장일
 *   수도 있으므로 무조건 통과시킨다.
 * - role_id=2 (ADMIN): 일반 관리자 권한.
 * - 인증 크루의 crew_role='CREW_MANAGER' 또는 'OWNER': 크루장/소유자.
 *
 * 위 중 하나라도 만족하면 마이페이지에서 "관리자 모드" 버튼이 노출된다.
 */
export function 관리자_모드_접근가능한가(input: {
    roleId: number | null | undefined;
    crewRole: string | null | undefined;
}): boolean {
    return 관리자_역할_결정(input) !== null;
}

/**
 * /admin2 진입 시 부여할 관리자 역할 결정.
 *
 * - 'owner': 시스템 마스터(role_id=1) 또는 크루 소유자(crew_role='OWNER').
 *   마스터는 시스템 최상위 권한이므로 인증 크루 내 crew_role과 무관하게 owner.
 * - 'admin': 일반 관리자(role_id=2) 또는 크루장(crew_role='CREW_MANAGER').
 * - null: 권한 없음.
 *
 * 우선순위: MASTER_ADMIN > OWNER > ADMIN/CREW_MANAGER.
 */
export function 관리자_역할_결정(input: {
    roleId: number | null | undefined;
    crewRole: string | null | undefined;
}): 'owner' | 'admin' | null {
    if (input.roleId === 1) return 'owner';
    const upperCrew = (input.crewRole ?? '').toUpperCase();
    if (upperCrew === 'OWNER') return 'owner';
    if (input.roleId === 2) return 'admin';
    if (upperCrew === 'CREW_MANAGER' || upperCrew === 'ADMIN') return 'admin';
    return null;
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
