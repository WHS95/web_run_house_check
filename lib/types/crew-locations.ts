export interface CrewLocation {
  id: number;
  crew_id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrewLocationForm {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string; // 사용자가 입력한 주소 (저장은 안함)
}

export interface CrewLocationCreateData {
  crew_id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
}

export interface CrewLocationUpdateData {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

// API 응답 타입들
export interface CrewLocationResponse {
  success: boolean;
  data?: CrewLocation | CrewLocation[];
  error?: string;
}

export interface CrewLocationListResponse {
  success: boolean;
  data?: CrewLocation[];
  error?: string;
}