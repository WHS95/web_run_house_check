export interface CrewLocationRow {
    id: number;
    name: string;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    is_active: boolean;
}

export interface CrewLocationsActionResult {
    success: boolean;
    error?: string;
    data?: CrewLocationRow[];
}
