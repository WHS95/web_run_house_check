import React, { useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

interface DateTimeFieldProps {
  label: string;
  dateValue: string; // YYYY-MM-DD 형식
  timeValue: string; // HH:MM 형식
  name?: string;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const DateTimeField: React.FC<DateTimeFieldProps> = ({
  label,
  dateValue,
  timeValue,
  name = "datetime",
  onDateChange,
  onTimeChange,
}) => {
  // 시간 문자열을 시와 분으로 분리
  const [hour, minute] = timeValue.split(":");

  // 시간 옵션 생성 (0~23시)
  const generateHourOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      const hourStr = h.toString().padStart(2, "0");
      options.push(hourStr);
    }
    return options;
  };

  // 분 옵션 생성 (10분 단위: 00, 10, 20, 30, 40, 50)
  const generateMinuteOptions = () => {
    return ["00", "10", "20", "30", "40", "50"];
  };

  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();

  // 시 또는 분 변경 시 전체 시간 업데이트
  const handleTimeComponentChange = (
    type: "hour" | "minute",
    value: string
  ) => {
    const newHour = type === "hour" ? value : hour;
    const newMinute = type === "minute" ? value : minute;
    const newTime = `${newHour}:${newMinute}`;

    // React synthetic event 객체 생성
    const syntheticEvent = {
      target: { value: newTime },
      currentTarget: { value: newTime },
    } as React.ChangeEvent<HTMLSelectElement>;

    onTimeChange(syntheticEvent);
  };

  return (
    <div className='mb-6'>
      <label className='block mb-3 text-sm font-semibold text-gray-800'>
        {label}
      </label>
      <div className='space-y-3'>
        {/* 날짜 선택 카드 */}
        <div className='relative'>
          <div className='relative transition-all duration-200 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500'>
            <div className='flex items-center p-4'>
              <CalendarDays className='flex-shrink-0 w-5 h-5 mr-3 text-blue-500' />
              <input
                type='date'
                name={`${name}-date`}
                value={dateValue}
                onChange={onDateChange}
                className='w-full text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden'
              />
            </div>
          </div>
        </div>

        {/* 시간 선택 카드 - 시와 분을 분리 */}
        <div className='relative'>
          <div className='relative transition-all duration-200 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500'>
            <div className='flex items-center p-4'>
              <Clock className='flex-shrink-0 w-5 h-5 mr-3 text-green-500' />

              {/* 시간 선택 */}
              <div className='flex items-center space-x-2 w-full'>
                <select
                  value={hour}
                  onChange={(e) =>
                    handleTimeComponentChange("hour", e.target.value)
                  }
                  className='flex-1 text-sm font-medium text-gray-700 bg-transparent border-none appearance-none cursor-pointer focus:outline-none'
                >
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}시
                    </option>
                  ))}
                </select>

                <span className='text-sm font-medium text-gray-500'>:</span>

                {/* 분 선택 */}
                <select
                  value={minute}
                  onChange={(e) =>
                    handleTimeComponentChange("minute", e.target.value)
                  }
                  className='flex-1 text-sm font-medium text-gray-700 bg-transparent border-none appearance-none cursor-pointer focus:outline-none'
                >
                  {minuteOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}분
                    </option>
                  ))}
                </select>
              </div>

              <svg
                className='flex-shrink-0 w-4 h-4 ml-2 text-gray-400 pointer-events-none'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimeField;
