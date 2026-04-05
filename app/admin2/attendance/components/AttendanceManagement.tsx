"use client";

import React, {
    useState,
    useMemo,
    useCallback,
    useEffect,
    useRef,
    memo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import AdminSmallButton from "@/app/admin2/components/ui/AdminSmallButton";
import AdminAlertDialog from "@/app/admin2/components/ui/AdminAlertDialog";
import AdminMonthNav from "@/app/admin2/components/ui/AdminMonthNav";
import AttendanceRow from "@/app/admin2/components/ui/AttendanceRow";

const AttendanceEditModal = dynamic(
    () => import("@/components/molecules/AttendanceEditModal"),
);
const AdminBulkAttendanceSheet = dynamic(
    () => import("./AdminBulkAttendanceSheet"),
);
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
/* 스크롤 임계값: 이 값 이상 스크롤되면 달력이 접힘 */
const COLLAPSE_THRESHOLD = 40;

/* ── 캘린더 셀 ── */
const CalendarCell = memo(function CalendarCell({
    date,
    isCurrentMonth,
    isSelected,
    isToday,
    isSaturday,
    count,
    compact,
    onSelect,
}: {
    date: Date;
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
    isSaturday: boolean;
    count: number;
    compact: boolean;
    onSelect: (day: number) => void;
}) {
    /* .pen 기준 색상:
       - 이전/다음 달: text-rh-text-muted
       - 현재 달 일반: text-white
       - 현재 달 토요일: text-rh-accent
       - 선택됨: bg-rh-accent text-white
       - 오늘: bg-rh-accent/20 text-rh-accent */
    /* 셀 높이: 월간/주간 동일 h-11(44px)
       - 월간: 인원 마커(숫자) 별도 노출
       - 주간: 마커 숨기고 참여 있는 날짜는 일자 색상만 변경 */
    const hasAttendance = count > 0 && isCurrentMonth;
    let cellClass =
        `relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-lg text-[13px] leading-none transition-colors`;

    if (!isCurrentMonth) {
        cellClass += " text-rh-text-muted";
    } else if (compact) {
        /* 주간 뷰: 배경 원 없이 텍스트 색상만 변경
           참여 있는 날짜 → 빨간색(rh-status-error, 블루톤 테마) */
        if (isSelected) {
            cellClass += " text-rh-status-error font-bold";
        } else if (hasAttendance) {
            cellClass +=
                " text-rh-status-error font-semibold";
        } else if (isToday) {
            cellClass += " text-rh-accent";
        } else if (isSaturday) {
            cellClass += " text-rh-accent";
        } else {
            cellClass += " text-white";
        }
    } else if (isSelected) {
        cellClass += " bg-rh-accent text-white";
    } else if (isToday) {
        cellClass += " bg-rh-accent/20 text-rh-accent";
    } else if (isSaturday) {
        cellClass += " text-rh-accent";
    } else {
        cellClass += " text-white hover:bg-rh-bg-muted/30";
    }

    return (
        <button
            onClick={() => {
                if (isCurrentMonth)
                    onSelect(date.getDate());
            }}
            className={cellClass}
            disabled={!isCurrentMonth}
        >
            <span>{date.getDate()}</span>
            {!compact && hasAttendance && (
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

    /* router.refresh() 후 서버에서 재수신한 initialRecords를
       로컬 state에 반영 (일괄 등록 후 리스트 갱신 반영) */
    useEffect(() => {
        setRecords(initialRecords);
    }, [initialRecords]);
    const [selectedDay, setSelectedDay] = useState(day);
    const [editModalOpen, setEditModalOpen] =
        useState(false);
    const [selectedAttendance, setSelectedAttendance] =
        useState<AttendanceRecord | null>(null);
    const [showBulk, setShowBulk] = useState(false);
    const [, setIsDeletingRecord] =
        useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        recordId: string;
    }>({ open: false, recordId: "" });

    /* 스크롤 → 달력 접힘 상태 (main-content 스크롤 감지) */
    const [isCollapsed, setIsCollapsed] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    /* 상단 sticky 래퍼(달력+제목행)의 실제 높이를
       측정해 그룹 헤더의 sticky top 값으로 사용한다.
       달력 접힘/펼침에 따라 높이가 달라지므로
       ResizeObserver로 실시간 추적한다. */
    const [stickyHeight, setStickyHeight] = useState(0);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const update = () => {
            setStickyHeight(el.offsetHeight);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    /* hydration 안전: 오늘 날짜는 mount 후 계산 */
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

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
    const selectedDateStr = `${year}-${month
        .toString()
        .padStart(2, "0")}-${selectedDay
        .toString()
        .padStart(2, "0")}`;
    const selectedDateRecords = useMemo(
        () =>
            (attendanceByDate[selectedDateStr] || []).map(
                toAttendanceRecord,
            ),
        [attendanceByDate, selectedDateStr],
    );

    /* (장소, 시간) 기준 그룹화
       - 키: `${location}|${HH:mm}`
       - 정렬: 시간 오름차순 → 장소명 오름차순 */
    const groupedRecords = useMemo(() => {
        const groupMap = new Map<
            string,
            {
                location: string;
                time: string;
                records: AttendanceRecord[];
            }
        >();
        selectedDateRecords.forEach((r) => {
            const time = getKSTTime(r.checkInTime);
            const location = r.location || "장소 미지정";
            const key = `${location}|${time}`;
            const existing = groupMap.get(key);
            if (existing) {
                existing.records.push(r);
            } else {
                groupMap.set(key, {
                    location,
                    time,
                    records: [r],
                });
            }
        });
        return Array.from(groupMap.values()).sort(
            (a, b) => {
                if (a.time !== b.time)
                    return a.time.localeCompare(b.time);
                return a.location.localeCompare(b.location);
            },
        );
    }, [selectedDateRecords]);

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

    /* 캘린더 데이터 (6주 × 7일 = 42칸) */
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

    /* 주간 뷰용: 선택 날짜가 포함된 주(7일)만 추출 */
    const weekDays = useMemo(() => {
        const idx = calendarDays.findIndex(
            (c) =>
                c.isCurrentMonth &&
                c.date.getDate() === selectedDay,
        );
        if (idx < 0) return calendarDays.slice(0, 7);
        const weekStart = Math.floor(idx / 7) * 7;
        return calendarDays.slice(
            weekStart,
            weekStart + 7,
        );
    }, [calendarDays, selectedDay]);

    /* 스크롤 리스너: main-content의 스크롤 감지 → 접힘만 트리거
       (펼침은 사용자 탭/월 변경 시에만 수행하여 의도치 않게 되돌아가는 현상 방지) */
    useEffect(() => {
        const el = document.querySelector(
            ".main-content",
        ) as HTMLElement | null;
        if (!el) return;
        const onScroll = () => {
            const top = el.scrollTop;
            setIsCollapsed((prev) => {
                if (!prev && top > COLLAPSE_THRESHOLD)
                    return true;
                return prev;
            });
        };
        el.addEventListener("scroll", onScroll, {
            passive: true,
        });
        return () =>
            el.removeEventListener("scroll", onScroll);
    }, []);

    /* 달 변경 시 스크롤 리셋 → 달력 펼침 */
    useEffect(() => {
        const el = document.querySelector(
            ".main-content",
        ) as HTMLElement | null;
        if (el) el.scrollTop = 0;
        setIsCollapsed(false);
    }, [year, month]);

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

    /* detail 문자열 생성: 운동종류만 표시
       (장소·시간은 그룹 헤더에서 노출되므로 중복 제거) */
    const buildDetail = useCallback(
        (record: AttendanceRecord) => {
            return record.exerciseType || "";
        },
        [],
    );

    /* 셀 렌더러 */
    const renderCell = useCallback(
        (
            {
                date,
                isCurrentMonth,
            }: {
                date: Date;
                isCurrentMonth: boolean;
            },
            idx: number,
        ) => {
            const dateStr = formatDateStr(date);
            const count = dateCounts[dateStr] || 0;
            const isSelected =
                isCurrentMonth &&
                date.getDate() === selectedDay;
            const todayDate = mounted ? new Date() : null;
            const isToday =
                !!todayDate &&
                isCurrentMonth &&
                date.getDate() === todayDate.getDate() &&
                month === todayDate.getMonth() + 1 &&
                year === todayDate.getFullYear();
            const isSaturday = date.getDay() === 6;
            return (
                <CalendarCell
                    key={idx}
                    date={date}
                    isCurrentMonth={isCurrentMonth}
                    isSelected={isSelected}
                    isToday={isToday}
                    isSaturday={isSaturday}
                    count={count}
                    compact={isCollapsed}
                    onSelect={setSelectedDay}
                />
            );
        },
        [
            dateCounts,
            selectedDay,
            month,
            year,
            mounted,
            isCollapsed,
        ],
    );

    return (
        <>
            {/* 월 네비게이터 + 캘린더 + 날짜 라벨 (sticky, 스크롤 시 접힘)
                - bg-rh-bg-primary: 스크롤 시 아래 콘텐츠가 비쳐 보이지 않도록
                - 제목+일괄등록 행도 함께 sticky되어 항상 노출 */}
            <div
                ref={sentinelRef}
                className="sticky top-[calc(env(safe-area-inset-top)+56px)] z-20 px-4 pt-4 bg-rh-bg-primary"
            >
                <AdminMonthNav
                    year={year}
                    month={month}
                    onPrev={handlePrevMonth}
                    onNext={handleNextMonth}
                />
                <div className="mt-4 bg-rh-bg-surface rounded-xl p-3 overflow-hidden">
                    {/* 요일 헤더 */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAYS.map((d, i) => (
                            <div
                                key={d}
                                className={`text-center text-[11px] font-semibold py-1 ${
                                    i === 6
                                        ? "text-rh-accent"
                                        : "text-rh-text-tertiary"
                                }`}
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* 월간 / 주간 전환 (height 애니메이션) */}
                    {/* 월간 6주(44px × 6 + gap 4px × 5 = 284)
                        / 주간 1주(44px) — 인원 마커가 주간에도
                        노출되므로 h-11 셀 높이에 맞춤 */}
                    <motion.div
                        animate={{
                            height: isCollapsed
                                ? 44
                                : 284,
                        }}
                        initial={false}
                        transition={{
                            duration: 0.25,
                            ease: "easeOut",
                        }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-7 gap-1">
                            {(isCollapsed
                                ? weekDays
                                : calendarDays
                            ).map((cd, i) =>
                                renderCell(cd, i),
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* 날짜 라벨 + 일괄등록 (달력과 함께 sticky 유지)
                    - 라벨 탭 → 달력 펼침/접힘 토글 */}
                <div className="flex items-center justify-between py-3">
                    <button
                        onClick={() =>
                            setIsCollapsed((p) => !p)
                        }
                        className="flex items-center gap-1.5 text-sm font-semibold text-white"
                    >
                        <span>
                            {month}월 {selectedDay}일 (
                            {dayOfWeek}) 출석 현황
                        </span>
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`text-rh-text-tertiary transition-transform duration-200 ${
                                isCollapsed
                                    ? ""
                                    : "rotate-180"
                            }`}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    <AdminSmallButton
                        onClick={() => setShowBulk(true)}
                    >
                        일괄 등록
                    </AdminSmallButton>
                </div>
            </div>

            {/* 콘텐츠 영역: 리스트 */}
            <div className="px-4 pt-2 pb-4">
                {/* 출석 리스트 — (장소, 시간) 기준 그룹화 */}
                {selectedDateRecords.length > 0 ? (
                    <div className="space-y-5">
                        {groupedRecords.map((group) => (
                            <section
                                key={`${group.location}|${group.time}`}
                                className="space-y-2 relative"
                            >
                                {/* 그룹 헤더: 장소 · 시간
                                    네이티브 iOS section header 패턴:
                                    sticky로 스크롤 시 상단 고정되고,
                                    다음 그룹 헤더가 밀어올린다.
                                    top 값은 상단 sticky 래퍼(달력+제목행)의
                                    실제 높이를 ResizeObserver로 측정해 사용.
                                    bg-rh-bg-primary로 스크롤 시 아래 리스트
                                    내용이 비치지 않도록 한다. */}
                                <div
                                    className="sticky z-10 bg-rh-bg-primary flex items-center gap-2 px-1 py-2"
                                    style={{
                                        top: `calc(env(safe-area-inset-top) + 56px + ${stickyHeight}px)`,
                                    }}
                                >
                                    <h4 className="text-sm font-semibold text-rh-text-secondary">
                                        {group.location} ·{" "}
                                        {group.time}
                                    </h4>
                                    <span className="text-xs text-rh-text-tertiary">
                                        {
                                            group.records
                                                .length
                                        }
                                        명
                                    </span>
                                </div>
                                <AnimatedList className="space-y-2">
                                    {group.records.map(
                                        (record) => (
                                            <AnimatedItem
                                                key={
                                                    record.id
                                                }
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
                            </section>
                        ))}
                        {/* 스크롤 여유 공간 (접힘 트리거용, 임계 40px 초과) */}
                        <div className="h-12" />
                    </div>
                ) : (
                    <>
                        <div className="py-8 text-center">
                            <p className="text-rh-text-secondary text-sm">
                                해당 날짜에 출석 기록이
                                없습니다.
                            </p>
                        </div>
                        {/* 스크롤 여유 공간 (접힘 트리거용) */}
                        <div className="h-[60vh]" />
                    </>
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
                <AdminBulkAttendanceSheet
                    crewId={crewId}
                    initialDate={selectedDateStr}
                    onClose={() => setShowBulk(false)}
                    onSuccess={() => {
                        setShowBulk(false);
                        router.refresh();
                    }}
                />
            )}
        </>
    );
}
