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
