"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    MoreVertical,
    MapPin,
    Clock,
    Edit,
    UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import MonthNavigator from "@/components/molecules/MonthNavigator";
import AttendanceEditModal from "@/components/molecules/AttendanceEditModal";
import BulkAttendanceManagement from "@/components/organisms/BulkAttendanceManagement";
import type { AttendanceRecord } from "@/lib/supabase/admin";
import { deleteAttendanceRecord } from "@/lib/supabase/admin";
import type { AttendanceRecordWithUser } from "@/lib/admin2/queries";

interface Props {
    initialRecords: AttendanceRecordWithUser[];
    crewId: string;
    year: number;
    month: number;
    day: number;
}

// raw 레코드를 AttendanceRecord로 변환
function toAttendanceRecord(r: AttendanceRecordWithUser): AttendanceRecord {
    return {
        id: r.id,
        userId: r.user_id,
        userName: r.users?.first_name || "이름 없음",
        checkInTime: r.attendance_timestamp,
        location: r.location || "",
        exerciseType: "",
        status: "present",
        isHost: r.is_host,
        deletedAt: r.deleted_at,
    };
}

// 날짜를 YYYY-MM-DD로 포맷
function formatDateStr(date: Date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// KST 날짜 추출 (UTC timestamp → 한국 날짜)
function getKSTDateStr(timestamp: string): string {
    const utcDate = new Date(timestamp);
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    return formatDateStr(kstDate);
}

export default function AttendanceManagement({
    initialRecords,
    crewId,
    year,
    month,
    day,
}: Props) {
    const router = useRouter();
    const pathname = usePathname();

    const [records, setRecords] = useState(initialRecords);
    const [selectedDay, setSelectedDay] = useState(day);
    const [searchTerm, setSearchTerm] = useState("");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] =
        useState<AttendanceRecord | null>(null);
    const [showBulk, setShowBulk] = useState(false);
    const [isDeletingRecord, setIsDeletingRecord] = useState<string | null>(
        null
    );

    // 레코드를 날짜별로 그룹화 (KST 기준)
    const attendanceByDate = useMemo(() => {
        const map: Record<string, AttendanceRecordWithUser[]> = {};
        records.forEach((r) => {
            const dateStr = getKSTDateStr(r.attendance_timestamp);
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(r);
        });
        return map;
    }, [records]);

    // 날짜별 카운트 (캘린더 표시용)
    const dateCounts = useMemo(() => {
        const map: Record<string, number> = {};
        Object.entries(attendanceByDate).forEach(([date, recs]) => {
            map[date] = recs.length;
        });
        return map;
    }, [attendanceByDate]);

    // 선택된 날짜의 출석 데이터
    const selectedDateStr = `${year}-${month.toString().padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
    const selectedDateRecords = useMemo(() => {
        const recs = attendanceByDate[selectedDateStr] || [];
        return recs.map(toAttendanceRecord);
    }, [attendanceByDate, selectedDateStr]);

    // 검색 필터
    const filteredRecords = useMemo(() => {
        if (!searchTerm) return selectedDateRecords;
        const term = searchTerm.toLowerCase();
        return selectedDateRecords.filter(
            (r) =>
                r.userName.toLowerCase().includes(term) ||
                r.location.toLowerCase().includes(term)
        );
    }, [selectedDateRecords, searchTerm]);

    // 모임 그룹화 (장소 + 시간)
    const groupedMeetings = useMemo(() => {
        const groups: Record<string, AttendanceRecord[]> = {};
        filteredRecords.forEach((r) => {
            const time = new Date(r.checkInTime).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
            const key = `${r.location}_${time}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });
        return Object.entries(groups).map(([key, recs]) => {
            const [location, time] = key.split("_");
            return { location, time, records: recs };
        });
    }, [filteredRecords]);

    // 월 네비게이션
    const handlePrevMonth = () => {
        const m = month <= 1 ? 12 : month - 1;
        const y = month <= 1 ? year - 1 : year;
        router.push(`${pathname}?year=${y}&month=${m}&day=1`);
    };
    const handleNextMonth = () => {
        const m = month >= 12 ? 1 : month + 1;
        const y = month >= 12 ? year + 1 : year;
        router.push(`${pathname}?year=${y}&month=${m}&day=1`);
    };

    // 캘린더 생성
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDayOfWeek = firstDay.getDay();

    const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];
    // 이전 달
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const d = new Date(firstDay);
        d.setDate(d.getDate() - i - 1);
        calendarDays.push({ date: d, isCurrentMonth: false });
    }
    // 현재 달
    for (let d = 1; d <= lastDay.getDate(); d++) {
        calendarDays.push({
            date: new Date(year, month - 1, d),
            isCurrentMonth: true,
        });
    }
    // 다음 달 (6주까지)
    const remaining = 42 - calendarDays.length;
    for (let d = 1; d <= remaining; d++) {
        calendarDays.push({
            date: new Date(year, month, d),
            isCurrentMonth: false,
        });
    }

    const handleDeleteRecord = async (recordId: string) => {
        setIsDeletingRecord(recordId);
        try {
            const { success } = await deleteAttendanceRecord(recordId);
            if (success) {
                setRecords((prev) => prev.filter((r) => r.id !== recordId));
            }
        } finally {
            setIsDeletingRecord(null);
        }
    };

    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

    return (
        <div className="flex flex-col flex-1 bg-rh-bg-primary">
            <div className="flex-1 overflow-y-auto px-4 pt-4 scroll-area-bottom space-y-4">
                {/* 월 네비게이터 */}
                <MonthNavigator
                    year={year}
                    month={month}
                    onPrev={handlePrevMonth}
                    onNext={handleNextMonth}
                />

                {/* 캘린더 그리드 */}
                <div className="bg-rh-bg-surface rounded-[12px] p-3">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekdays.map((d) => (
                            <div
                                key={d}
                                className="text-center text-[11px] font-medium text-rh-text-tertiary py-1"
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                            const dateStr = formatDateStr(date);
                            const count = dateCounts[dateStr] || 0;
                            const isSelected =
                                isCurrentMonth &&
                                date.getDate() === selectedDay;
                            const today = new Date();
                            const isToday =
                                isCurrentMonth &&
                                date.getDate() === today.getDate() &&
                                month === today.getMonth() + 1 &&
                                year === today.getFullYear();

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (isCurrentMonth)
                                            setSelectedDay(date.getDate());
                                    }}
                                    className={`relative flex flex-col items-center justify-center h-10 rounded-lg text-xs transition-colors ${
                                        !isCurrentMonth
                                            ? "text-rh-text-muted/30"
                                            : isSelected
                                              ? "bg-rh-accent text-white"
                                              : isToday
                                                ? "bg-rh-accent/20 text-rh-accent"
                                                : "text-white hover:bg-rh-bg-muted/30"
                                    }`}
                                    disabled={!isCurrentMonth}
                                >
                                    <span className="font-medium">
                                        {date.getDate()}
                                    </span>
                                    {count > 0 && isCurrentMonth && (
                                        <span
                                            className={`text-[9px] leading-none ${isSelected ? "text-white/80" : "text-rh-accent"}`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 선택 날짜 출석 현황 */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                        {month}월 {selectedDay}일 출석 현황
                        <span className="ml-1 text-rh-text-secondary">
                            ({selectedDateRecords.length}명)
                        </span>
                    </h3>
                    <button
                        onClick={() => setShowBulk(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-rh-accent rounded-rh-md"
                    >
                        <UserPlus className="w-3 h-3" />
                        일괄등록
                    </button>
                </div>

                {/* 검색바 */}
                {selectedDateRecords.length > 0 && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 w-4 h-4 text-rh-text-secondary transform -translate-y-1/2" />
                        <Input
                            placeholder="이름 또는 장소 검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 text-white bg-rh-bg-surface border border-rh-border rounded-rh-md placeholder:text-rh-text-secondary text-sm"
                        />
                    </div>
                )}

                {/* 모임별 출석 리스트 */}
                {groupedMeetings.length > 0 ? (
                    <div className="space-y-3">
                        {groupedMeetings.map((group, gIdx) => (
                            <div
                                key={gIdx}
                                className="bg-rh-bg-surface rounded-[12px] overflow-hidden"
                            >
                                {/* 모임 헤더 */}
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-rh-border">
                                    <MapPin className="w-3.5 h-3.5 text-rh-accent" />
                                    <span className="text-xs font-medium text-white">
                                        {group.location}
                                    </span>
                                    <Clock className="w-3.5 h-3.5 text-rh-text-tertiary ml-2" />
                                    <span className="text-xs text-rh-text-secondary">
                                        {group.time}
                                    </span>
                                    <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-rh-accent/20 text-rh-accent hover:bg-rh-accent/20">
                                        {group.records.length}명
                                    </Badge>
                                </div>

                                {/* 멤버 리스트 */}
                                <div className="divide-y divide-rh-border/50">
                                    {group.records.map((record) => (
                                        <div
                                            key={record.id}
                                            className="flex items-center gap-3 px-4 py-2.5"
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rh-accent flex items-center justify-center text-xs font-semibold text-white">
                                                {record.userName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-white">
                                                    {record.userName}
                                                </span>
                                                {record.isHost && (
                                                    <Badge className="ml-1.5 text-[9px] px-1 py-0 bg-rh-status-success/20 text-rh-status-success hover:bg-rh-status-success/20">
                                                        호스트
                                                    </Badge>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1">
                                                        <MoreVertical className="w-4 h-4 text-rh-text-secondary" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="border-0 bg-rh-bg-surface"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedAttendance(
                                                                record
                                                            );
                                                            setEditModalOpen(
                                                                true
                                                            );
                                                        }}
                                                        className="text-white hover:bg-rh-bg-muted"
                                                    >
                                                        <Edit className="mr-2 w-4 h-4" />
                                                        수정
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleDeleteRecord(
                                                                record.id
                                                            )
                                                        }
                                                        disabled={
                                                            isDeletingRecord ===
                                                            record.id
                                                        }
                                                        className="text-rh-status-error hover:bg-rh-bg-muted"
                                                    >
                                                        {isDeletingRecord ===
                                                        record.id
                                                            ? "삭제 중..."
                                                            : "삭제"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-rh-text-secondary text-sm">
                            해당 날짜에 출석 기록이 없습니다.
                        </p>
                    </div>
                )}
            </div>

            {/* 수정 모달 */}
            {selectedAttendance && (
                <AttendanceEditModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedAttendance(null);
                    }}
                    attendance={selectedAttendance}
                    crewId={crewId}
                    onSave={async () => {
                        setEditModalOpen(false);
                        setSelectedAttendance(null);
                        router.refresh();
                    }}
                />
            )}

            {/* 일괄 등록 */}
            {showBulk && (
                <BulkAttendanceManagement crewId={crewId} />
            )}
        </div>
    );
}
