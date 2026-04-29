/**
 * 초대코드 도메인 타입.
 */

export interface InviteCodeRow {
    id: number;
    crew_id: string;
    invite_code: string;
    description: string | null;
    is_active: boolean | null;
    used_count: number | null;
    max_uses: number | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string | null;
    created_by: string | null;
}

export interface MasterInviteCodeRow extends InviteCodeRow {
    crew_name: string | null;
}
