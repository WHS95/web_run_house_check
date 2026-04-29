export interface AdminActionResult<T = unknown> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
}
