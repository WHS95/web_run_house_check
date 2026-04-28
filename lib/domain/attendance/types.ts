import type { AttendanceSubmissionData } from './validators';

export type AttendanceInput = AttendanceSubmissionData;

export interface AttendanceLocationContext {
    locationId: number | 'unregistered';
    locationName: string;
}

export interface AttendanceSubmitResult {
    success: boolean;
    message: string;
    data?: unknown;
    errors?: Record<string, string[] | undefined>;
}
