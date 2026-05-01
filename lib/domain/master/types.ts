export interface MasterActionResult<T = unknown> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
}

export interface CrewRow {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

export interface CrewMemberRow {
    id: string;
    first_name: string | null;
    email: string | null;
    phone: string | null;
    birth_year: number | null;
    profile_image_url: string | null;
    is_crew_verified: boolean | null;
    created_at: string;
    crew_role: string | null;
}

export interface CrewOverviewRow {
    id: string;
    name: string;
    description: string | null;
    region: string | null;
    profile_image_url: string | null;
    created_at: string;
    member_count: number;
    last_attendance_at: string | null;
    attendance_30d: number;
}

export type CrewActivityStatus = 'active' | 'idle' | 'dormant';

export interface CrewListItem extends CrewOverviewRow {
    activity_status: CrewActivityStatus;
}

export interface DashboardKpi {
    total_crews: number;
    total_users: number;
    attendance_30d: number;
    active_crews: number;
    idle_crews: number;
    dormant_crews: number;
}

export interface RecentSignupCrew {
    id: string;
    name: string;
    created_at: string;
    member_count: number;
}

export interface CrewActivityDay {
    date: string;
    count: number;
}

export interface CrewActivityRecent {
    id: string;
    user_id: string;
    user_name: string | null;
    attendance_timestamp: string;
    location: string | null;
    is_host: boolean | null;
    exercise_type_name: string | null;
}

export interface CrewHostRanking {
    user_id: string;
    user_name: string | null;
    host_count: number;
}

export interface CrewMemberDetailRow extends CrewMemberRow {
    crew_id: string;
    status: string | null;
    joined_at: string | null;
}

export interface CreateCrewInput {
    name: string;
    description?: string | null;
    region?: string | null;
    generate_first_admin_code?: boolean;
}

export interface UpdateCrewInput {
    name?: string;
    description?: string | null;
    region?: string | null;
    location_based_attendance?: boolean;
    accuracy_range?: number | null;
    allow_unregistered_location?: boolean;
}
