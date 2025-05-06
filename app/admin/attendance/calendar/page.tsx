"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function AttendanceCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 월 변경 함수
  const changeMonth = (delta: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  // 날짜 형식 지정
  const formatMonth = () => {
    return `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;
  };

  // 달력에 표시할 날짜 생성
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 해당 월의 첫날
    const firstDay = new Date(year, month, 1);
    // 해당 월의 마지막 날
    const lastDay = new Date(year, month + 1, 0);

    // 첫 주의 시작일 (이전 달의 일부가 포함될 수 있음)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const day = new Date(startDate);

    // 6주 분량의 날짜를 생성 (최대 캘린더 표시 범위)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);

      // 다음 달의 첫 주가 끝나면 중단
      if (day.getMonth() > month && day.getDay() === 0) {
        break;
      }
    }

    return days;
  };

  // 날짜 선택 함수
  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  // 캘린더 날짜 클래스 설정
  const getDateClass = (date: Date) => {
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    const isToday = new Date().toDateString() === date.toDateString();
    const isSelected = selectedDate.toDateString() === date.toDateString();
    const isSunday = date.getDay() === 0;

    let className = "flex justify-center items-center w-full h-full rounded-md";

    if (!isCurrentMonth) {
      className += " text-gray-400 opacity-40";
    } else if (isSunday) {
      className += " text-red-500";
    } else {
      className += " text-black";
    }

    if (isSelected) {
      className += " bg-blue-500 text-white";
    } else if (isToday) {
      className += " text-blue-500 font-bold";
    }

    return className;
  };

  // 출석자 목록 데이터 (임시 데이터)
  const attendees = [
    {
      id: 1,
      name: "서우혁",
      birthYear: 91,
      location: "서현 황새울 공원",
      time: "10:00",
    },
    {
      id: 2,
      name: "김민준",
      birthYear: 88,
      location: "서현 황새울 공원",
      time: "10:00",
    },
    {
      id: 3,
      name: "이지은",
      birthYear: 93,
      location: "태평 탄천 음수대",
      time: "20:30",
    },
    {
      id: 4,
      name: "박지현",
      birthYear: 90,
      location: "태평 탄천 음수대",
      time: "20:30",
    },
    { id: 5, name: "정승호", birthYear: 85, location: "기타", time: "21:30" },
    { id: 6, name: "최유진", birthYear: 95, location: "기타", time: "21:30" },
    { id: 7, name: "한상우", birthYear: 89, location: "기타", time: "21:30" },
  ];

  // 장소별 출석자 그룹화
  const attendeesByLocation = attendees.reduce((acc, attendee) => {
    if (!acc[attendee.location]) {
      acc[attendee.location] = {
        time: attendee.time,
        attendees: [],
      };
    }
    acc[attendee.location].attendees.push(attendee);
    return acc;
  }, {} as Record<string, { time: string; attendees: typeof attendees }>);

  return (
    <div className='pb-4'>
      {/* 캘린더 헤더 */}
      <div className='flex justify-center items-center p-4'>
        <button
          onClick={() => changeMonth(-1)}
          className='p-2 rounded-full border border-gray-200'
        >
          <ChevronLeft size={18} className='text-gray-600' />
        </button>
        <h2 className='mx-4 text-lg font-semibold'>{formatMonth()}</h2>
        <button
          onClick={() => changeMonth(1)}
          className='p-2 rounded-full border border-gray-200'
        >
          <ChevronRight size={18} className='text-gray-600' />
        </button>
      </div>

      {/* 캘린더 */}
      <div className='mx-4 bg-white rounded-lg shadow-md overflow-hidden mb-6'>
        {/* 요일 헤더 */}
        <div className='grid grid-cols-7 text-center py-2 text-xs text-gray-500 border-b'>
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, i) => (
            <div key={i} className='px-2'>
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className='grid grid-cols-7'>
          {generateCalendarDays().map((date, i) => (
            <button
              key={i}
              className='h-12 p-1 border-t border-l first:border-l-0 hover:bg-gray-50'
              onClick={() => selectDate(date)}
            >
              <div className={getDateClass(date)}>{date.getDate()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 출석자 정보 */}
      <div className='mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-sm font-semibold'>
            출석자 총 {attendees.length}명
          </h3>
          <button className='bg-blue-500 text-white py-2 px-4 rounded text-sm'>
            한번에 출석 체크
          </button>
        </div>

        {/* 장소별 출석자 목록 */}
        {Object.entries(attendeesByLocation).map(([location, data], index) => (
          <div key={index} className='mb-6'>
            <div className='flex justify-between items-center mb-2'>
              <h4 className='font-semibold'>{location}</h4>
              <span className='text-gray-500 opacity-40'>{data.time}</span>
            </div>
            <div className='bg-white rounded-lg divide-y'>
              {data.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className='p-4 flex justify-between items-center'
                >
                  <div className='flex items-center'>
                    <div className='w-8 h-8 bg-gray-200 rounded-full flex justify-center items-center mr-2 opacity-30'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          d='M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z'
                          fill='white'
                        />
                        <path
                          d='M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z'
                          fill='white'
                        />
                      </svg>
                    </div>
                    <span className='text-black opacity-80'>
                      {attendee.name}({attendee.birthYear})
                    </span>
                  </div>
                  <button className='border border-gray-200 px-4 py-1 text-xs rounded text-black opacity-80'>
                    취소
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
