"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StickyCollapseHeader from "@/components/atoms/StickyCollapseHeader";
import AdminModal from "@/app/admin2/components/ui/AdminModal";

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

export default function YearMonthSelector({
  year,
  month,
  onChange,
  disabled = false,
  pickerOpen: pickerOpenProp,
  onPickerOpenChange,
}: {
  year: number;
  month: number;
  /** 선택 시 커스텀 핸들러. 지정되면 URL 라우팅 대신 호출됨 */
  onChange?: (year: number, month: number) => void;
  disabled?: boolean;
  /** 외부에서 picker 열림 상태를 제어 (controlled). 미지정 시 내부 상태로 fallback */
  pickerOpen?: boolean;
  onPickerOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pickerOpenInternal, setPickerOpenInternal] = useState(false);
  const pickerOpen = pickerOpenProp ?? pickerOpenInternal;

  /* 현재 KST 년도 기준 ±2년 */
  const years = useMemo(() => {
    const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const currentYear = kstNow.getUTCFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  const openPicker = useCallback(() => {
    if (onPickerOpenChange) onPickerOpenChange(true);
    else setPickerOpenInternal(true);
  }, [onPickerOpenChange]);
  const closePicker = useCallback(() => {
    if (onPickerOpenChange) onPickerOpenChange(false);
    else setPickerOpenInternal(false);
  }, [onPickerOpenChange]);

  const navigate = useCallback(
    (y: number, m: number) => {
      if (disabled) return;
      if (onChange) {
        onChange(y, m);
        return;
      }
      router.push(`${pathname}?year=${y}&month=${m}`);
    },
    [router, pathname, onChange, disabled],
  );

  const goPrevMonth = useCallback(() => {
    if (month === 1) {
      navigate(year - 1, 12);
    } else {
      navigate(year, month - 1);
    }
  }, [year, month, navigate]);

  const goNextMonth = useCallback(() => {
    if (month === 12) {
      navigate(year + 1, 1);
    } else {
      navigate(year, month + 1);
    }
  }, [year, month, navigate]);

  /* ── 펼침 모드 (2줄) ── */
  const expandedUI = (
    <div className='space-y-2'>
      {/* 월 네비게이터 */}
      <div className={"flex items-center" + " justify-between h-9"}>
        <button
          onClick={goPrevMonth}
          className={"p-1" + " text-rh-text-tertiary"}
        >
          <ChevronLeft className='w-6 h-6' />
        </button>
        <button
          onClick={openPicker}
          className={
            "text-[17px]" + " font-bold" + " text-white" + " focus:outline-none"
          }
        >
          {year}년 {month}월
        </button>
        <button
          onClick={goNextMonth}
          className={"p-1" + " text-rh-text-tertiary"}
        >
          <ChevronRight className='w-6 h-6' />
        </button>
      </div>

      {/* 월 선택 바 */}
      <div
        className={
          "flex gap-0" + " bg-rh-bg-surface" + " rounded-[12px]" + " h-9 p-0.5"
        }
      >
        {monthOptions.map((m) => (
          <button
            key={m}
            onClick={() => navigate(year, m)}
            className={
              "flex-1 min-w-0" +
              " flex items-center" +
              " justify-center" +
              " rounded-lg" +
              " text-[11px]" +
              " font-medium" +
              " transition-colors" +
              (month === m
                ? " bg-rh-accent" + " text-white" + " font-semibold"
                : " text-rh-text-tertiary")
            }
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );

  /* ── 축소 모드 (< 2026년 4월 >) ── */
  const collapsedUI = (
    <div className={"flex items-center" + " justify-between h-9"}>
      <button
        onClick={goPrevMonth}
        className={"p-1" + " text-rh-text-tertiary"}
      >
        <ChevronLeft className='w-5 h-5' />
      </button>
      <button
        onClick={openPicker}
        className={
          "text-[15px]" + " font-bold text-white" + " focus:outline-none"
        }
      >
        {year}년 {month}월
      </button>
      <button
        onClick={goNextMonth}
        className={"p-1" + " text-rh-text-tertiary"}
      >
        <ChevronRight className='w-5 h-5' />
      </button>
    </div>
  );

  return (
    <>
      <StickyCollapseHeader expanded={expandedUI} collapsed={collapsedUI} />
      <AdminModal
        open={pickerOpen}
        onClose={closePicker}
        // title="년월 선택"
      >
        <div className='flex flex-col gap-5'>
          {/* 년도 선택 */}
          <div>
            <h4
              className={
                "text-[13px]" +
                " font-medium" +
                " text-rh-text-secondary" +
                " mb-3"
              }
            >
              년도
            </h4>
            <div className={"grid grid-cols-5" + " gap-2"}>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    navigate(y, month);
                    closePicker();
                  }}
                  className={
                    "h-9" +
                    " rounded-lg" +
                    " text-[13px]" +
                    " font-medium" +
                    " transition-colors" +
                    (y === year
                      ? " bg-rh-accent" + " text-white"
                      : " bg-rh-bg-muted/40" + " text-rh-text-secondary")
                  }
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* 월 선택 */}
          <div>
            <h4
              className={
                "text-[13px]" +
                " font-medium" +
                " text-rh-text-secondary" +
                " mb-3"
              }
            >
              월
            </h4>
            <div className={"grid grid-cols-4" + " gap-2"}>
              {monthOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    navigate(year, m);
                    closePicker();
                  }}
                  className={
                    "h-10" +
                    " rounded-lg" +
                    " text-[14px]" +
                    " font-medium" +
                    " transition-colors" +
                    (m === month
                      ? " bg-rh-accent" + " text-white"
                      : " bg-rh-bg-muted/40" + " text-rh-text-secondary")
                  }
                >
                  {m}월
                </button>
              ))}
            </div>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
