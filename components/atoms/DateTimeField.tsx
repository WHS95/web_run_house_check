import React from "react";

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
  // 10분 단위 시간 옵션 생성 (00:00 ~ 23:50)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const hourStr = hour.toString().padStart(2, "0");
        const minuteStr = minute.toString().padStart(2, "0");
        const timeStr = `${hourStr}:${minuteStr}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className='mb-4'>
      <label className='block mb-2 text-sm font-semibold'>{label}</label>
      <div className='flex space-x-2'>
        {/* 날짜 선택 */}
        <div className='flex-1'>
          <input
            type='date'
            name={`${name}-date`}
            value={dateValue}
            onChange={onDateChange}
            className='w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm placeholder-black/60 focus:outline-none focus:ring-1 focus:ring-blue-500'
          />
        </div>

        {/* 시간 선택 */}
        <div className='flex-1'>
          <select
            name={`${name}-time`}
            value={timeValue}
            onChange={onTimeChange}
            className='w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none'
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DateTimeField;
