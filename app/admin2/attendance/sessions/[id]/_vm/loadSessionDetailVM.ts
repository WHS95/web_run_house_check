import { createClient } from '@/lib/supabase/server';

export interface SessionMemberVM {
    userId: string;
    userName: string;
    profileImageUrl: string | null;
    attendanceRecordId: string;
    joinedAt: string;
    status: string;
}

export interface SessionDetailVM {
    id: string;
    crewId: string;
    startedAt: string;
    endedAt: string | null;
    autoLabel: string | null;
    centerLat: number;
    centerLng: number;
    radiusM: number;
    members: SessionMemberVM[];
    auditLog: Array<{
        id: string;
        action: string;
        adminName: string | null;
        targetUserName: string | null;
        createdAt: string;
        beforeState: unknown;
        afterState: unknown;
    }>;
}

/**
 * 세션 상세 ViewModel — 세션 메타 + 멤버 + 최근 감사 로그.
 */
export async function loadSessionDetailVM(
    sessionId: string,
    crewId: string,
): Promise<SessionDetailVM | null> {
    const supabase = await createClient();

    const { data: session } = await supabase
        .schema('attendance')
        .from('sessions')
        .select(
            'id, crew_id, started_at, ended_at, auto_label, center_lat, center_lng, radius_m',
        )
        .eq('id', sessionId)
        .eq('crew_id', crewId)
        .maybeSingle();

    if (!session) return null;

    // 멤버 목록 (session_members → users join + attendance_records.status)
    const { data: members } = await supabase
        .schema('attendance')
        .from('session_members')
        .select(
            `
            user_id,
            attendance_record_id,
            joined_at,
            users:user_id (id, name, profile_image_url),
            attendance_records:attendance_record_id (status)
            `,
        )
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

    const memberRows: SessionMemberVM[] = (members ?? []).map((row) => {
        const userRaw = row.users as unknown;
        const user = (Array.isArray(userRaw) ? userRaw[0] : userRaw) as
            | {
                  id: string;
                  name: string;
                  profile_image_url: string | null;
              }
            | null
            | undefined;
        const recordRaw = row.attendance_records as unknown;
        const record = (Array.isArray(recordRaw)
            ? recordRaw[0]
            : recordRaw) as { status: string } | null | undefined;
        return {
            userId: row.user_id as string,
            userName: user?.name ?? '알 수 없음',
            profileImageUrl: user?.profile_image_url ?? null,
            attendanceRecordId: row.attendance_record_id as string,
            joinedAt: row.joined_at as string,
            status: record?.status ?? 'unknown',
        };
    });

    // 최근 감사 로그 20건
    const { data: logs } = await supabase
        .schema('attendance')
        .from('session_audit_log')
        .select(
            `
            id,
            action,
            target_user_id,
            before_state,
            after_state,
            created_at,
            admin:admin_id (name),
            target_user:target_user_id (name)
            `,
        )
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(20);

    const auditLog = (logs ?? []).map((row) => {
        const adminRaw = row.admin as unknown;
        const admin = (Array.isArray(adminRaw) ? adminRaw[0] : adminRaw) as
            | { name: string }
            | null
            | undefined;
        const targetRaw = row.target_user as unknown;
        const target = (Array.isArray(targetRaw)
            ? targetRaw[0]
            : targetRaw) as { name: string } | null | undefined;
        return {
            id: row.id as string,
            action: row.action as string,
            adminName: admin?.name ?? null,
            targetUserName: target?.name ?? null,
            createdAt: row.created_at as string,
            beforeState: row.before_state,
            afterState: row.after_state,
        };
    });

    return {
        id: session.id as string,
        crewId: session.crew_id as string,
        startedAt: session.started_at as string,
        endedAt: session.ended_at as string | null,
        autoLabel: session.auto_label as string | null,
        centerLat: session.center_lat as number,
        centerLng: session.center_lng as number,
        radiusM: session.radius_m as number,
        members: memberRows,
        auditLog,
    };
}
