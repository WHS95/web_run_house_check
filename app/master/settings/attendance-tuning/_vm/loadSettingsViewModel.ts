import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
    SYSTEM_SETTINGS_DEFAULT,
    type SystemSettings,
    type SystemSettingsHistoryRow,
} from '@/lib/domain/system-settings/types';

export interface AttendanceTuningVM {
    settings: SystemSettings;
    history: SystemSettingsHistoryRow[];
}

interface SettingsRow {
    key: string;
    value: unknown;
}

interface HistoryRow {
    key: string;
    old_value: unknown;
    new_value: unknown;
    updated_at: string;
    users:
        | { first_name: string | null }
        | Array<{ first_name: string | null }>
        | null;
}

function 정수_파싱(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.trunc(value);
    }
    if (typeof value === 'string') {
        const n = Number(value);
        if (Number.isFinite(n)) return Math.trunc(n);
    }
    return fallback;
}

function 작성자명_추출(
    users: HistoryRow['users'],
): string | null {
    if (!users) return null;
    if (Array.isArray(users)) {
        return users[0]?.first_name ?? null;
    }
    return users.first_name ?? null;
}

/**
 * 마스터 출석 튜닝 페이지 ViewModel 조립.
 *
 * - system_settings 테이블에서 4개 키를 모두 읽어 SystemSettings로 매핑.
 * - 누락된 키는 SYSTEM_SETTINGS_DEFAULT로 보충.
 * - 변경 이력은 최근 20건, updated_by의 first_name과 함께.
 */
export async function loadAttendanceTuningVM(): Promise<AttendanceTuningVM> {
    const supabase = await createClient();

    const { data: settingsRows } = await supabase
        .schema('attendance')
        .from('system_settings')
        .select('key, value');

    const map = new Map<string, unknown>();
    for (const row of (settingsRows ?? []) as SettingsRow[]) {
        map.set(row.key, row.value);
    }

    const settings: SystemSettings = {
        session_window_minutes: 정수_파싱(
            map.get('session_window_minutes'),
            SYSTEM_SETTINGS_DEFAULT.session_window_minutes,
        ),
        session_radius_m: 정수_파싱(
            map.get('session_radius_m'),
            SYSTEM_SETTINGS_DEFAULT.session_radius_m,
        ),
        session_close_minutes: 정수_파싱(
            map.get('session_close_minutes'),
            SYSTEM_SETTINGS_DEFAULT.session_close_minutes,
        ),
        auto_label_min_session_count: 정수_파싱(
            map.get('auto_label_min_session_count'),
            SYSTEM_SETTINGS_DEFAULT.auto_label_min_session_count,
        ),
    };

    const { data: historyRows } = await supabase
        .schema('attendance')
        .from('system_settings_history')
        .select(
            'key, old_value, new_value, updated_at, users:updated_by(first_name)',
        )
        .order('updated_at', { ascending: false })
        .limit(20);

    const history: SystemSettingsHistoryRow[] = (
        (historyRows ?? []) as HistoryRow[]
    ).map((h) => ({
        key: h.key,
        old_value: h.old_value,
        new_value: h.new_value,
        updated_at: h.updated_at,
        updated_by_name: 작성자명_추출(h.users),
    }));

    return { settings, history };
}
