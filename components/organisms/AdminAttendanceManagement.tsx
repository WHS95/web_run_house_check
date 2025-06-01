"use client";

import React, { useState } from "react";
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
  Clock,
  CheckCircle,
  Search,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";

// 출석 기록 타입 정의
export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkInTime: string;
  location: string;
  exerciseType: string;
  status: "present" | "late" | "absent";
  isHost: boolean;
}

// 날짜별 출석 요약 타입 (서버에서 받을 데이터)
export interface AttendanceSummary {
  date: string; // yyyy-mm-dd 형식
  count: number; // 출석자 수
}

// 날짜별 출석 상세 데이터 타입
export type AttendanceDetailData = {
  [key: string]: AttendanceRecord[];
};

// Props 타입 정의
interface AdminAttendanceManagementProps {
  attendanceSummary: AttendanceSummary[];
  attendanceDetailData: AttendanceDetailData;
}

export default function AdminAttendanceManagement({
  attendanceSummary,
  attendanceDetailData,
}: AdminAttendanceManagementProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateDetails, setSelectedDateDetails] = useState<
    AttendanceRecord[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

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

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // 해당 날짜에 출석 기록이 있는지 확인 및 카운트 반환
  const getAttendanceInfo = (date: Date) => {
    const dateStr = formatDate(date);
    const summary = attendanceSummary.find((item) => item.date === dateStr);
    return summary
      ? { hasAttendance: true, count: summary.count }
      : { hasAttendance: false, count: 0 };
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

  // 월 변경
  const changeMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedDateDetails([]);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = async (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;

    const dateStr = formatDate(date);
    const attendanceInfo = getAttendanceInfo(date);

    if (attendanceInfo.hasAttendance) {
      setIsLoading(true);
      setSelectedDate(dateStr);

      setTimeout(() => {
        const detailData = attendanceDetailData[dateStr] || [];
        setSelectedDateDetails(detailData);
        setIsLoading(false);
      }, 500);
    }
  };

  const handleCancelAttendance = (recordId: string) => {
    const updatedDetails = selectedDateDetails.filter(
      (record) => record.id !== recordId
    );
    setSelectedDateDetails(updatedDetails);
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
      case "late":
        return (
          <Badge className='text-yellow-800 bg-yellow-100 hover:bg-yellow-100'>
            지각
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
      case "late":
        return <Clock className='w-4 h-4 text-yellow-600' />;
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
    <div className='flex flex-col h-screen'>
      {/* 헤더 */}
      <div className='px-4 py-6 bg-white border-b border-gray-200'>
        <div className='max-w-md mx-auto'>
          <h1 className='text-2xl font-bold text-gray-900'>출석 관리</h1>
          <p className='mt-1 text-sm text-gray-600'>월별 출석 현황 및 관리</p>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto bg-gray-50'>
        <div className='max-w-md px-4 py-6 mx-auto space-y-6'>
          {/* 월별 달력 */}
          <Card className='ios-card'>
            <CardContent className='p-4'>
              {/* 달력 헤더 */}
              <div className='flex items-center justify-between mb-4'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => changeMonth("prev")}
                  className='w-8 h-8'
                >
                  <ChevronLeft className='w-4 h-4' />
                </Button>
                <h2 className='text-lg font-semibold text-gray-900'>
                  {currentDate.getFullYear()}년{" "}
                  {monthNames[currentDate.getMonth()]}
                </h2>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => changeMonth("next")}
                  className='w-8 h-8'
                >
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>

              {/* 요일 헤더 */}
              <div className='grid grid-cols-7 gap-1 mb-2'>
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className='py-2 text-xs font-medium text-center text-gray-500'
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 달력 날짜들 */}
              <div className='grid grid-cols-7 gap-1'>
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
                        relative h-12 w-full text-sm rounded-lg transition-colors flex flex-col items-center justify-center
                        ${
                          !isCurrentMonth
                            ? "text-gray-300 cursor-not-allowed"
                            : attendanceInfo.hasAttendance
                            ? "text-gray-900 hover:bg-blue-50 cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                        }
                        ${
                          isSelected
                            ? "bg-blue-100 text-blue-600 font-medium"
                            : ""
                        }
                        ${
                          isToday && !isSelected
                            ? "bg-gray-100 font-medium"
                            : ""
                        }
                      `}
                    >
                      <span className='text-sm'>{date.getDate()}</span>
                      {attendanceInfo.hasAttendance && (
                        <div className='flex items-center space-x-1 mt-0.5'>
                          <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
                          <span className='text-xs font-medium text-blue-600'>
                            {attendanceInfo.count}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 범례 */}
              <div className='flex items-center justify-center mt-4 text-xs text-gray-500'>
                <div className='flex items-center space-x-1'>
                  <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
                  <span>출석 기록 (숫자: 출석자 수)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 로딩 상태 */}
          {isLoading && (
            <Card className='ios-card'>
              <CardContent className='p-4'>
                <div className='text-center'>
                  <div className='w-8 h-8 mx-auto mb-2 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  <p className='text-sm text-gray-500'>
                    출석 정보를 불러오는 중...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 선택된 날짜의 출석 기록 */}
          {selectedDate && !isLoading && (
            <>
              {/* 선택된 날짜 정보 */}
              <Card className='ios-card'>
                <CardContent className='p-4'>
                  <div className='text-center'>
                    <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                      {new Date(selectedDate).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                      })}{" "}
                      출석 현황
                    </h3>
                    <div className='flex justify-center space-x-6'>
                      <div className='text-center'>
                        <p className='text-2xl font-bold text-blue-600'>
                          {selectedDateDetails.length}
                        </p>
                        <p className='text-xs text-gray-600'>총 출석</p>
                      </div>
                      <div className='text-center'>
                        <p className='text-2xl font-bold text-green-600'>
                          {
                            selectedDateDetails.filter(
                              (r: AttendanceRecord) => r.status === "present"
                            ).length
                          }
                        </p>
                        <p className='text-xs text-gray-600'>정시 출석</p>
                      </div>
                      <div className='text-center'>
                        <p className='text-2xl font-bold text-yellow-600'>
                          {
                            selectedDateDetails.filter(
                              (r: AttendanceRecord) => r.status === "late"
                            ).length
                          }
                        </p>
                        <p className='text-xs text-gray-600'>지각</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 검색 */}
              <div className='relative'>
                <Search className='absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2' />
                <Input
                  placeholder='이름 또는 장소로 검색'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10 border-gray-200 rounded-2xl'
                />
              </div>

              {/* 상태 필터 */}
              <div className='flex pb-2 space-x-2 overflow-x-auto'>
                {[
                  {
                    key: "all",
                    label: "전체",
                    count: selectedDateDetails.length,
                  },
                  {
                    key: "present",
                    label: "출석",
                    count: selectedDateDetails.filter(
                      (r: AttendanceRecord) => r.status === "present"
                    ).length,
                  },
                  {
                    key: "late",
                    label: "지각",
                    count: selectedDateDetails.filter(
                      (r: AttendanceRecord) => r.status === "late"
                    ).length,
                  },
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={
                      statusFilter === filter.key ? "default" : "outline"
                    }
                    size='sm'
                    className='rounded-full whitespace-nowrap'
                    onClick={() => setStatusFilter(filter.key)}
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>

              {/* 출석 기록 목록 */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    출석 목록
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
                    className='text-gray-500'
                  >
                    닫기
                  </Button>
                </div>

                {filteredRecords.map((record) => (
                  <Card key={record.id} className='ios-card'>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center flex-1 space-x-3'>
                          <Avatar className='w-12 h-12'>
                            <AvatarImage
                              src={`/avatars/${record.userId}.jpg`}
                            />
                            <AvatarFallback className='font-medium text-blue-600 bg-blue-100'>
                              {record.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center mb-1 space-x-2'>
                              <h4 className='font-medium text-gray-900'>
                                {record.userName}
                              </h4>
                              {getStatusBadge(record.status, record.isHost)}
                            </div>
                            <div className='flex items-center mb-1 space-x-1'>
                              {getStatusIcon(record.status)}
                              <p className='text-sm text-gray-600'>
                                {new Date(
                                  record.checkInTime
                                ).toLocaleTimeString("ko-KR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <p className='text-xs text-gray-500'>
                              {record.location} • {record.exerciseType}
                            </p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='w-8 h-8'
                            >
                              <MoreVertical className='w-4 h-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-48'>
                            <DropdownMenuItem
                              className='text-red-600 focus:text-red-600'
                              onClick={() => handleCancelAttendance(record.id)}
                            >
                              <X className='w-4 h-4 mr-2' />
                              출석 취소
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredRecords.length === 0 && (
                  <div className='py-8 text-center'>
                    <p className='text-gray-500'>출석 기록이 없습니다.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 달력 사용 안내 */}
          {!selectedDate && !isLoading && (
            <Card className='ios-card'>
              <CardContent className='p-4'>
                <div className='text-center text-gray-500'>
                  <Calendar className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                  <p className='text-sm'>
                    달력에서 파란색 점과 숫자가 있는 날짜를 클릭하면
                  </p>
                  <p className='text-sm'>
                    해당 날짜의 출석 기록을 확인할 수 있습니다.
                  </p>
                  <p className='mt-2 text-xs text-gray-400'>
                    숫자는 해당 날짜의 총 출석자 수입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AdminBottomNavigation />
    </div>
  );
}
