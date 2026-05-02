/**
 * 크루 초대 코드의 활성 여부를 판정한다.
 * 추후 expires_at, max_uses 룰 활성화 시 본 함수로 통합한다.
 */
export function 초대코드_유효한가(
    code: { is_active: boolean }
): boolean {
    return code.is_active === true;
}

/**
 * 사용자가 이미 크루에 인증되었는지 판정.
 * /api/crew-verification POST에서 중복 인증 방지용.
 */
export function 인증된_사용자인가(
    user: { is_crew_verified: boolean | null | undefined }
): boolean {
    return user.is_crew_verified === true;
}

/**
 * 가입 시 크루 정보(verifiedCrewId, crewCode) 둘 다 존재하는지.
 * Zod schema에서 옵셔널이므로 추가 가드 필요.
 */
export function 크루정보_완전한가(
    input: {
        verifiedCrewId: string | null | undefined;
        crewCode: string | null | undefined;
    }
): boolean {
    return Boolean(input.verifiedCrewId && input.crewCode);
}
