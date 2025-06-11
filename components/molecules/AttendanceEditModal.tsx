"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";

interface AttendanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: {
    id: string;
    userId: string;
    userName: string;
    checkInTime: string;
    location: string;
    exerciseType: string;
    isHost: boolean;
  };
  onSave: (attendanceData: {
    checkInTime: string;
    location: string;
    isHost: boolean;
  }) => Promise<void>;
  crewId?: string; // 크루 ID 추가
}

const AttendanceEditModal: React.FC<AttendanceEditModalProps> = ({
  isOpen,
  onClose,
  attendance,
  onSave,
  crewId,
}) => {
  const [formData, setFormData] = useState({
    checkInTime: attendance.checkInTime,
    location: attendance.location,
    isHost: attendance.isHost,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<
    Array<{ id: number; name: string; description?: string }>
  >([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [customLocation, setCustomLocation] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 크루별 활동장소 목록 조회
  useEffect(() => {
    const fetchCrewLocations = async () => {
      console.log("=== AttendanceEditModal Debug ===");
      console.log("crewId:", crewId);
      console.log("isOpen:", isOpen);

      if (!crewId) {
        console.log("crewId가 없어서 장소 조회를 건너뜁니다.");
        return;
      }

      try {
        console.log("crew_locations 조회 시작...");
        const { data, error } = await supabase
          .schema("attendance")
          .from("crew_locations")
          .select("id, name, description")
          .eq("crew_id", crewId)
          .eq("is_active", true)
          .order("name");

        if (!error && data) {
          setLocations(data);
        } else if (error) {
          console.error("Supabase 오류:", error);
        }
      } catch (error) {
        console.error("크루 활동장소 목록 조회 실패:", error);
      }
    };

    if (isOpen) {
      fetchCrewLocations();
    }
  }, [isOpen, crewId, supabase]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".location-dropdown-container")) {
        setShowLocationDropdown(false);
      }
    };

    if (showLocationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showLocationDropdown]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("출석 정보 수정 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: { id: number; name: string }) => {
    setFormData({ ...formData, location: location.name });
    setShowLocationDropdown(false);
  };

  const handleCustomLocationSubmit = () => {
    if (customLocation.trim()) {
      setFormData({ ...formData, location: customLocation.trim() });
      setCustomLocation("");
      setShowLocationDropdown(false);
    }
  };

  // 시간을 YYYY-MM-DDTHH:MM 형식으로 변환 (datetime-local input용)
  const formatDateTimeForInput = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // datetime-local input 값을 ISO 문자열로 변환
  const formatInputToDateTime = (inputValue: string) => {
    return new Date(inputValue).toISOString();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* 배경 오버레이 */}
      <div
        className='absolute inset-0 bg-basic-black/50 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className='relative w-full max-w-md p-8 mx-4 bg-white shadow-2xl rounded-3xl'>
        <div className='text-center'>
          {/* 제목 */}
          <h2 className='mb-6 text-xl font-bold text-gray-900'>
            출석 정보 수정
          </h2>

          {/* 사용자 정보 (읽기 전용) */}
          <div className='p-4 mb-6 rounded-lg bg-gray-50'>
            <p className='font-medium text-gray-900'>{attendance.userName}</p>
            <p className='text-xs text-gray-500'>{attendance.exerciseType}</p>
          </div>

          {/* 폼 */}
          <div className='space-y-4 text-left'>
            {/* 참여시간 */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                참여시간
              </label>
              <input
                type='datetime-local'
                value={formatDateTimeForInput(formData.checkInTime)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    checkInTime: formatInputToDateTime(e.target.value),
                  })
                }
                className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-basic-blue'
              />
            </div>

            {/* 장소 */}
            <div className='relative location-dropdown-container'>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                장소
              </label>
              <div className='relative'>
                <input
                  type='text'
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  onFocus={() => setShowLocationDropdown(true)}
                  className='w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-basic-blue'
                  placeholder='모임 장소를 입력하세요'
                />
                <button
                  type='button'
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className='absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>
              </div>

              {/* 드롭다운 메뉴 */}
              {showLocationDropdown && (
                <div className='absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60'>
                  {locations.length > 0 && (
                    <>
                      {locations.map((location) => (
                        <button
                          key={location.id}
                          type='button'
                          onClick={() => handleLocationSelect(location)}
                          className='w-full px-3 py-3 text-left border-b border-gray-100 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none last:border-b-0'
                        >
                          <div className='font-medium text-gray-900'>
                            {location.name}
                          </div>
                        </button>
                      ))}
                      <div className='border-t border-gray-200'></div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 벙주여부 */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                벙주여부
              </label>
              <div className='flex items-center space-x-4'>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='isHost'
                    checked={formData.isHost}
                    onChange={() => setFormData({ ...formData, isHost: true })}
                    className='mr-2 text-basic-blue focus:ring-basic-blue'
                  />
                  <span className='text-sm text-gray-700'>벙주</span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='isHost'
                    checked={!formData.isHost}
                    onChange={() => setFormData({ ...formData, isHost: false })}
                    className='mr-2 text-basic-blue focus:ring-basic-blue'
                  />
                  <span className='text-sm text-gray-700'>일반 참여자</span>
                </label>
              </div>
            </div>
          </div>

          {/* 버튼들 */}
          <div className='flex gap-3 mt-8'>
            <Button
              onClick={onClose}
              variant='outline'
              className='flex-1 py-3 text-gray-600 border-gray-300 hover:bg-gray-50'
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              className='flex-1 py-3 text-white bg-basic-blue hover:bg-blue-600'
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceEditModal;
