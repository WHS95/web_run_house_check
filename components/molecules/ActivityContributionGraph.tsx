"use client";

import React from "react";

interface Activity {
  type: "attendance" | "create_meeting";
  date: string;
  location: string;
  exerciseType: string;
}

interface ActivityContributionGraphProps {
  activities: Activity[];
}

const ActivityContributionGraph: React.FC<ActivityContributionGraphProps> = ({
  activities,
}) => {
  // 최근 120일간의 날짜 생성 (약 17주)
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();

    // 현재 주의 일요일 찾기
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - today.getDay());

    // 17주 전의 일요일부터 시작 (120일 ≈ 17주)
    const startDate = new Date(currentSunday);
    startDate.setDate(currentSunday.getDate() - 16 * 7); // 16주 전 (현재 주 포함해서 17주)

    for (let week = 0; week < 17; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);
        weekDays.push(new Date(currentDate));
      }
      weeks.push(weekDays);
    }

    return weeks;
  };

  // 날짜별 활동 데이터 매핑
  const getActivityForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return activities.filter((activity) => {
      const activityDate = new Date(activity.date).toISOString().split("T")[0];
      return activityDate === dateStr;
    });
  };

  // 활동 레벨에 따른 색상 결정
  const getActivityColor = (dayActivities: Activity[]) => {
    if (dayActivities.length === 0) {
      return "bg-gray-100"; // 활동 없음
    }

    const hasCreatedMeeting = dayActivities.some(
      (activity) => activity.type === "create_meeting"
    );
    const attendanceCount = dayActivities.filter(
      (activity) => activity.type === "attendance"
    ).length;

    if (hasCreatedMeeting) {
      // 모임 개설이 있는 경우 - 진한 파랑색
      return "bg-basic-blue"; // 가장 진한 색상
    } else if (attendanceCount >= 2) {
      // 2회 이상 참여 - 중간 진한 파랑색
      return "bg-blue-400";
    } else if (attendanceCount === 1) {
      // 1회 참여 - 연한 파랑색
      return "bg-blue-200";
    }

    return "bg-gray-100";
  };

  // 툴팁 메시지 생성
  const getTooltipMessage = (date: Date, dayActivities: Activity[]) => {
    const dateStr = date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (dayActivities.length === 0) {
      return `${dateStr}: 활동 없음`;
    }

    const attendanceCount = dayActivities.filter(
      (activity) => activity.type === "attendance"
    ).length;
    const meetingCount = dayActivities.filter(
      (activity) => activity.type === "create_meeting"
    ).length;

    let message = dateStr;
    if (meetingCount > 0) {
      message += `\n모임 개설: ${meetingCount}회`;
    }
    if (attendanceCount > 0) {
      message += `\n참여: ${attendanceCount}회`;
    }

    return message;
  };

  const weeks = generateWeeks();
  const today = new Date();

  // 월 라벨 생성
  const getMonthLabels = () => {
    const labels = [];
    const months = [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
    ];

    // 각 주의 첫 번째 날을 확인하여 월이 바뀌는 지점에서 라벨 추가
    let lastMonth = -1;

    for (let i = 0; i < weeks.length; i++) {
      if (weeks[i] && weeks[i][0]) {
        const currentMonth = weeks[i][0].getMonth();

        // 월이 바뀌었거나 첫 번째 주인 경우 라벨 추가
        if (currentMonth !== lastMonth) {
          labels.push({
            index: i,
            label: months[currentMonth],
          });
          lastMonth = currentMonth;
        }
      }
    }

    return labels;
  };

  const monthLabels = getMonthLabels();

  return (
    <div className='mt-6 overflow-hidden bg-white border border-gray-200 rounded-lg'>
      {/* 헤더 */}
      <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
        <div className='flex items-center justify-between'>
          <h3 className='text-base font-semibold text-gray-900'>활동 기록</h3>
          <div className='flex items-center space-x-2 text-xs text-gray-500'>
            <span>적음</span>
            <div className='flex space-x-1'>
              <div className='w-2.5 h-2.5 bg-gray-100 rounded-sm'></div>
              <div className='w-2.5 h-2.5 bg-blue-200 rounded-sm'></div>
              <div className='w-2.5 h-2.5 bg-blue-400 rounded-sm'></div>
              <div className='w-2.5 h-2.5 bg-basic-blue rounded-sm'></div>
            </div>
            <span>많음</span>
          </div>
        </div>
      </div>

      {/* 그래프 */}
      <div className='p-3'>
        <div className='relative'>
          {/* 월 라벨 */}
          <div className='flex mb-1'>
            {monthLabels.map((monthLabel, index) => {
              // 다음 월 라벨까지의 거리 계산
              const nextLabelIndex =
                index < monthLabels.length - 1
                  ? monthLabels[index + 1].index
                  : weeks.length;
              const width = (nextLabelIndex - monthLabel.index) * 16; // 16px = 3px(셀) + 4px(간격) * 4주 정도

              return (
                <div
                  key={monthLabel.index}
                  className='text-xs text-gray-500'
                  style={{
                    marginLeft: monthLabel.index === 0 ? "20px" : "0",
                    width: `${Math.max(width, 32)}px`,
                  }}
                >
                  {monthLabel.label}
                </div>
              );
            })}
          </div>

          <div className='flex'>
            {/* 요일 라벨 */}
            <div className='flex flex-col w-3 mr-2 text-xs text-gray-500'>
              <div className='h-3 mb-1'></div> {/* 월 라벨 공간 */}
              <div className='flex items-center justify-end h-3 mb-1'>월</div>
              <div className='h-3 mb-1'></div>
              <div className='flex items-center justify-end h-3 mb-1'>수</div>
              <div className='h-3 mb-1'></div>
              <div className='flex items-center justify-end h-3 mb-1'>금</div>
              <div className='h-3'></div>
            </div>

            {/* 활동 그리드 */}
            <div className='flex space-x-1'>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className='flex flex-col space-y-1'>
                  {week.map((date, dayIndex) => {
                    const dayActivities = getActivityForDate(date);
                    const isToday =
                      date.toDateString() === today.toDateString();
                    const isFuture = date > today;

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:ring-1 hover:ring-blue-300
                          ${
                            isFuture
                              ? "bg-gray-50"
                              : getActivityColor(dayActivities)
                          }
                          ${isToday ? "ring-1 ring-blue-500" : ""}
                        `}
                        title={getTooltipMessage(date, dayActivities)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className='pt-3 mt-3 border-t border-gray-100'>
          <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 rounded-sm bg-basic-blue'></div>
                <span className='text-xs text-gray-600'>
                  모임 개설:{" "}
                  {activities.filter((a) => a.type === "create_meeting").length}
                  회
                </span>
              </div>
              <div className='flex items-center space-x-1'>
                <div className='w-3 h-3 bg-blue-200 rounded-sm'></div>
                <span className='text-xs text-gray-600'>
                  참여:{" "}
                  {activities.filter((a) => a.type === "attendance").length}회
                </span>
              </div>
            </div>
            <span className='text-xs text-gray-500'>최근 120일</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityContributionGraph;
