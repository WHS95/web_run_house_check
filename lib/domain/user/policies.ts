/**
 * 사용자/크루 상태에 기반한 활성 여부 판정.
 * 우선순위: user.status (suspended/inactive) > user_crews.status (suspended/inactive/withdrawn).
 */
export interface UserStatusInput {
    user: {
        status: string | null | undefined;
        suspension_reason: string | null | undefined;
    };
    userCrew?: {
        status: string | null | undefined;
        suspension_reason: string | null | undefined;
    } | null;
}

export interface UserActivityVerdict {
    isActive: boolean;
    statusMessage: string;
    suspensionReason: string;
    userStatus: string;
    crewStatus: string;
}

export function 사용자_활성여부_판정(
    input: UserStatusInput
): UserActivityVerdict {
    const userStatus = (input.user.status ?? '').toLowerCase();
    const crewStatus = (input.userCrew?.status ?? '').toLowerCase();

    if (userStatus === 'suspended') {
        return {
            isActive: false,
            statusMessage: '계정이 정지된 상태입니다.',
            suspensionReason:
                input.user.suspension_reason || '운영진에게 문의바랍니다.',
            userStatus: userStatus || 'active',
            crewStatus: crewStatus || 'active',
        };
    }

    if (userStatus === 'inactive') {
        return {
            isActive: false,
            statusMessage: '계정이 비활성화된 상태입니다.',
            suspensionReason: '운영진에게 문의바랍니다.',
            userStatus: userStatus || 'active',
            crewStatus: crewStatus || 'active',
        };
    }

    if (crewStatus === 'suspended') {
        return {
            isActive: false,
            statusMessage: '크루 내 활동이 정지된 상태입니다.',
            suspensionReason:
                input.userCrew?.suspension_reason ||
                '운영진에게 문의바랍니다.',
            userStatus: userStatus || 'active',
            crewStatus,
        };
    }

    if (crewStatus === 'inactive') {
        return {
            isActive: false,
            statusMessage: '크루 내 활동이 비활성화된 상태입니다.',
            suspensionReason: '운영진에게 문의바랍니다.',
            userStatus: userStatus || 'active',
            crewStatus,
        };
    }

    if (crewStatus === 'withdrawn') {
        return {
            isActive: false,
            statusMessage: '크루에서 탈퇴된 상태입니다.',
            suspensionReason: '운영진에게 문의바랍니다.',
            userStatus: userStatus || 'active',
            crewStatus,
        };
    }

    return {
        isActive: true,
        statusMessage: '',
        suspensionReason: '',
        userStatus: userStatus || 'active',
        crewStatus: crewStatus || 'active',
    };
}
