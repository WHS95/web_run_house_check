"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

interface MonthYearPickerProps {
  selectedYear: number;
  selectedMonth: number;
  onDateChange: (year: number, month: number) => void;
  className?: string;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedYear,
  selectedMonth,
  onDateChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 년도를 기준으로 ±2년 범위 생성
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: 1, label: "1월" },
    { value: 2, label: "2월" },
    { value: 3, label: "3월" },
    { value: 4, label: "4월" },
    { value: 5, label: "5월" },
    { value: 6, label: "6월" },
    { value: 7, label: "7월" },
    { value: 8, label: "8월" },
    { value: 9, label: "9월" },
    { value: 10, label: "10월" },
    { value: 11, label: "11월" },
    { value: 12, label: "12월" },
  ];

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleYearMonthSelect = (year: number, month: number) => {
    onDateChange(year, month);
    setIsOpen(false);
  };

  const formatDisplayText = () => {
    return `${selectedYear}년 ${selectedMonth}월`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 선택된 날짜 표시 및 드롭다운 트리거 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center justify-between w-full text-white text-[1.125rem] font-medium focus:outline-none'
      >
        <span>{formatDisplayText()}</span>
        <FiChevronDown
          className={`w-[1rem] h-[1rem] text-rh-text-secondary transition-transform ${
            isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className='absolute top-full left-0 right-0 mt-2 bg-rh-bg-muted rounded-rh-xl shadow-lg z-50 max-h-[50vh] overflow-hidden'>
          <div className='p-4'>
            {/* 년도 선택 섹션 */}
            <div className='mb-6'>
              <h3 className='text-white text-[0.875rem] mb-4'>년</h3>
              <div className='grid grid-cols-5 gap-2'>
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearMonthSelect(year, selectedMonth)}
                    className={`py-1.5 text-center rounded-rh-md text-[0.875rem] font-medium transition-colors ${
                      year === selectedYear
                        ? "bg-white text-rh-text-inverted"
                        : "text-rh-text-secondary hover:text-white hover:bg-rh-bg-surface"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* 월 선택 섹션 */}
            <div>
              <h3 className='text-rh-text-secondary text-[0.875rem] mb-4'>월</h3>
              <div className='grid grid-cols-4 gap-2'>
                {months.map((month) => (
                  <button
                    key={month.value}
                    onClick={() =>
                      handleYearMonthSelect(selectedYear, month.value)
                    }
                    className={`py-1.5 text-center rounded-rh-md text-[0.875rem] font-medium transition-colors ${
                      month.value === selectedMonth
                        ? "bg-white text-rh-text-inverted"
                        : "text-rh-text-secondary hover:text-white hover:bg-rh-bg-surface"
                    }`}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker;
