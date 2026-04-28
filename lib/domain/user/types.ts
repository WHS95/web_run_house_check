import type { UserActivityVerdict } from './policies';

export interface UserStatusActionResult {
    success: boolean;
    error?: string;
    message: string;
    data?: {
        userId: string;
        userName: string | null;
    } & UserActivityVerdict;
}

export interface UserWithdrawActionResult {
    success: boolean;
    error?: string;
    message: string;
}
