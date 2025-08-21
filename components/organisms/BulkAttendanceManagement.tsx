"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Calendar,
  MapPin,
  Check,
  X,
  UserPlus,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";
import { haptic } from "@/lib/haptic";

// 나이 계산 함수
const calculateAge = (birthYear: number | null): string => {
  if (!birthYear) return "";
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return `${age}세`;
};

interface User {
  id: string;
  first_name: string;
  email: string | null;
  phone: string | null;
  birth_year: number | null;
}

interface Location {
  id: number;
  name: string;
}

interface BulkAttendanceManagementProps {
  crewId: string;
}

export default function BulkAttendanceManagement({
  crewId,
}: BulkAttendanceManagementProps) {
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    location: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 알림 상태
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as NotificationType,
  });

  // 알림 표시 함수
  const showNotification = useCallback(
    (message: string, type: NotificationType) => {
      setNotification({
        isVisible: true,
        message,
        type,
      });
    },
    []
  );

  // 알림 닫기
  const closeNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // 사용자 목록과 위치 목록을 병렬로 조회
        const [usersResponse, locationsResponse] = await Promise.all([
          fetch(`/api/admin/users?crewId=${crewId}`),
          fetch(`/api/admin/settings?crewId=${crewId}`),
        ]);

        if (usersResponse.ok) {
          const usersResult = await usersResponse.json();
          if (usersResult.success && usersResult.data) {
            setUsers(usersResult.data || []);
          }
        }

        if (locationsResponse.ok) {
          const locationsResult = await locationsResponse.json();
          if (
            locationsResult.success &&
            locationsResult.data &&
            locationsResult.data.locations
          ) {
            setLocations(locationsResult.data.locations);
            // 첫 번째 위치를 기본값으로 설정
            if (locationsResult.data.locations.length > 0) {
              setAttendanceData((prev) => ({
                ...prev,
                location: locationsResult.data.locations[0].id.toString(),
              }));
            }
          }
        }
      } catch (error) {
        // //console.error("데이터 로드 실패:", error);
        showNotification("데이터를 불러오는데 실패했습니다.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [crewId, showNotification]);

  // 검색된 사용자 목록
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(
      (user) =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email &&
          user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.phone && user.phone.includes(searchTerm)) ||
        (user.birth_year && user.birth_year.toString().includes(searchTerm))
    );
  }, [users, searchTerm]);

  // 사용자 선택/해제
  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // 전체 선택/해제
  const toggleAllUsers = useCallback(() => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((user) => user.id)));
    }
  }, [selectedUsers.size, filteredUsers]);

  // 출석 데이터 변경
  const handleAttendanceDataChange = useCallback(
    (field: string, value: string) => {
      setAttendanceData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // 일괄 출석 처리
  const handleBulkAttendance = useCallback(async () => {
    if (selectedUsers.size === 0) {
      showNotification("출석 처리할 사용자를 선택해주세요.", "error");
      return;
    }

    if (!attendanceData.location) {
      showNotification("출석 장소를 선택해주세요.", "error");
      return;
    }

    if (!attendanceData.date || !attendanceData.time) {
      showNotification("출석 날짜와 시간을 모두 선택해주세요.", "error");
      return;
    }

    setIsSubmitting(true);
    haptic.medium();

    try {
      // 한국 시간 기준으로 ISO timestamp 생성
      const attendanceDateTime = new Date(
        `${attendanceData.date}T${attendanceData.time}:00`
      );
      const attendanceTimestamp = attendanceDateTime.toISOString();

      // console.log("선택된 날짜:", attendanceData.date);
      // console.log("선택된 시간:", attendanceData.time);
      // console.log("생성된 타임스탬프:", attendanceTimestamp);

      const response = await fetch("/api/admin/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId,
          userIds: Array.from(selectedUsers),
          attendanceTimestamp: attendanceTimestamp,
          locationId: parseInt(attendanceData.location),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        haptic.success();
        showNotification(
          `${selectedUsers.size}명의 출석이 성공적으로 처리되었습니다.`,
          "success"
        );
        setSelectedUsers(new Set());
      } else {
        haptic.error();
        showNotification(
          result.message || "출석 처리 중 오류가 발생했습니다.",
          "error"
        );
      }
    } catch (error) {
      // //console.error("일괄 출석 처리 실패:", error);
      haptic.error();
      showNotification("출석 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUsers, attendanceData, crewId, showNotification]);

  if (isLoading) {
    return (
      <div className='space-y-[3vh] animate-pulse'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='bg-basic-black-gray rounded-[0.75rem] p-[4vw]'
          >
            <div className='flex items-center space-x-[3vw]'>
              <div className='w-[3rem] h-[3rem] bg-basic-gray rounded-full'></div>
              <div className='flex-1 space-y-[1vh]'>
                <div className='h-[1rem] bg-basic-gray rounded w-[30vw]'></div>
                <div className='h-[0.875rem] bg-basic-gray rounded w-[50vw]'></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='bg-basic-black-gray rounded-[0.75rem] shadow-sm overflow-hidden'>
        <div className='p-[4vw] border-b border-basic-gray'>
          <div className='flex items-center space-x-[2vw]'>
            <UserPlus className='w-[1.25rem] h-[1.25rem] text-basic-blue' />
            <span className='text-[1.125rem] font-bold text-white'>
              출석 관리
            </span>
            <div className='ml-[1vw] px-[2vw] py-[0.5vh] bg-basic-gray rounded-full text-[0.75rem] font-medium text-gray-300'>
              {selectedUsers.size}명 선택됨
            </div>
          </div>
        </div>

        {/* 출석 정보 입력 */}
        <div className='p-[4vw] space-y-[3vh]'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {/* 날짜 */}
            <div>
              <label className='block mb-2 text-sm font-medium text-white'>
                출석 날짜
              </label>
              <Input
                type='date'
                value={attendanceData.date}
                onChange={(e) =>
                  handleAttendanceDataChange("date", e.target.value)
                }
                className='w-full text-white border-0 bg-basic-black placeholder:text-gray-400'
                //  className='justify-between w-full text-white border-0 bg-basic-black'
              />
            </div>

            {/* 시간 */}
            <div>
              <label className='block mb-2 text-sm font-medium text-white'>
                출석 시간
              </label>
              <Input
                type='time'
                value={attendanceData.time}
                onChange={(e) =>
                  handleAttendanceDataChange("time", e.target.value)
                }
                className='text-white border-0 bg-basic-black placeholder:text-gray-400'
              />
            </div>

            {/* 장소 */}
            <div>
              <label className='block mb-2 text-sm font-medium text-white'>
                출석 장소
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='justify-between w-full text-white border-0 bg-basic-black'
                  >
                    {locations.find(
                      (l) => l.id.toString() === attendanceData.location
                    )?.name || "장소 선택"}
                    <MapPin className='w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-full border-0 bg-basic-black-gray'>
                  {locations.map((location) => (
                    <DropdownMenuItem
                      key={location.id}
                      onClick={() =>
                        handleAttendanceDataChange(
                          "location",
                          location.id.toString()
                        )
                      }
                      className='text-white hover:bg-basic-gray'
                    >
                      {location.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 일괄 출석 버튼 */}
          <Button
            onClick={handleBulkAttendance}
            disabled={isSubmitting || selectedUsers.size === 0}
            className='w-full bg-basic-blue hover:bg-basic-blue/80 disabled:bg-basic-gray'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 w-4 h-4 animate-spin' />
                처리 중...
              </>
            ) : (
              <>
                <Check className='mr-2 w-4 h-4' />
                {selectedUsers.size}명 일괄 출석 처리
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 사용자 검색 및 선택 */}
      <div className='bg-basic-black-gray rounded-[0.75rem] shadow-sm overflow-hidden'>
        <div className='p-[4vw] border-b border-basic-gray'>
          <div className='flex items-center space-x-[2vw]'>
            {/* <Users className='w-[1.25rem] h-[1.25rem] text-white' /> */}
            <span className='text-[1.125rem] font-bold text-white'>크루원</span>
          </div>
        </div>

        <div className='p-[4vw] space-y-[3vh]'>
          {/* 검색 */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
            <Input
              placeholder='이름, 이메일, 전화번호, 출생연도로 검색'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 text-white border-0 bg-basic-black placeholder:text-gray-400'
            />
          </div>

          {/* 전체 선택/해제 */}
          <div className='flex justify-between items-center'>
            <Button
              variant='outline'
              size='sm'
              onClick={toggleAllUsers}
              className='text-white border-0 bg-basic-black-gray hover:bg-basic-gray'
            >
              {selectedUsers.size === filteredUsers.length ? (
                <>
                  <X className='mr-1 w-4 h-4' />
                  전체 해제
                </>
              ) : (
                <>
                  <Check className='mr-1 w-4 h-4' />
                  전체 선택
                </>
              )}
            </Button>
            <span className='text-sm text-gray-400'>
              {filteredUsers.length}명 중 {selectedUsers.size}명 선택
            </span>
          </div>

          {/* 사용자 목록 */}
          <div className='space-y-2 max-h-[50vh] overflow-y-auto'>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => toggleUserSelection(user.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedUsers.has(user.id)
                    ? "bg-basic-blue/20 border-basic-blue"
                    : "bg-basic-black border-basic-gray hover:bg-basic-gray/20"
                }`}
              >
                <div className='flex justify-between items-center'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedUsers.has(user.id)
                            ? "bg-basic-blue border-basic-blue"
                            : "border-gray-400"
                        }`}
                      >
                        {selectedUsers.has(user.id) && (
                          <Check className='w-3 h-3 text-white' />
                        )}
                      </div>
                      <div>
                        <div className='flex items-center space-x-2'>
                          <h4 className='font-medium text-white'>
                            {user.first_name}
                          </h4>
                          {user.birth_year && (
                            <span className='px-2 py-1 text-xs font-medium text-gray-300 rounded-full bg-basic-gray'>
                              {user.birth_year}
                            </span>
                          )}
                        </div>
                        {/* <p className='text-sm text-gray-300'>
                          {user.email || user.phone || "연락처 없음"}
                        </p> */}
                        {/* {user.birth_year && (
                          <p className='text-xs text-gray-400'>
                            {user.birth_year}년생
                          </p>
                        )} */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className='py-8 text-center'>
              <Users className='mx-auto mb-4 w-16 h-16 text-gray-500' />
              <p className='mb-2 text-lg font-medium text-gray-300'>
                {searchTerm
                  ? "검색 결과가 없습니다"
                  : "등록된 사용자가 없습니다"}
              </p>
              <p className='text-gray-400'>
                {searchTerm
                  ? "다른 검색어를 시도해보세요"
                  : "사용자가 등록되면 여기에 표시됩니다"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 알림 팝업 */}
      <PopupNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        duration={2000}
        onClose={closeNotification}
      />
    </div>
  );
}
