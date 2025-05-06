import { createClient } from '@/lib/supabase/client';

export interface AttendanceRecord {
  id: string;
  userName: string;
  timestamp: string;
  location: string;
  exerciseType: string;
}

/**
 * 최근 24시간 내 출석 기록을 가져오는 함수
 */
export async function getRecentAttendance(): Promise<AttendanceRecord[]> {
  const supabase = createClient();
  
  // 24시간 전 날짜 계산
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  
  try {
    const { data, error } = await supabase
      .from('attendance.attendance_records')
      .select(`
        id,
        attendance_timestamp,
        location,
        users:attendance.users!user_id (
          first_name
        ),
        exercise_types:attendance.exercise_types!exercise_type_id (
          name
        )
      `)
      .gte('attendance_timestamp', yesterday.toISOString())
      .order('attendance_timestamp', { ascending: false });
    
    if (error) {
      console.error('출석 데이터 가져오기 오류:', error);
      return [];
    }
    
    // 데이터 형식 변환
    return (data || []).map(record => ({
      id: record.id,
      userName: record.users?.first_name || '알 수 없음',
      timestamp: new Date(record.attendance_timestamp).toLocaleString('ko-KR'),
      location: record.location || '위치 정보 없음',
      exerciseType: record.exercise_types?.name || '기타',
    }));
  } catch (error) {
    console.error('출석 데이터 처리 오류:', error);
    return [];
  }
}