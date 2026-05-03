export type PushTokenErrorCode =
    | "unauthenticated"
    | "rate_limited"
    | "invalid_input"
    | "db_error"
    | "internal";

export interface PushTokenActionResult {
    success: boolean;
    message?: string;
    code?: PushTokenErrorCode;
}
