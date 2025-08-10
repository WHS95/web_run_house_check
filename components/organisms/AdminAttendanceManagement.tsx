"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  CheckCircle,
  Search,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Edit,
  Users,
  UserPlus,
  Check,
} from "lucide-react";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";
import AttendanceEditModal from "@/components/molecules/AttendanceEditModal";
import NoticeModal from "@/components/molecules/NoticeModal";
import BulkAttendanceManagement from "@/components/organisms/BulkAttendanceManagement";
// API 라우트를 통해 출석 기록 관리
import type {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceDetailData,
} from "@/lib/supabase/admin";
import { useAdminContext } from "@/app/admin/AdminContextProvider";

// 모임 그룹 타입 정의
interface MeetingGroup {
  groupName: string; // 장소_시간 형식
  location: string;
  time: string;
  records: AttendanceRecord[];
}

// Props 타입 정의
interface AdminAttendanceManagementProps {
  attendanceSummary: AttendanceSummary[];
  attendanceDetailData: AttendanceDetailData;
}

export default function AdminAttendanceManagement({
  attendanceSummary: initialSummary,
  attendanceDetailData: initialDetailData,
}: AdminAttendanceManagementProps) {
  const { crewId } = useAdminContext();
  const [activeTab, setActiveTab] = useState<"calendar" | "manage">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateDetails, setSelectedDateDetails] = useState<
    AttendanceRecord[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceRecord | null>(null);
  const [noticeModal, setNoticeModal] = useState({
    isOpen: false,
    title: "",
    content: "",
  });

  // 상태로 관리되는 데이터
  const [attendanceSummary, setAttendanceSummary] = useState(initialSummary);
  const [attendanceDetailData, setAttendanceDetailData] =
    useState(initialDetailData);

  // 현재 월의 첫 번째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 달력에 표시할 날짜들 생성
  const calendarDays = [];

  // 이전 달의 마지막 날들
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(firstDayOfMonth);
    date.setDate(date.getDate() - i - 1);
    calendarDays.push({ date, isCurrentMonth: false });
  }

  // 현재 달의 날들
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    calendarDays.push({ date, isCurrentMonth: true });
  }

  // 다음 달의 첫 번째 날들 (42개까지 채우기)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      day
    );
    calendarDays.push({ date, isCurrentMonth: false });
  }

  // 날짜를 YYYY-MM-DD 형식으로 변환 (한국 시간 기준)
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 해당 날짜에 출석 기록이 있는지 확인 및 카운트 반환
  const getAttendanceInfo = (date: Date) => {
    const dateStr = formatDate(date);
    const summary = attendanceSummary.find((item) => item.date === dateStr);
    return summary
      ? { hasAttendance: true, count: summary.count }
      : { hasAttendance: false, count: 0 };
  };

  // 모임을 장소_시간으로 그룹화하는 함수
  const groupMeetingsByLocationAndTime = (
    records: AttendanceRecord[]
  ): MeetingGroup[] => {
    const groups: { [key: string]: AttendanceRecord[] } = {};

    records.forEach((record) => {
      const time = new Date(record.checkInTime).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const groupKey = `${record.location}_${time}`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(record);
    });

    return Object.entries(groups).map(([groupKey, groupRecords]) => {
      const [location, time] = groupKey.split("_");
      return {
        groupName: groupKey,
        location,
        time,
        records: groupRecords,
      };
    });
  };

  // 필터링된 출석 기록
  const filteredRecords = selectedDateDetails.filter(
    (record: AttendanceRecord) => {
      const matchesSearch =
        record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  // 그룹화된 모임 데이터
  const groupedMeetings = groupMeetingsByLocationAndTime(filteredRecords);

  // 월별 데이터 불러오기
  const fetchMonthlyData = async (year: number, month: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/attendance?crewId=${crewId}&year=${year}&month=${month}`
      );

      if (!response.ok) {
        throw new Error("출석 데이터를 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      setAttendanceSummary(data.summary || []);
      setAttendanceDetailData(data.detailData || {});
    } catch (error) {
      //console.error("월별 데이터 조회 오류:", error);
      setNoticeModal({
        isOpen: true,
        title: "오류 발생",
        content: "출석 데이터를 불러오는데 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 월 변경
  const changeMonth = async (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedDateDetails([]);

    // 새로운 월의 데이터 불러오기
    await fetchMonthlyData(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = async (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;

    const dateStr = formatDate(date);
    const attendanceInfo = getAttendanceInfo(date);

    if (attendanceInfo.hasAttendance) {
      setIsLoading(true);
      setSelectedDate(dateStr);

      // 캐시된 데이터가 있으면 사용, 없으면 API 호출
      const cachedData = attendanceDetailData[dateStr];
      if (cachedData) {
        setSelectedDateDetails(cachedData);
        setIsLoading(false);
      } else {
        try {
          // 실시간으로 해당 날짜의 상세 데이터 조회
          const response = await fetch(
            `/api/admin/attendance/daily?crewId=${crewId}&date=${dateStr}`
          );

          if (response.ok) {
            const data = await response.json();
            setSelectedDateDetails(data.records || []);

            // 캐시에 저장
            setAttendanceDetailData((prev) => ({
              ...prev,
              [dateStr]: data.records || [],
            }));
          } else {
            throw new Error("상세 데이터 조회 실패");
          }
        } catch (error) {
          //console.error("날짜별 상세 데이터 조회 오류:", error);
          setSelectedDateDetails([]);
          setNoticeModal({
            isOpen: true,
            title: "오류 발생",
            content: "해당 날짜의 상세 정보를 불러오는데 실패했습니다.",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // 출석 기록 삭제 핸들러 (API 라우트 사용)
  const handleCancelAttendance = async (recordId: string) => {
    if (isDeletingRecord) return; // 이미 삭제 중인 경우 중복 실행 방지

    setIsDeletingRecord(recordId);

    try {
      const response = await fetch(
        `/api/admin/attendance/delete?recordId=${recordId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // 성공 시 로컬 상태에서 해당 기록 제거
        const updatedDetails = selectedDateDetails.filter(
          (record) => record.id !== recordId
        );
        setSelectedDateDetails(updatedDetails);

        // 달력 출석 요약 데이터 업데이트 (카운트 감소)
        if (selectedDate) {
          setAttendanceSummary((prevSummary) => {
            const updatedSummary = [...prevSummary];
            const summaryIndex = updatedSummary.findIndex(
              (s) => s.date === selectedDate
            );

            if (summaryIndex !== -1) {
              const newCount = updatedSummary[summaryIndex].count - 1;
              if (newCount > 0) {
                // 카운트가 0보다 크면 업데이트
                updatedSummary[summaryIndex] = {
                  ...updatedSummary[summaryIndex],
                  count: newCount,
                };
              } else {
                // 카운트가 0이면 해당 날짜 항목 제거
                updatedSummary.splice(summaryIndex, 1);
              }
            }

            return updatedSummary;
          });

          // 캐시된 상세 데이터도 업데이트
          setAttendanceDetailData((prev) => ({
            ...prev,
            [selectedDate]: updatedDetails,
          }));
        }

        setNoticeModal({
          isOpen: true,
          title: "삭제 완료",
          content: "출석 기록이 성공적으로 삭제되었습니다.",
        });
      } else {
        //console.error("출석 기록 삭제 실패:", result.error);
        setNoticeModal({
          isOpen: true,
          title: "삭제 실패",
          content:
            result.error ||
            "출석 기록 삭제에 실패했습니다.\n다시 시도해주세요.",
        });
      }
    } catch (error) {
      //console.error("출석 기록 삭제 중 오류:", error);
      setNoticeModal({
        isOpen: true,
        title: "오류 발생",
        content:
          "출석 기록 삭제 중 네트워크 오류가 발생했습니다.\n다시 시도해주세요.",
      });
    } finally {
      setIsDeletingRecord(null);
    }
  };

  // 출석 정보 수정 핸들러
  const handleEditAttendance = (record: AttendanceRecord) => {
    setSelectedAttendance(record);
    setEditModalOpen(true);
  };

  // 출석 정보 저장 핸들러 (API 라우트 사용)
  const handleSaveAttendanceInfo = async (attendanceData: {
    checkInTime: string;
    location: string;
    isHost: boolean;
  }) => {
    if (!selectedAttendance) return;

    try {
      const response = await fetch("/api/admin/attendance/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId: selectedAttendance.id,
          updates: attendanceData,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        //console.error("출석 정보 업데이트 실패:", result.error);
        setNoticeModal({
          isOpen: true,
          title: "수정 실패",
          content:
            result.error ||
            "출석 정보 수정에 실패했습니다.\n다시 시도해주세요.",
        });
        return;
      }

      // 원래 날짜와 새로운 날짜 확인
      const originalDate = selectedAttendance.checkInTime.split("T")[0];
      const newDate = attendanceData.checkInTime.split("T")[0];
      const isDateChanged = originalDate !== newDate;

      // 로컬 상태 업데이트
      if (isDateChanged) {
        // 날짜가 변경된 경우: 현재 목록에서 제거
        const updatedDetails = selectedDateDetails.filter(
          (record) => record.id !== selectedAttendance.id
        );
        setSelectedDateDetails(updatedDetails);

        // 달력 출석 요약 업데이트
        setAttendanceSummary((prevSummary) => {
          const updatedSummary = [...prevSummary];

          // 원래 날짜의 카운트 -1
          const originalSummaryIndex = updatedSummary.findIndex(
            (s) => s.date === originalDate
          );
          if (originalSummaryIndex !== -1) {
            const newCount = updatedSummary[originalSummaryIndex].count - 1;
            if (newCount > 0) {
              updatedSummary[originalSummaryIndex] = {
                ...updatedSummary[originalSummaryIndex],
                count: newCount,
              };
            } else {
              updatedSummary.splice(originalSummaryIndex, 1);
            }
          }

          // 새로운 날짜의 카운트 +1
          const newSummaryIndex = updatedSummary.findIndex(
            (s) => s.date === newDate
          );
          if (newSummaryIndex !== -1) {
            updatedSummary[newSummaryIndex] = {
              ...updatedSummary[newSummaryIndex],
              count: updatedSummary[newSummaryIndex].count + 1,
            };
          } else {
            updatedSummary.push({ date: newDate, count: 1 });
          }

          return updatedSummary;
        });

        // 캐시된 상세 데이터 업데이트
        setAttendanceDetailData((prev) => ({
          ...prev,
          [originalDate]: updatedDetails,
        }));
      } else {
        // 같은 날짜 내에서 수정: 기존 로직 유지
        setSelectedDateDetails((prevDetails) =>
          prevDetails.map((record) =>
            record.id === selectedAttendance.id
              ? {
                  ...record,
                  checkInTime: attendanceData.checkInTime,
                  location: attendanceData.location,
                  isHost: attendanceData.isHost,
                }
              : record
          )
        );

        // 캐시된 상세 데이터도 업데이트
        if (selectedDate) {
          setAttendanceDetailData((prev) => ({
            ...prev,
            [selectedDate]: selectedDateDetails.map((record) =>
              record.id === selectedAttendance.id
                ? {
                    ...record,
                    checkInTime: attendanceData.checkInTime,
                    location: attendanceData.location,
                    isHost: attendanceData.isHost,
                  }
                : record
            ),
          }));
        }
      }

      setEditModalOpen(false);
      setSelectedAttendance(null);

      setNoticeModal({
        isOpen: true,
        title: "수정 완료",
        content: isDateChanged
          ? "출석 정보가 성공적으로 수정되었습니다.\n날짜가 변경되어 해당 출석 기록이 새로운 날짜로 이동되었습니다."
          : "출석 정보가 성공적으로 수정되었습니다.",
      });
    } catch (error) {
      //console.error("출석 정보 업데이트 오류:", error);
      setNoticeModal({
        isOpen: true,
        title: "오류 발생",
        content:
          "출석 정보 수정 중 네트워크 오류가 발생했습니다.\n다시 시도해주세요.",
      });
    }
  };

  const getStatusBadge = (status: string, isHost: boolean) => {
    if (isHost) {
      return (
        <Badge className='text-purple-800 bg-purple-100 hover:bg-purple-100'>
          벙주
        </Badge>
      );
    }

    switch (status) {
      case "present":
        return (
          <Badge className='text-green-800 bg-green-100 hover:bg-green-100'>
            출석
          </Badge>
        );
      case "absent":
        return (
          <Badge className='text-red-800 bg-red-100 hover:bg-red-100'>
            결석
          </Badge>
        );
      default:
        return <Badge variant='secondary'>알 수 없음</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case "absent":
        return <X className='w-4 h-4 text-red-600' />;
      default:
        return null;
    }
  };

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className='flex flex-col h-screen bg-basic-black'>
      {/* 탭 네비게이션 */}
      <div className='flex-shrink-0 px-4 pt-4'>
        <div className='bg-basic-black-gray rounded-[0.75rem] p-[1vw] shadow-sm'>
          <div className='flex rounded-[0.5rem] bg-basic-gray/30 p-[0.5vw]'>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 py-[2vh] px-[2vw] rounded-[0.5rem] text-[0.875rem] font-medium transition-all ${
                activeTab === "calendar"
                  ? "bg-basic-blue text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Calendar className='w-[1rem] h-[1rem] mr-[1vw] inline' />
              달력
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`flex-1 py-[2vh] px-[2vw] rounded-[0.5rem] text-[0.875rem] font-medium transition-all ${
                activeTab === "manage"
                  ? "bg-basic-blue text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <UserPlus className='w-[1rem] h-[1rem] mr-[1vw] inline' />
              관리
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 - 스크롤 가능, 하단 바텀에 가려지지 않게 pb-24 적용 */}
      <div className='overflow-y-auto flex-1 px-4 py-6 pb-24'>
        {activeTab === "calendar" && (
          <div className='space-y-6'>
            {/* 월별 달력 - 높이를 80%로 조정 */}
            <Card className='border-0 bg-basic-black-gray'>
              <CardContent className='p-4'>
                {/* 달력 헤더 */}
                <div className='flex justify-between items-center mb-4'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => changeMonth("prev")}
                    className='w-8 h-8 text-white hover:bg-basic-gray'
                  >
                    <ChevronLeft className='w-4 h-4' />
                  </Button>
                  <h2 className='text-lg font-semibold text-white'>
                    {currentDate.getFullYear()}년{" "}
                    {monthNames[currentDate.getMonth()]}
                  </h2>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => changeMonth("next")}
                    className='w-8 h-8 text-white hover:bg-basic-gray'
                  >
                    <ChevronRight className='w-4 h-4' />
                  </Button>
                </div>

                {/* 요일 헤더 */}
                <div className='grid grid-cols-7 gap-1 mb-2'>
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className='py-2 text-xs font-medium text-center text-gray-400'
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 달력 날짜들 - 높이를 80%로 조정 */}
                <div
                  className='grid grid-cols-7 gap-1'
                  style={{ height: "80%" }}
                >
                  {calendarDays.map((dayInfo, index) => {
                    const { date, isCurrentMonth } = dayInfo;
                    const dateStr = formatDate(date);
                    const attendanceInfo = getAttendanceInfo(date);
                    const isSelected = selectedDate === dateStr;
                    const isToday = formatDate(new Date()) === dateStr;

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date, isCurrentMonth)}
                        disabled={
                          !isCurrentMonth || !attendanceInfo.hasAttendance
                        }
                        className={`
                        relative h-10 w-full text-sm rounded-lg transition-colors flex flex-col items-center justify-center
                        ${
                          !isCurrentMonth
                            ? "text-gray-500 cursor-not-allowed"
                            : attendanceInfo.hasAttendance
                            ? "text-white hover:bg-basic-blue/20 cursor-pointer"
                            : "text-gray-500 cursor-not-allowed"
                        }
                        ${
                          isSelected
                            ? "bg-basic-blue text-white font-medium"
                            : ""
                        }
                        ${
                          isToday && !isSelected
                            ? "bg-basic-gray text-white font-medium"
                            : ""
                        }
                      `}
                      >
                        <span className='text-sm'>{date.getDate()}</span>
                        {attendanceInfo.hasAttendance && (
                          <div className='flex items-center space-x-1 mt-0.5'>
                            <div className='w-1.5 h-1.5 bg-basic-blue rounded-full'></div>
                            <span className='text-xs font-medium text-basic-blue'>
                              {attendanceInfo.count}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 범례 */}
                <div className='flex justify-center items-center mt-4 text-xs text-gray-400'>
                  <div className='flex items-center space-x-1'>
                    <div className='w-1.5 h-1.5 bg-basic-blue rounded-full'></div>
                    <span>출석 기록 (숫자: 출석자 수)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 로딩 상태 */}
            {isLoading && (
              <Card className='border-0 bg-basic-black-gray'>
                <CardContent className='p-4'>
                  <div className='text-center'>
                    <div className='mx-auto mb-2 w-8 h-8 rounded-full border-b-2 animate-spin border-basic-blue'></div>
                    <p className='text-sm text-gray-400'>
                      출석 정보를 불러오는 중...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 선택된 날짜의 출석 기록 */}
            {selectedDate && !isLoading && (
              <>
                {/* 선택된 날짜 정보 - 모임 건수와 출석 건수만 표시 */}
                <Card className='border-0 bg-basic-black-gray'>
                  <CardContent className='p-4'>
                    <div className='text-center'>
                      <h3 className='mb-2 text-lg font-semibold text-white'>
                        {new Date(selectedDate).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}{" "}
                        출석 현황
                      </h3>
                      <div className='flex justify-center space-x-8'>
                        <div className='text-center'>
                          <p className='text-2xl font-bold text-basic-blue'>
                            {groupedMeetings.length}
                          </p>
                          <p className='text-xs text-gray-400'>모임 건수</p>
                        </div>
                        <div className='text-center'>
                          <p className='text-2xl font-bold text-green-400'>
                            {selectedDateDetails.length}
                          </p>
                          <p className='text-xs text-gray-400'>출석 건수</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 검색 */}
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
                  <Input
                    placeholder='이름 또는 장소로 검색'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 text-white rounded-lg border-0 bg-basic-black-gray placeholder:text-gray-400'
                  />
                </div>

                {/* 모임별 그룹화된 출석 기록 목록 */}
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <h3 className='text-lg font-semibold text-white'>
                      모임별 출석 목록
                    </h3>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setSelectedDate(null);
                        setSelectedDateDetails([]);
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                      className='text-white'
                    >
                      닫기
                    </Button>
                  </div>

                  {groupedMeetings.map((meeting, groupIndex) => (
                    <Card
                      key={groupIndex}
                      className='border-0 bg-basic-black-gray'
                    >
                      <CardContent className='p-4'>
                        {/* 모임 그룹 헤더 */}
                        <div className='flex items-center pb-2 mb-3 space-x-2 border-b border-basic-gray'>
                          <div className='flex items-center space-x-2'>
                            <MapPin className='w-4 h-4 text-basic-blue' />
                            <span className='font-medium text-white'>
                              {meeting.location}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Clock className='w-4 h-4 text-gray-400' />
                            <span className='text-sm text-gray-300'>
                              {meeting.time}
                            </span>
                          </div>
                          <Badge
                            variant='outline'
                            className='ml-auto text-white bg-basic-gray border-basic-gray'
                          >
                            {meeting.records.length}명
                          </Badge>
                        </div>

                        {/* 해당 모임의 출석자 목록 */}
                        <div className='space-y-3'>
                          {meeting.records.map((record) => (
                            <div
                              key={record.id}
                              className='flex justify-between items-center'
                            >
                              <div className='flex flex-1 items-center space-x-3'>
                                <div className='flex-1 min-w-0'>
                                  <div className='flex items-center mb-1 space-x-2'>
                                    <h4 className='font-medium text-white'>
                                      {record.userName}
                                    </h4>
                                    {getStatusBadge(
                                      record.status,
                                      record.isHost
                                    )}
                                  </div>
                                  <div className='flex items-center space-x-1'>
                                    {getStatusIcon(record.status)}
                                    <p className='text-sm text-gray-300'>
                                      {new Date(
                                        record.checkInTime
                                      ).toLocaleTimeString("ko-KR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='w-8 h-8'
                                    disabled={isDeletingRecord === record.id}
                                  >
                                    {isDeletingRecord === record.id ? (
                                      <div className='w-4 h-4 rounded-full border-2 border-gray-300 animate-spin border-t-gray-600'></div>
                                    ) : (
                                      <MoreVertical className='w-4 h-4 text-white' />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align='end'
                                  className='w-48 border-0 bg-basic-black-gray'
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleEditAttendance(record)}
                                    disabled={isDeletingRecord === record.id}
                                    className='text-white hover:bg-basic-gray'
                                  >
                                    <Edit className='mr-2 w-4 h-4' />
                                    정보 수정
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className='text-red-400 focus:text-red-400 hover:bg-basic-gray'
                                    onClick={() =>
                                      handleCancelAttendance(record.id)
                                    }
                                    disabled={isDeletingRecord === record.id}
                                  >
                                    {isDeletingRecord === record.id ? (
                                      <>
                                        <div className='mr-2 w-4 h-4 rounded-full border-2 border-red-300 animate-spin border-t-red-600'></div>
                                        삭제 중...
                                      </>
                                    ) : (
                                      <>
                                        <X className='mr-2 w-4 h-4' />
                                        출석 취소
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {groupedMeetings.length === 0 && (
                    <div className='py-8 text-center'>
                      <p className='text-gray-400'>출석 기록이 없습니다.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 달력 사용 안내 */}
            {!selectedDate && !isLoading && (
              <Card className='border-0 bg-basic-black-gray'>
                <CardContent className='p-4'>
                  <div className='text-center text-gray-400'>
                    <Calendar className='mx-auto mb-2 w-8 h-8 text-gray-500' />
                    <p className='text-sm'>
                      달력에서 파란색 점과 숫자가 있는 날짜를 클릭하면
                    </p>
                    <p className='text-sm'>
                      해당 날짜의 출석 기록을 확인할 수 있습니다.
                    </p>
                    <p className='mt-2 text-xs text-gray-500'>
                      숫자는 해당 날짜의 총 출석자 수입니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 관리 탭 */}
        {activeTab === "manage" && <BulkAttendanceManagement crewId={crewId} />}
      </div>

      <AdminBottomNavigation />

      {/* 출석 정보 수정 모달 */}
      {selectedAttendance && (
        <AttendanceEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedAttendance(null);
          }}
          attendance={selectedAttendance}
          onSave={handleSaveAttendanceInfo}
          crewId={crewId}
        />
      )}

      {/* 알림 모달 */}
      <NoticeModal
        isOpen={noticeModal.isOpen}
        onClose={() => setNoticeModal({ ...noticeModal, isOpen: false })}
        title={noticeModal.title}
        content={noticeModal.content}
      />
    </div>
  );
}
