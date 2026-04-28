export interface AuthActionResult<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[] | undefined>;
}

export interface VerifyCrewCodeOk {
    crewId: string;
}

export interface CrewMembershipVerificationOk {
    crew: {
        id: string;
        name: string | null;
    };
}

export interface CrewVerificationStatus {
    isVerified: boolean;
    crew: { id: string; name: string | null } | null;
}
