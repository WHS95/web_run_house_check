/**
 * 세션 보정 도메인 타입.
 */

export type SessionAuditAction =
    | 'add'
    | 'remove'
    | 'relabel'
    | 'delete_session';

export interface SessionAuditLogEntry {
    id: string;
    sessionId: string | null;
    crewId: string;
    adminId: string;
    action: SessionAuditAction;
    targetUserId: string | null;
    beforeState: unknown;
    afterState: unknown;
    createdAt: string;
}

export interface SessionMemberSummary {
    userId: string;
    userName: string;
    attendanceRecordId: string;
    joinedAt: string;
}

export interface SessionSummary {
    id: string;
    crewId: string;
    startedAt: string;
    endedAt: string | null;
    centerLat: number;
    centerLng: number;
    radiusM: number;
    autoLabel: string | null;
    memberCount: number;
}
