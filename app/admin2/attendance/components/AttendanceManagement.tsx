"use client";

import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
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
function toAttendanceRecord(r: AttendanceRecordWithUser): AttendanceRecord {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.users?.first_name || "이름 없음",
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
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getKSTDateStr(timestamp: string): string {
  /* en-CA 로케일은 YYYY-MM-DD 포맷을 기본 출력 */
  return new Date(timestamp).toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
}

function getKSTTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_SHORT = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

/* ── 캘린더 셀 ── */
const CalendarCell = memo(function CalendarCell({
  date,
  isCurrentMonth,
  isSelected,
  isToday,
  isSaturday,
  isMonthStart,
  monthShort,
  count,
  onSelect,
}: {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isSaturday: boolean;
  isMonthStart: boolean;
  monthShort: string;
  count: number;
  onSelect: (day: number) => void;
}) {
  const hasAttendance = count > 0 && isCurrentMonth;
  let cellClass = `relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-lg text-[13px] leading-none transition-colors`;

  if (!isCurrentMonth) {
    cellClass += " text-rh-text-muted";
  } else if (isSelected) {
    cellClass += " bg-rh-accent text-white";
  } else if (isToday) {
    cellClass += " text-rh-accent";
  } else if (isSaturday) {
    cellClass += " text-rh-accent";
  } else {
    cellClass += " text-white hover:bg-rh-bg-muted/30";
  }

  return (
    <button
      onClick={() => {
        if (isCurrentMonth) onSelect(date.getDate());
      }}
      className={cellClass}
      disabled={!isCurrentMonth}
    >
      {/* 오늘: 빈 동그라미(ring) — 홈 히트맵과 동일 패턴, 선택된 날짜와는 겹치지 않음 */}
      {isToday && !isSelected && isCurrentMonth && (
        <span
          aria-hidden
          className="absolute inset-1 rounded-full border-2 border-rh-accent pointer-events-none"
        />
      )}
      {isMonthStart && (
        <span
          className={`absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold leading-none pointer-events-none ${
            isSelected
              ? "text-white"
              : isCurrentMonth
                ? "text-rh-accent"
                : "text-rh-text-muted"
          }`}
        >
          {monthShort}월
        </span>
      )}
      <span>{date.getDate()}</span>
      {hasAttendance && (
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceRecord | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [, setIsDeletingRecord] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    recordId: string;
  }>({ open: false, recordId: "" });

  /* 그룹 아코디언 펼침 상태 (key: `${location}|${time}`)
       달력 모드(월간/주간)는 이 상태에서 자동 파생됨 */
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = useCallback((key: string, rowEl?: HTMLElement | null) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    /* 열릴 때 현재 아코디언 카드가 헤더 아래로 오도록 스크롤 정렬 */
    if (rowEl) {
      requestAnimationFrame(() => {
        rowEl.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, []);

  /* ── 제스처 기반 collapse/expand (iOS native 패턴) ──
       progress: 0=완전 펼침, 1=완전 접힘 (motion value, 손가락 따라 연속 변화)
       - calendar maxHeight/opacity가 progress를 따라 부드럽게 보간
       - 손을 떼면 velocity + 위치 기반으로 0 또는 1로 spring snap
       - scroll listener 없음 → 콘텐츠 길이와 무관하게 동작 */
  const progress = useMotionValue(0);
  const calendarMaxHeight = useTransform(progress, [0, 1], [600, 0]);
  const calendarOpacity = useTransform(progress, [0, 1], [1, 0]);

  /* progress motion value를 React state로 미러
       → isCollapsed 파생 값(아코디언 결합 등)에 사용 */
  const [isProgressCollapsed, setIsProgressCollapsed] = useState(false);
  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      setIsProgressCollapsed(v > 0.5);
    });
    return unsub;
  }, [progress]);

  /* pointer 기반 pan 제스처: 스크롤 가능 여부와 무관하게 작동.
       모드 결정 로직 (iOS gesture recognizer 패턴):
       - 첫 5px 이동 시 방향 + 컨텍스트로 'collapse' 또는 'scroll' 모드 확정
       - 'collapse' 모드: progress 변경 (계속 손가락 따라감)
       - 'scroll' 모드: 아무것도 안 함 (브라우저 네이티브 스크롤이 처리) */
  useEffect(() => {
    const el = document.querySelector(".main-content") as HTMLElement | null;
    if (!el) return;
    let startY = 0;
    let startProgress = 0;
    let startTime = 0;
    let mode: "idle" | "collapse" | "scroll" = "idle";
    const SENSITIVITY = 150;
    const VELOCITY_THRESHOLD = 400; // px/sec

    const onPointerDown = (e: PointerEvent) => {
      startY = e.clientY;
      startTime = e.timeStamp;
      startProgress = progress.get();
      mode = "idle";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.buttons === 0) return;
      const dy = e.clientY - startY;

      if (mode === "idle") {
        if (Math.abs(dy) < 5) return;
        const atTop = el.scrollTop <= 0;
        const cur = progress.get();
        const fingerDown = dy > 0;
        const fingerUp = dy < 0;

        if (cur > 0.5 && fingerDown) {
          /* 접힌 상태에서 아래로 swipe → expand */
          mode = "collapse";
        } else if (cur < 0.5 && atTop && fingerUp) {
          /* 펼친 상태 + 최상단 + 위로 swipe → collapse */
          mode = "collapse";
        } else {
          mode = "scroll";
        }
      }

      if (mode === "collapse") {
        const newProg = Math.max(
          0,
          Math.min(1, startProgress + -dy / SENSITIVITY),
        );
        progress.set(newProg);
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (mode !== "collapse") {
        mode = "idle";
        return;
      }
      const elapsed = e.timeStamp - startTime;
      const dy = e.clientY - startY;
      /* finger up = -dy 양수 = collapse 방향 velocity */
      const velocity = elapsed > 0 ? (-dy / elapsed) * 1000 : 0;
      const cur = progress.get();

      let target = cur > 0.5 ? 1 : 0;
      if (velocity > VELOCITY_THRESHOLD) target = 1;
      else if (velocity < -VELOCITY_THRESHOLD) target = 0;

      animate(progress, target, {
        type: "spring",
        damping: 30,
        stiffness: 350,
      });
      mode = "idle";
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [progress]);

  /* desktop wheel 제스처: trackpad/마우스 휠로도 progress 구동
       - 최상단(scrollTop ≤ 0)에서만 progress에 반영 → 리스트 일반 스크롤 방해 안 함
       - wheel 멈춘 후 150ms 정적이면 spring snap (iOS-like commit) */
  useEffect(() => {
    const el = document.querySelector(".main-content") as HTMLElement | null;
    if (!el) return;
    let endTimer: ReturnType<typeof setTimeout> | null = null;

    const snap = () => {
      const cur = progress.get();
      const target = cur > 0.5 ? 1 : 0;
      if (cur !== target) {
        animate(progress, target, {
          type: "spring",
          damping: 30,
          stiffness: 350,
        });
      }
    };

    const onWheel = (e: WheelEvent) => {
      const cur = progress.get();
      const atTop = el.scrollTop <= 0;
      if (!atTop) return;

      const dy = e.deltaY;
      if (dy > 0 && cur < 1) {
        /* down wheel + 최상단 + 펼친 영역 남음 → collapse */
        progress.set(Math.min(1, cur + dy / 80));
        e.preventDefault();
      } else if (dy < 0 && cur > 0) {
        /* up wheel + 최상단 + 접힌 영역 남음 → expand */
        progress.set(Math.max(0, cur + dy / 80));
        e.preventDefault();
      } else {
        return;
      }

      if (endTimer) clearTimeout(endTimer);
      endTimer = setTimeout(snap, 150);
    };

    el.addEventListener("wheel", onWheel, {
      passive: false,
    });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (endTimer) clearTimeout(endTimer);
    };
  }, [progress]);

  /* 아코디언 펼치면 자동 collapse */
  useEffect(() => {
    if (expandedGroups.size > 0) {
      animate(progress, 1, {
        type: "spring",
        damping: 30,
        stiffness: 350,
      });
    }
  }, [expandedGroups, progress]);

  /* 달력 모드: 아코디언 펼침 OR progress > 0.5 */
  const isCollapsed = expandedGroups.size > 0 || isProgressCollapsed;

  /* hydration 안전: 오늘 날짜는 mount 후 계산 */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /* 날짜별 그룹화 */
  const attendanceByDate = useMemo(() => {
    const map: Record<string, AttendanceRecordWithUser[]> = {};
    records.forEach((r) => {
      const dateStr = getKSTDateStr(r.attendance_timestamp);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(r);
    });
    return map;
  }, [records]);

  const dateCounts = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(attendanceByDate).forEach(([date, recs]) => {
      map[date] = recs.length;
    });
    return map;
  }, [attendanceByDate]);

  /* 선택 날짜 출석 */
  const selectedDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
  const selectedDateRecords = useMemo(
    () => (attendanceByDate[selectedDateStr] || []).map(toAttendanceRecord),
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
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.time !== b.time) return a.time.localeCompare(b.time);
      return a.location.localeCompare(b.location);
    });
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
    router.push(`${pathname}?year=${y}&month=${m}&day=1`);
  }, [month, year, router, pathname]);

  const handleNextMonth = useCallback(() => {
    const m = month >= 12 ? 1 : month + 1;
    const y = month >= 12 ? year + 1 : year;
    router.push(`${pathname}?year=${y}&month=${m}&day=1`);
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

  /* 달 변경 시: 아코디언 모두 닫고 스크롤·달력 모두 리셋 */
  useEffect(() => {
    const el = document.querySelector(".main-content") as HTMLElement | null;
    if (el) el.scrollTop = 0;
    setExpandedGroups(new Set());
    progress.set(0);
  }, [year, month, progress]);

  /* 날짜 변경 시: 아코디언 닫기 (이전 날짜의 그룹 키가 달라질 수 있음) */
  useEffect(() => {
    setExpandedGroups(new Set());
  }, [selectedDay]);

  /* 삭제 */
  const handleDeleteConfirm = useCallback(async () => {
    const { recordId } = deleteDialog;
    setDeleteDialog({ open: false, recordId: "" });
    setIsDeletingRecord(recordId);
    try {
      const { success } = await deleteAttendanceRecord(recordId);
      if (success) {
        setRecords((prev) => prev.filter((r) => r.id !== recordId));
      }
    } finally {
      setIsDeletingRecord(null);
    }
  }, [deleteDialog]);

  /* 행 클릭 → 수정 모달 */
  const handleRowClick = useCallback((record: AttendanceRecord) => {
    setSelectedAttendance(record);
    setEditModalOpen(true);
  }, []);

  /* detail 문자열 생성: 운동종류만 표시
       (장소·시간은 그룹 헤더에서 노출되므로 중복 제거) */
  const buildDetail = useCallback((record: AttendanceRecord) => {
    return record.exerciseType || "";
  }, []);

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
      const isSelected = isCurrentMonth && date.getDate() === selectedDay;
      const todayDate = mounted ? new Date() : null;
      const isToday =
        !!todayDate &&
        isCurrentMonth &&
        date.getDate() === todayDate.getDate() &&
        month === todayDate.getMonth() + 1 &&
        year === todayDate.getFullYear();
      const isSaturday = date.getDay() === 6;
      /* mount 후에만 월 라벨 렌더 → hydration mismatch 방지 */
      const isMonthStart = mounted && date.getDate() === 1;
      const monthShort = MONTH_SHORT[date.getMonth()];
      return (
        <CalendarCell
          key={idx}
          date={date}
          isCurrentMonth={isCurrentMonth}
          isSelected={isSelected}
          isToday={isToday}
          isSaturday={isSaturday}
          isMonthStart={isMonthStart}
          monthShort={monthShort}
          count={count}
          onSelect={setSelectedDay}
        />
      );
    },
    [dateCounts, selectedDay, month, year, mounted],
  );

  return (
    <>
      {/* 월 네비게이터 + 캘린더 + 날짜 라벨 (sticky, 스크롤 시 접힘)
                - bg-rh-bg-primary: 스크롤 시 아래 콘텐츠가 비쳐 보이지 않도록
                - 제목+일괄등록 행도 함께 sticky되어 항상 노출 */}
      <div
        className='sticky top-[calc(env(safe-area-inset-top)+56px)] z-20 px-4 pt-4 bg-rh-bg-primary'
        style={{
          /* 전역 .main-content .sticky GPU 레이어 최적화 오버라이드:
                       내부 높이 변경 시 iOS compositor 레이어 재생성으로
                       흔들림 발생 → transform/will-change 제거 */
          transform: "none",
          willChange: "auto",
          backfaceVisibility: "visible",
          contain: "layout style",
        }}
      >
        {/* 월 네비 + 풀 캘린더
                    motion value(progress)로 maxHeight/opacity가 손가락 따라 연속 변화 */}
        <motion.div
          style={{
            maxHeight: calendarMaxHeight,
            opacity: calendarOpacity,
          }}
          className='overflow-hidden'
        >
          <AdminMonthNav
            year={year}
            month={month}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
          />
          <div className='mt-4 bg-rh-bg-surface rounded-xl p-3 overflow-hidden'>
            {/* 요일 헤더 */}
            <div className='grid grid-cols-7 mb-1'>
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={`text-center text-[11px] font-semibold py-1 ${
                    i === 6 ? "text-rh-accent" : "text-rh-text-tertiary"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className='grid grid-cols-7 gap-1'>
              {calendarDays.map((cd, i) => renderCell(cd, i))}
            </div>
          </div>
        </motion.div>

        {/* 날짜 라벨 + 일괄등록 (항상 sticky 유지)
                    - 접힌 상태에서 탭 시 → 아코디언 닫기 + 스크롤 최상단 복귀
                    - 펼친 상태에서는 비활성 */}
        <div className='flex items-center justify-between py-3'>
          <button
            type='button'
            onClick={() => {
              if (!isCollapsed) return;
              setExpandedGroups(new Set());
              animate(progress, 0, {
                type: "spring",
                damping: 30,
                stiffness: 350,
              });
              const el = document.querySelector(
                ".main-content",
              ) as HTMLElement | null;
              if (el)
                el.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
            }}
            disabled={!isCollapsed}
            className='flex items-center gap-1.5 text-sm font-semibold text-white disabled:opacity-100'
          >
            <span>
              {(year % 100).toString().padStart(2, "0")}.
              {month.toString().padStart(2, "0")}.
              {selectedDay.toString().padStart(2, "0")} ({dayOfWeek})
            </span>
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
              className={`text-rh-text-tertiary transition-transform duration-200 ${
                isCollapsed ? "" : "rotate-180"
              }`}
            >
              <polyline points='6 9 12 15 18 9' />
            </svg>
          </button>
          <button
            type='button'
            onClick={() => setShowBulk(true)}
            aria-label='일괄 등록'
            className='flex items-center justify-center w-8 h-8 rounded-full bg-rh-accent text-white active:opacity-80 transition-opacity'
          >
            <Plus className='w-4 h-4' strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역: 리스트 */}
      <div className='px-4 pt-2 pb-4'>
        {/* 출석 리스트 — (장소, 시간) 아코디언 */}
        {selectedDateRecords.length > 0 ? (
          <div className='space-y-2'>
            {groupedRecords.map((group) => {
              const key = `${group.location}|${group.time}`;
              const isExpanded = expandedGroups.has(key);
              return (
                <section
                  key={key}
                  className='rounded-xl bg-rh-bg-surface overflow-hidden'
                >
                  {/* 아코디언 헤더: 장소 · 시간 · 참여자수
                                        - 열릴 때 해당 카드를 스크롤 최상단으로 정렬 */}
                  <button
                    onClick={(e) => {
                      const section = e.currentTarget.closest(
                        "section",
                      ) as HTMLElement | null;
                      toggleGroup(key, isExpanded ? null : section);
                    }}
                    className='w-full flex items-center gap-2 px-4 py-3 text-left active:bg-rh-bg-muted/20 transition-colors'
                  >
                    <div className='flex-1 flex items-center gap-2 min-w-0'>
                      <h4 className='text-sm font-semibold text-white truncate'>
                        {group.location} · {group.time}
                      </h4>
                      <span className='text-xs text-rh-text-tertiary shrink-0'>
                        {group.records.length}명
                      </span>
                    </div>
                    <svg
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className={`text-rh-text-tertiary shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points='6 9 12 15 18 9' />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className='px-2 pb-2 space-y-2'>
                      {group.records.map((record) => (
                        <AttendanceRow
                          key={record.id}
                          name={record.userName}
                          detail={buildDetail(record)}
                          status='present'
                          badgeText={record.isHost ? "운영진" : undefined}
                          onClick={() => handleRowClick(record)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className='py-8 text-center'>
            <p className='text-rh-text-secondary text-sm'>
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
        title='출석 기록을 삭제하시겠습니까?'
        description='삭제된 기록은 복구할 수 없습니다.'
        cancelLabel='취소'
        confirmLabel='삭제'
        confirmVariant='danger'
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
