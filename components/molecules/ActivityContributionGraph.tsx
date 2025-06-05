"use client";

import React, { memo, useMemo } from "react";

interface Activity {
  type: "attendance" | "create_meeting";
  date: string;
  location: string;
  exerciseType: string;
}

interface ActivityContributionGraphProps {
  activities: Activity[];
}

// ⚡ 범례 컴포넌트 (메모이제이션)
const Legend = memo(() => (
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
));
Legend.displayName = "Legend";

// ⚡ 메인 컴포넌트 (성능 극대화)
const ActivityContributionGraph = memo<ActivityContributionGraphProps>(
  ({ activities }) => {
    // ⚡ 최근 120일간의 날짜 생성 (메모이제이션)
    const weeks = useMemo(() => {
      const weeks = [];
      const today = new Date();

      // 현재 주의 일요일 찾기
      const currentSunday = new Date(today);
      currentSunday.setDate(today.getDate() - today.getDay());

      // 17주 전의 일요일부터 시작
      const startDate = new Date(currentSunday);
      startDate.setDate(currentSunday.getDate() - 16 * 7);

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
    }, []); // 빈 의존성 배열로 한 번만 계산

    // ⚡ 날짜별 활동 데이터 매핑 (메모이제이션)
    const activityMap = useMemo(() => {
      const map = new Map<string, Activity[]>();

      activities.forEach((activity) => {
        const dateStr = new Date(activity.date).toISOString().split("T")[0];
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        map.get(dateStr)!.push(activity);
      });

      return map;
    }, [activities]);

    // ⚡ 활동 레벨에 따른 색상 결정 (최적화된 함수)
    const getActivityColor = useMemo(() => {
      return (dayActivities: Activity[]) => {
        if (dayActivities.length === 0) {
          return "bg-gray-100";
        }

        const hasCreatedMeeting = dayActivities.some(
          (activity) => activity.type === "create_meeting"
        );
        const attendanceCount = dayActivities.filter(
          (activity) => activity.type === "attendance"
        ).length;

        if (hasCreatedMeeting) {
          return "bg-basic-blue";
        } else if (attendanceCount >= 2) {
          return "bg-blue-400";
        } else if (attendanceCount === 1) {
          return "bg-blue-200";
        }

        return "bg-gray-100";
      };
    }, []);

    // ⚡ 툴팁 메시지 생성 (최적화된 함수)
    const getTooltipMessage = useMemo(() => {
      return (date: Date, dayActivities: Activity[]) => {
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
    }, []);

    // ⚡ 월 라벨 생성 (메모이제이션)
    const monthLabels = useMemo(() => {
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

      let lastMonth = -1;

      for (let i = 0; i < weeks.length; i++) {
        if (weeks[i] && weeks[i][0]) {
          const currentMonth = weeks[i][0].getMonth();

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
    }, [weeks]);

    // ⚡ 오늘 날짜 (메모이제이션)
    const today = useMemo(() => new Date(), []);

    // ⚡ 그리드 셀들 렌더링 (메모이제이션)
    const gridCells = useMemo(() => {
      return weeks.map((week, weekIndex) => (
        <div key={weekIndex} className='flex flex-col space-y-1'>
          {week.map((date, dayIndex) => {
            const dateStr = date.toISOString().split("T")[0];
            const dayActivities = activityMap.get(dateStr) || [];
            const isFuture = date > today;

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`
                w-3 h-3 rounded-sm border border-gray-200 transition-colors
                ${
                  isFuture
                    ? "bg-gray-50 opacity-50"
                    : getActivityColor(dayActivities)
                }
                hover:ring-1 hover:ring-gray-400 hover:ring-opacity-50
              `}
                title={getTooltipMessage(date, dayActivities)}
              />
            );
          })}
        </div>
      ));
    }, [weeks, activityMap, today, getActivityColor, getTooltipMessage]);

    return (
      <div className='mt-6 overflow-hidden bg-white border border-gray-200 rounded-lg'>
        {/* ⚡ 헤더 (최적화됨) */}
        <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
          <div className='flex items-center justify-between'>
            <h3 className='text-base font-semibold text-gray-900'>활동 기록</h3>
            <Legend />
          </div>
        </div>

        {/* ⚡ 그래프 (최적화됨) */}
        <div className='p-3'>
          <div className='relative'>
            {/* ⚡ 월 라벨 */}
            <div className='flex mb-1'>
              {monthLabels.map((monthLabel, index) => {
                const nextLabelIndex =
                  index < monthLabels.length - 1
                    ? monthLabels[index + 1].index
                    : weeks.length;
                const width = (nextLabelIndex - monthLabel.index) * 16;

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

            {/* ⚡ 요일 라벨과 그리드 */}
            <div className='flex'>
              {/* 요일 라벨 */}
              <div className='flex flex-col mr-2 text-xs text-gray-500 space-y-1'>
                <div className='h-3 flex items-center'>일</div>
                <div className='h-3'></div>
                <div className='h-3 flex items-center'>화</div>
                <div className='h-3'></div>
                <div className='h-3 flex items-center'>목</div>
                <div className='h-3'></div>
                <div className='h-3 flex items-center'>토</div>
              </div>

              {/* ⚡ 활동 그리드 (최적화됨) */}
              <div className='flex space-x-1 overflow-x-auto'>{gridCells}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ActivityContributionGraph.displayName = "ActivityContributionGraph";

export default ActivityContributionGraph;
