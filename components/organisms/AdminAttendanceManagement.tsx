"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
    MapPin,
    Clock,
    Edit,
    UserPlus,
} from "lucide-react";
import LoadingSpinner from "../atoms/LoadingSpinner";
import MonthNavigator from "@/components/molecules/MonthNavigator";
import AttendanceEditModal from "@/components/molecules/AttendanceEditModal";
import NoticeModal from "@/components/molecules/NoticeModal";
import BulkAttendanceManagement from "@/components/organisms/BulkAttendanceManagement";
import type {
    AttendanceRecord,
    AttendanceSummary,
    AttendanceDetailData,
} from "@/lib/supabase/admin";
import { useAdminContext } from "@/app/admin/AdminContextProvider";

// 모임 그룹 타입 정의
interface MeetingGroup {
    groupName: string;
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
    const [activeTab, setActiveTab] = useState<"calendar" | "manage">(
        "calendar"
    );
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDateDetails, setSelectedDateDetails] = useState<
        AttendanceRecord[]
    >([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeletingRecord, setIsDeletingRecord] = useState<string | null>(
        null
    );
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

    // 날짜를 YYYY-MM-DD 형식으로 변환
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
            const time = new Date(record.checkInTime).toLocaleTimeString(
                "ko-KR",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }
            );
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
                record.userName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                record.location
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
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

            const cachedData = attendanceDetailData[dateStr];
            if (cachedData) {
                setSelectedDateDetails(cachedData);
                setIsLoading(false);
            } else {
                try {
                    const response = await fetch(
                        `/api/admin/attendance/daily?crewId=${crewId}&date=${dateStr}`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        setSelectedDateDetails(data.records || []);

                        setAttendanceDetailData((prev) => ({
                            ...prev,
                            [dateStr]: data.records || [],
                        }));
                    } else {
                        throw new Error("상세 데이터 조회 실패");
                    }
                } catch (error) {
                    setSelectedDateDetails([]);
                    setNoticeModal({
                        isOpen: true,
                        title: "오류 발생",
                        content:
                            "해당 날짜의 상세 정보를 불러오는데 실패했습니다.",
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };

    // 출석 기록 삭제 핸들러
    const handleCancelAttendance = async (recordId: string) => {
        if (isDeletingRecord) return;

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
                const updatedDetails = selectedDateDetails.filter(
                    (record) => record.id !== recordId
                );
                setSelectedDateDetails(updatedDetails);

                if (selectedDate) {
                    setAttendanceSummary((prevSummary) => {
                        const updatedSummary = [...prevSummary];
                        const summaryIndex = updatedSummary.findIndex(
                            (s) => s.date === selectedDate
                        );

                        if (summaryIndex !== -1) {
                            const newCount =
                                updatedSummary[summaryIndex].count - 1;
                            if (newCount > 0) {
                                updatedSummary[summaryIndex] = {
                                    ...updatedSummary[summaryIndex],
                                    count: newCount,
                                };
                            } else {
                                updatedSummary.splice(summaryIndex, 1);
                            }
                        }

                        return updatedSummary;
                    });

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
                setNoticeModal({
                    isOpen: true,
                    title: "삭제 실패",
                    content:
                        result.error ||
                        "출석 기록 삭제에 실패했습니다.\n다시 시도해주세요.",
                });
            }
        } catch (error) {
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

    // 출석 정보 저장 핸들러
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
                setNoticeModal({
                    isOpen: true,
                    title: "수정 실패",
                    content:
                        result.error ||
                        "출석 정보 수정에 실패했습니다.\n다시 시도해주세요.",
                });
                return;
            }

            const originalDate = selectedAttendance.checkInTime.split("T")[0];
            const newDate = attendanceData.checkInTime.split("T")[0];
            const isDateChanged = originalDate !== newDate;

            if (isDateChanged) {
                const updatedDetails = selectedDateDetails.filter(
                    (record) => record.id !== selectedAttendance.id
                );
                setSelectedDateDetails(updatedDetails);

                setAttendanceSummary((prevSummary) => {
                    const updatedSummary = [...prevSummary];

                    const originalSummaryIndex = updatedSummary.findIndex(
                        (s) => s.date === originalDate
                    );
                    if (originalSummaryIndex !== -1) {
                        const newCount =
                            updatedSummary[originalSummaryIndex].count - 1;
                        if (newCount > 0) {
                            updatedSummary[originalSummaryIndex] = {
                                ...updatedSummary[originalSummaryIndex],
                                count: newCount,
                            };
                        } else {
                            updatedSummary.splice(originalSummaryIndex, 1);
                        }
                    }

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

                setAttendanceDetailData((prev) => ({
                    ...prev,
                    [originalDate]: updatedDetails,
                }));
            } else {
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
                <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs">
                    벙주
                </Badge>
            );
        }

        switch (status) {
            case "present":
                return (
                    <Badge className="bg-rh-status-success/20 text-rh-status-success hover:bg-rh-status-success/20 text-xs">
                        출석
                    </Badge>
                );
            case "absent":
                return (
                    <Badge className="bg-rh-status-error/20 text-rh-status-error hover:bg-rh-status-error/20 text-xs">
                        결석
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-rh-bg-muted text-rh-text-secondary text-xs">
                        알 수 없음
                    </Badge>
                );
        }
    };

    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    // 선택된 날짜의 표시 문자열
    const getSelectedDateLabel = () => {
        if (!selectedDate) return "";
        const date = new Date(selectedDate);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = dayNames[date.getDay()];
        return `${month}월 ${day}일 (${weekday}) 출석 현황`;
    };

    return (
        <div className="flex flex-col h-screen bg-rh-bg-primary">
            {/* 탭 네비게이션 */}
            <div className="flex-shrink-0 px-4 pt-4">
                <div className="bg-rh-bg-surface rounded-rh-lg p-1 shadow-sm">
                    <div className="flex rounded-rh-md bg-rh-bg-muted/30 p-0.5">
                        <button
                            onClick={() => setActiveTab("calendar")}
                            className={`flex-1 py-4 px-2 rounded-rh-md text-[0.875rem] font-medium transition-all ${
                                activeTab === "calendar"
                                    ? "bg-rh-accent text-white shadow-sm"
                                    : "text-rh-text-secondary hover:text-white"
                            }`}
                        >
                            <Calendar className="w-[1rem] h-[1rem] mr-1 inline" />
                            달력
                        </button>
                        <button
                            onClick={() => setActiveTab("manage")}
                            className={`flex-1 py-4 px-2 rounded-rh-md text-[0.875rem] font-medium transition-all ${
                                activeTab === "manage"
                                    ? "bg-rh-accent text-white shadow-sm"
                                    : "text-rh-text-secondary hover:text-white"
                            }`}
                        >
                            <UserPlus className="w-[1rem] h-[1rem] mr-1 inline" />
                            관리
                        </button>
                    </div>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="overflow-y-auto flex-1 px-4 py-4 scroll-area-bottom">
                {activeTab === "calendar" && (
                    <div className="space-y-4">
                        {/* MonthNavigator */}
                        <MonthNavigator
                            year={currentDate.getFullYear()}
                            month={currentDate.getMonth() + 1}
                            onPrev={() => changeMonth("prev")}
                            onNext={() => changeMonth("next")}
                            disabled={isLoading}
                        />

                        {/* 달력 그리드 */}
                        <div className="bg-rh-bg-surface rounded-rh-md p-4">
                            {/* 요일 헤더 */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {dayNames.map((day, i) => (
                                    <div
                                        key={day}
                                        className={`py-2 text-xs font-medium text-center ${
                                            i === 0
                                                ? "text-rh-status-error"
                                                : i === 6
                                                ? "text-rh-accent"
                                                : "text-rh-text-secondary"
                                        }`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* 달력 날짜들 */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((dayInfo, index) => {
                                    const { date, isCurrentMonth } = dayInfo;
                                    const dateStr = formatDate(date);
                                    const attendanceInfo =
                                        getAttendanceInfo(date);
                                    const isSelected =
                                        selectedDate === dateStr;
                                    const isToday =
                                        formatDate(new Date()) === dateStr;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                handleDateClick(
                                                    date,
                                                    isCurrentMonth
                                                )
                                            }
                                            disabled={
                                                !isCurrentMonth ||
                                                !attendanceInfo.hasAttendance
                                            }
                                            className={`
                                                relative h-10 w-full text-sm rounded-full transition-colors
                                                flex flex-col items-center justify-center
                                                ${
                                                    !isCurrentMonth
                                                        ? "text-rh-text-tertiary/30"
                                                        : attendanceInfo.hasAttendance
                                                        ? "text-white hover:bg-rh-accent/20 cursor-pointer"
                                                        : "text-rh-text-tertiary"
                                                }
                                                ${
                                                    isSelected
                                                        ? "bg-rh-accent text-white font-semibold"
                                                        : ""
                                                }
                                                ${
                                                    isToday && !isSelected
                                                        ? "text-rh-accent font-semibold"
                                                        : ""
                                                }
                                            `}
                                        >
                                            <span className="text-sm leading-none">
                                                {date.getDate()}
                                            </span>
                                            {attendanceInfo.hasAttendance && (
                                                <div
                                                    className={`w-1 h-1 rounded-full mt-0.5 ${
                                                        isSelected
                                                            ? "bg-white"
                                                            : "bg-rh-accent"
                                                    }`}
                                                ></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 로딩 상태 */}
                        {isLoading && (
                            <div className="bg-rh-bg-surface rounded-rh-md p-6">
                                <div className="text-center">
                                    <LoadingSpinner
                                        size="sm"
                                        color="blue"
                                        className="mx-auto mb-2"
                                    />
                                    <p className="text-sm text-rh-text-secondary">
                                        출석 정보를 불러오는 중...
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 선택된 날짜의 출석 기록 */}
                        {selectedDate && !isLoading && (
                            <>
                                {/* 날짜 헤더 + 일괄 등록 버튼 */}
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-semibold text-white">
                                        {getSelectedDateLabel()}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setSelectedDate(null);
                                            setSelectedDateDetails([]);
                                            setSearchTerm("");
                                            setStatusFilter("all");
                                        }}
                                        className="text-xs text-rh-text-secondary px-3 py-1.5 bg-rh-bg-surface rounded-rh-md"
                                    >
                                        닫기
                                    </button>
                                </div>

                                {/* 통계 요약 */}
                                <div className="flex gap-3">
                                    <div className="flex-1 bg-rh-bg-surface rounded-rh-md px-4 py-3 text-center">
                                        <p className="text-xl font-bold text-rh-accent">
                                            {groupedMeetings.length}
                                        </p>
                                        <p className="text-xs text-rh-text-secondary">
                                            모임
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-rh-bg-surface rounded-rh-md px-4 py-3 text-center">
                                        <p className="text-xl font-bold text-rh-status-success">
                                            {selectedDateDetails.length}
                                        </p>
                                        <p className="text-xs text-rh-text-secondary">
                                            출석
                                        </p>
                                    </div>
                                </div>

                                {/* 검색 */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 w-4 h-4 text-rh-text-secondary transform -translate-y-1/2" />
                                    <Input
                                        placeholder="이름 또는 장소로 검색"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="pl-11 h-10 text-white bg-rh-bg-surface border border-rh-border rounded-rh-md placeholder:text-rh-text-secondary"
                                    />
                                </div>

                                {/* 모임별 그룹화된 출석 기록 목록 */}
                                <div className="space-y-3">
                                    {groupedMeetings.map(
                                        (meeting, groupIndex) => (
                                            <div
                                                key={groupIndex}
                                                className="bg-rh-bg-surface rounded-rh-md p-4"
                                            >
                                                {/* 모임 그룹 헤더 */}
                                                <div className="flex items-center pb-3 mb-3 space-x-2 border-b border-rh-border">
                                                    <div className="flex items-center space-x-2">
                                                        <MapPin className="w-4 h-4 text-rh-accent" />
                                                        <span className="text-sm font-medium text-white">
                                                            {meeting.location}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="w-3 h-3 text-rh-text-secondary" />
                                                        <span className="text-xs text-rh-text-secondary">
                                                            {meeting.time}
                                                        </span>
                                                    </div>
                                                    <Badge className="ml-auto bg-rh-bg-muted text-rh-text-secondary hover:bg-rh-bg-muted text-xs">
                                                        {meeting.records.length}
                                                        명
                                                    </Badge>
                                                </div>

                                                {/* 해당 모임의 출석자 목록 */}
                                                <div className="space-y-2">
                                                    {meeting.records.map(
                                                        (record) => (
                                                            <div
                                                                key={record.id}
                                                                className="flex items-center gap-3"
                                                            >
                                                                {/* 아바타 dot */}
                                                                <div
                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 ${
                                                                        record.isHost
                                                                            ? "bg-purple-500"
                                                                            : "bg-rh-accent"
                                                                    }`}
                                                                >
                                                                    {record.userName.charAt(
                                                                        0
                                                                    )}
                                                                </div>

                                                                {/* 이름 + 메타 */}
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-sm font-medium text-white truncate">
                                                                        {
                                                                            record.userName
                                                                        }
                                                                    </h4>
                                                                    <p className="text-xs text-rh-text-secondary">
                                                                        {new Date(
                                                                            record.checkInTime
                                                                        ).toLocaleTimeString(
                                                                            "ko-KR",
                                                                            {
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                            }
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                {/* 뱃지 */}
                                                                {getStatusBadge(
                                                                    record.status,
                                                                    record.isHost
                                                                )}

                                                                {/* 액션 */}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <button
                                                                            className="p-1 flex-shrink-0"
                                                                            disabled={
                                                                                isDeletingRecord ===
                                                                                record.id
                                                                            }
                                                                        >
                                                                            {isDeletingRecord ===
                                                                            record.id ? (
                                                                                <LoadingSpinner
                                                                                    size="sm"
                                                                                    color="white"
                                                                                />
                                                                            ) : (
                                                                                <MoreVertical className="w-4 h-4 text-rh-text-secondary" />
                                                                            )}
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent
                                                                        align="end"
                                                                        className="w-48 border-0 bg-rh-bg-surface"
                                                                    >
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleEditAttendance(
                                                                                    record
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                isDeletingRecord ===
                                                                                record.id
                                                                            }
                                                                            className="text-white hover:bg-rh-bg-muted"
                                                                        >
                                                                            <Edit className="mr-2 w-4 h-4" />
                                                                            정보
                                                                            수정
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            className="text-red-400 focus:text-red-400 hover:bg-rh-bg-muted"
                                                                            onClick={() =>
                                                                                handleCancelAttendance(
                                                                                    record.id
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                isDeletingRecord ===
                                                                                record.id
                                                                            }
                                                                        >
                                                                            {isDeletingRecord ===
                                                                            record.id ? (
                                                                                <>
                                                                                    <LoadingSpinner
                                                                                        size="sm"
                                                                                        color="red"
                                                                                        className="mr-2"
                                                                                    />
                                                                                    삭제
                                                                                    중...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <X className="mr-2 w-4 h-4" />
                                                                                    출석
                                                                                    취소
                                                                                </>
                                                                            )}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {groupedMeetings.length === 0 && (
                                        <div className="py-8 text-center">
                                            <p className="text-rh-text-secondary">
                                                출석 기록이 없습니다.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 달력 사용 안내 */}
                        {!selectedDate && !isLoading && (
                            <div className="bg-rh-bg-surface rounded-rh-md p-6">
                                <div className="text-center text-rh-text-secondary">
                                    <Calendar className="mx-auto mb-2 w-8 h-8 text-rh-text-tertiary" />
                                    <p className="text-sm">
                                        달력에서 점이 있는 날짜를 탭하면
                                    </p>
                                    <p className="text-sm">
                                        출석 기록을 확인할 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 관리 탭 */}
                {activeTab === "manage" && (
                    <BulkAttendanceManagement crewId={crewId} />
                )}
            </div>

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
                onClose={() =>
                    setNoticeModal({ ...noticeModal, isOpen: false })
                }
                title={noticeModal.title}
                content={noticeModal.content}
            />
        </div>
    );
}
