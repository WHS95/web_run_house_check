"use client";

import React, {
    useState,
    useMemo,
    useCallback,
    memo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import {
    AdminMonthNav,
    AdminSmallButton,
    AdminAlertDialog,
    AttendanceRow,
} from "@/app/admin2/components/ui";
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

/* ── 유틸 ── */
function toAttendanceRecord(
    r: AttendanceRecordWithUser,
): AttendanceRecord {
    return {
        id: r.id,
        userId: r.user_id,
        userName:
            r.users?.first_name || "이름 없음",
        checkInTime: r.attendance_timestamp,
        location: r.location || "",
        exerciseType: r.exercise_type_name || "기타",
        status: "present",
        isHost: r.is_host,
        deletedAt: r.deleted_at,
    };
}

function formatDateStr(date: Date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1)
        .toString()
        .padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getKSTDateStr(timestamp: string): string {
    const utcDate = new Date(timestamp);
    const kstDate = new Date(
        utcDate.getTime() + 9 * 60 * 60 * 1000,
    );
    return formatDateStr(kstDate);
}

function getKSTTime(timestamp: string): string {
    const utcDate = new Date(timestamp);
    const kstDate = new Date(
        utcDate.getTime() + 9 * 60 * 60 * 1000,
    );
    return kstDate.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/* ── 캘린더 셀 ── */
const CalendarCell = memo(function CalendarCell({
    date,
    isCurrentMonth,
    isSelected,
    isToday,
    count,
    onSelect,
}: {
    date: Date;
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
    count: number;
    onSelect: (day: number) => void;
}) {
    return (
        <button
            onClick={() => {
                if (isCurrentMonth)
                    onSelect(date.getDate());
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
});

/* ── 메인 ── */
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
    const [editModalOpen, setEditModalOpen] =
        useState(false);
    const [selectedAttendance, setSelectedAttendance] =
        useState<AttendanceRecord | null>(null);
    const [showBulk, setShowBulk] = useState(false);
    const [isDeletingRecord, setIsDeletingRecord] =
        useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        recordId: string;
    }>({ open: false, recordId: "" });

    /* 날짜별 그룹화 */
    const attendanceByDate = useMemo(() => {
        const map: Record<
            string,
            AttendanceRecordWithUser[]
        > = {};
        records.forEach((r) => {
            const dateStr = getKSTDateStr(
                r.attendance_timestamp,
            );
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(r);
        });
        return map;
    }, [records]);

    const dateCounts = useMemo(() => {
        const map: Record<string, number> = {};
        Object.entries(attendanceByDate).forEach(
            ([date, recs]) => {
                map[date] = recs.length;
            },
        );
        return map;
    }, [attendanceByDate]);

    /* 선택 날짜 출석 */
    const selectedDateStr = `${year}-${month.toString().padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
    const selectedDateRecords = useMemo(
        () =>
            (attendanceByDate[selectedDateStr] || []).map(
                toAttendanceRecord,
            ),
        [attendanceByDate, selectedDateStr],
    );

    /* 요일 문자열 */
    const dayOfWeek = useMemo(() => {
        const d = new Date(year, month - 1, selectedDay);
        return WEEKDAYS[d.getDay()];
    }, [year, month, selectedDay]);

    /* 월 네비게이션 */
    const handlePrevMonth = useCallback(() => {
        const m = month <= 1 ? 12 : month - 1;
        const y = month <= 1 ? year - 1 : year;
        router.push(
            `${pathname}?year=${y}&month=${m}&day=1`,
        );
    }, [month, year, router, pathname]);

    const handleNextMonth = useCallback(() => {
        const m = month >= 12 ? 1 : month + 1;
        const y = month >= 12 ? year + 1 : year;
        router.push(
            `${pathname}?year=${y}&month=${m}&day=1`,
        );
    }, [month, year, router, pathname]);

    /* 캘린더 데이터 */
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startDayOfWeek = firstDay.getDay();
        const days: {
            date: Date;
            isCurrentMonth: boolean;
        }[] = [];

        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(firstDay);
            d.setDate(d.getDate() - i - 1);
            days.push({
                date: d,
                isCurrentMonth: false,
            });
        }
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push({
                date: new Date(year, month - 1, d),
                isCurrentMonth: true,
            });
        }
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            days.push({
                date: new Date(year, month, d),
                isCurrentMonth: false,
            });
        }
        return days;
    }, [year, month]);

    const today = useMemo(() => new Date(), []);

    /* 삭제 */
    const handleDeleteConfirm = useCallback(async () => {
        const { recordId } = deleteDialog;
        setDeleteDialog({ open: false, recordId: "" });
        setIsDeletingRecord(recordId);
        try {
            const { success } =
                await deleteAttendanceRecord(recordId);
            if (success) {
                setRecords((prev) =>
                    prev.filter((r) => r.id !== recordId),
                );
            }
        } finally {
            setIsDeletingRecord(null);
        }
    }, [deleteDialog]);

    /* 행 클릭 → 수정 모달 */
    const handleRowClick = useCallback(
        (record: AttendanceRecord) => {
            setSelectedAttendance(record);
            setEditModalOpen(true);
        },
        [],
    );

    /* detail 문자열 생성: 장소 · 운동종류 · 시간 */
    const buildDetail = useCallback(
        (record: AttendanceRecord) => {
            const time = getKSTTime(record.checkInTime);
            return [
                record.location,
                record.exerciseType,
                time,
            ]
                .filter(Boolean)
                .join(" · ");
        },
        [],
    );

    return (
        <>
            <div className="flex-1 px-4 pt-4 pb-4 space-y-4">
                {/* 월 네비게이터 */}
                <AdminMonthNav
                    year={year}
                    month={month}
                    onPrev={handlePrevMonth}
                    onNext={handleNextMonth}
                />

                {/* 캘린더 그리드 */}
                <div className="bg-rh-bg-surface rounded-xl p-3">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {WEEKDAYS.map((d) => (
                            <div
                                key={d}
                                className="text-center text-[11px] font-medium text-rh-text-tertiary py-1"
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map(
                            (
                                {
                                    date,
                                    isCurrentMonth,
                                },
                                idx,
                            ) => {
                                const dateStr =
                                    formatDateStr(date);
                                const count =
                                    dateCounts[
                                        dateStr
                                    ] || 0;
                                const isSelected =
                                    isCurrentMonth &&
                                    date.getDate() ===
                                        selectedDay;
                                const isToday =
                                    isCurrentMonth &&
                                    date.getDate() ===
                                        today.getDate() &&
                                    month ===
                                        today.getMonth() +
                                            1 &&
                                    year ===
                                        today.getFullYear();

                                return (
                                    <CalendarCell
                                        key={idx}
                                        date={date}
                                        isCurrentMonth={
                                            isCurrentMonth
                                        }
                                        isSelected={
                                            isSelected
                                        }
                                        isToday={
                                            isToday
                                        }
                                        count={count}
                                        onSelect={
                                            setSelectedDay
                                        }
                                    />
                                );
                            },
                        )}
                    </div>
                </div>

                {/* 날짜 라벨 + 일괄등록 */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                        {month}월 {selectedDay}일 (
                        {dayOfWeek}) 출석 현황
                    </h3>
                    <AdminSmallButton
                        onClick={() => setShowBulk(true)}
                    >
                        일괄 등록
                    </AdminSmallButton>
                </div>

                {/* 출석 리스트 — .pen AttendanceRow 사용 */}
                {selectedDateRecords.length > 0 ? (
                    <AnimatedList className="space-y-2">
                        {selectedDateRecords.map(
                            (record) => (
                                <AnimatedItem
                                    key={record.id}
                                >
                                    <AttendanceRow
                                        name={
                                            record.userName
                                        }
                                        detail={buildDetail(
                                            record,
                                        )}
                                        status="present"
                                        badgeText={
                                            record.isHost
                                                ? "운영진"
                                                : undefined
                                        }
                                        onClick={() =>
                                            handleRowClick(
                                                record,
                                            )
                                        }
                                    />
                                </AnimatedItem>
                            ),
                        )}
                    </AnimatedList>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-rh-text-secondary text-sm">
                            해당 날짜에 출석 기록이
                            없습니다.
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
                    onDelete={(recordId) => {
                        setEditModalOpen(false);
                        setSelectedAttendance(null);
                        setDeleteDialog({
                            open: true,
                            recordId,
                        });
                    }}
                />
            )}

            {/* 삭제 확인 다이얼로그 */}
            <AdminAlertDialog
                open={deleteDialog.open}
                onClose={() =>
                    setDeleteDialog({
                        open: false,
                        recordId: "",
                    })
                }
                onConfirm={handleDeleteConfirm}
                title="출석 기록을 삭제하시겠습니까?"
                description="삭제된 기록은 복구할 수 없습니다."
                cancelLabel="취소"
                confirmLabel="삭제"
                confirmVariant="danger"
            />

            {/* 일괄 등록 */}
            {showBulk && (
                <BulkAttendanceManagement
                    crewId={crewId}
                />
            )}
        </>
    );
}
