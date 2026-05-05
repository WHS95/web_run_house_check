/**
 * 세션 보정(운영진) 정책.
 *
 * 운영진은 세션이 종료된 이후에도 보정이 가능하다.
 * (사용자 신고/오인 출석 사후 정정 등)
 * 단, 권한이 있어야 한다.
 */

export interface 보정가능여부_입력 {
    isAdmin: boolean;
    sessionEnded: boolean;
}

/**
 * 세션 보정 가능 여부.
 *
 * 종료 여부와 관계없이 운영진(크루 매니저/마스터)은 항상 보정 가능.
 * 일반 멤버는 보정 불가.
 */
export function 보정가능한가(args: 보정가능여부_입력): boolean {
    return args.isAdmin === true;
}

/**
 * 라벨 변경 가능 여부.
 *
 * 운영진만 가능, 라벨 길이는 최대 50자.
 */
export function 라벨변경_가능한가(args: {
    isAdmin: boolean;
    label: string;
}): boolean {
    if (!args.isAdmin) return false;
    const trimmed = args.label.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > 50) return false;
    return true;
}

/**
 * 세션 삭제 가능 여부.
 *
 * 운영진만 가능. 단, 종료된 세션이라도 30일 이내라면 삭제 가능.
 * 너무 오래된 세션은 통계 무결성을 위해 삭제 불가.
 */
export function 세션삭제_가능한가(args: {
    isAdmin: boolean;
    startedAt: Date;
    now: Date;
}): boolean {
    if (!args.isAdmin) return false;
    const days = (args.now.getTime() - args.startedAt.getTime()) /
        (1000 * 60 * 60 * 24);
    return days <= 30;
}
