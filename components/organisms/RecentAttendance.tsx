"use client";

import React, { useState, useEffect } from "react";
import { User, Clock, MapPin } from "lucide-react";

// AttendanceRecord 타입을 직접 정의합니다.
interface AttendanceRecord {
  id: string;
  userName: string;
  timestamp: string;
  location: string;
  exerciseType: string;
}

// 임시 데이터 - 실제로는 API를 통해 가져옵니다
const mockRecentAttendance: AttendanceRecord[] = [
  {
    id: "1",
    userName: "김민준",
    timestamp: "2024-05-01 14:30",
    location: "올림픽공원 평화의 문",
    exerciseType: "러닝",
  },
  {
    id: "2",
    userName: "이서연",
    timestamp: "2024-05-01 14:25",
    location: "한강공원 반포지구",
    exerciseType: "자전거",
  },
  {
    id: "3",
    userName: "박지훈",
    timestamp: "2024-05-01 14:15",
    location: "올림픽공원 평화의 문",
    exerciseType: "러닝",
  },
  {
    id: "4",
    userName: "최수아",
    timestamp: "2024-05-01 14:00",
    location: "북한산 국립공원",
    exerciseType: "등산",
  },
  {
    id: "5",
    userName: "정도윤",
    timestamp: "2024-05-01 13:45",
    location: "한강공원 잠실지구",
    exerciseType: "러닝",
  },
  {
    id: "6",
    userName: "강하은",
    timestamp: "2024-05-01 13:30",
    location: "올림픽공원 평화의 문",
    exerciseType: "러닝",
  },
  {
    id: "7",
    userName: "윤지민",
    timestamp: "2024-05-01 13:15",
    location: "서울숲공원",
    exerciseType: "러닝",
  },
  {
    id: "8",
    userName: "임서진",
    timestamp: "2024-05-01 13:00",
    location: "북한산 국립공원",
    exerciseType: "등산",
  },
  {
    id: "9",
    userName: "한예준",
    timestamp: "2024-05-01 12:45",
    location: "한강공원 여의도지구",
    exerciseType: "자전거",
  },
  {
    id: "10",
    userName: "오하준",
    timestamp: "2024-05-01 12:30",
    location: "올림픽공원 평화의 문",
    exerciseType: "러닝",
  },
  {
    id: "11",
    userName: "신지유",
    timestamp: "2024-05-01 12:15",
    location: "북한산 국립공원",
    exerciseType: "등산",
  },
  {
    id: "12",
    userName: "황서율",
    timestamp: "2024-05-01 12:00",
    location: "한강공원 이촌지구",
    exerciseType: "러닝",
  },
  {
    id: "13",
    userName: "조은우",
    timestamp: "2024-05-01 11:45",
    location: "서울숲공원",
    exerciseType: "러닝",
  },
  {
    id: "14",
    userName: "유시우",
    timestamp: "2024-05-01 11:30",
    location: "올림픽공원 평화의 문",
    exerciseType: "러닝",
  },
  {
    id: "15",
    userName: "양주원",
    timestamp: "2024-05-01 11:15",
    location: "한강공원 망원지구",
    exerciseType: "자전거",
  },
];

const getExerciseTypeColor = (type: string) => {
  switch (type) {
    case "러닝":
      return "bg-blue-500";
    case "등산":
      return "bg-green-500";
    case "자전거":
      return "bg-amber-500";
    default:
      return "bg-gray-500";
  }
};

export default function RecentAttendance() {
  const [showAll, setShowAll] = useState(false);
  const [attendanceData, setAttendanceData] =
    useState<AttendanceRecord[]>(mockRecentAttendance);
  const [isLoading, setIsLoading] = useState(false);

  // 실제 API를 사용할 경우 아래 주석을 해제하고 mockRecentAttendance를 제거하세요
  /*
  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const { getRecentAttendance } = await import('@/lib/api/attendance');
        const data = await getRecentAttendance();
        setAttendanceData(data);
      } catch (error) {
        console.error('출석 데이터 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttendance();
    
    // 1분마다 데이터 새로고침
    const interval = setInterval(fetchAttendance, 60000);
    return () => clearInterval(interval);
  }, []);
  */

  const initialRecords = attendanceData.slice(0, 10);
  const remainingRecords = attendanceData.slice(10);

  // 표시할 레코드 결정
  const displayRecords = showAll ? attendanceData : initialRecords;

  return (
    <div className='bg-gray-800 rounded-lg p-4 shadow-lg'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-semibold'>최근 24시간 출석 현황</h2>
        <div className='text-sm text-gray-400 flex items-center'>
          <Clock size={14} className='mr-1' />
          <span>현재 총 {attendanceData.length}명 출석</span>
        </div>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-8'>
          <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500'></div>
        </div>
      ) : (
        <>
          <div className='space-y-3 max-h-[60vh] overflow-y-auto pr-2'>
            {displayRecords.map((record) => (
              <div
                key={record.id}
                className='flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors'
              >
                <div className='w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white mr-4'>
                  <User size={20} />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center'>
                    <p className='font-medium text-white'>{record.userName}</p>
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full text-white ${getExerciseTypeColor(
                        record.exerciseType
                      )}`}
                    >
                      {record.exerciseType}
                    </span>
                  </div>
                  <div className='flex items-center text-sm text-gray-400 mt-1'>
                    <MapPin size={14} className='mr-1' />
                    <span className='truncate'>{record.location}</span>
                  </div>
                </div>
                <div className='text-xs text-gray-400'>{record.timestamp}</div>
              </div>
            ))}
          </div>

          {!showAll && remainingRecords.length > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className='mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm flex items-center justify-center'
            >
              더보기 ({remainingRecords.length}명)
            </button>
          )}

          {showAll && (
            <button
              onClick={() => setShowAll(false)}
              className='mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm flex items-center justify-center'
            >
              접기
            </button>
          )}
        </>
      )}
    </div>
  );
}
