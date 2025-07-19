"use client";

import React, { memo, useMemo } from "react";
import { GitCommit } from "lucide-react";
import ActivityHistoryItem from "@/components/molecules/ActivityHistoryItem";

interface Activity {
  type: "attendance" | "create_meeting";
  date: string;
  location: string;
  exerciseType: string;
}

interface MemberActivityHistoryProps {
  activities: Activity[];
}

// ⚡ 빈 상태 컴포넌트 (메모이제이션)
const EmptyState = memo(() => (
  <div className='py-[4vh] text-center'>
    <GitCommit className='w-[2rem] h-[2rem] mx-auto mb-[1vh] text-gray-500' />
    <p className='text-[0.875rem] font-medium text-gray-400'>
      최근 활동 내역이 없습니다
    </p>
  </div>
));
EmptyState.displayName = "EmptyState";

// ⚡ 메인 컴포넌트 (성능 최적화)
const MemberActivityHistory = memo<MemberActivityHistoryProps>(
  ({ activities }) => {
    // ⚡ 최근 3개 활동만 메모이제이션하여 성능 최적화
    const recentActivities = useMemo(() => {
      return activities.slice(0, 3);
    }, [activities]);

    // ⚡ 활동 항목들을 메모이제이션
    const activityItems = useMemo(() => {
      if (recentActivities.length === 0) {
        return <EmptyState />;
      }

      return (
        <div className='space-y-0'>
          {recentActivities.map((activity, index) => (
            <ActivityHistoryItem
              key={`${activity.date}-${activity.type}-${index}`} // ⚡ 고유 키 생성
              type={activity.type}
              date={activity.date}
              location={activity.location}
              exerciseType={activity.exerciseType}
              isLast={index === recentActivities.length - 1}
            />
          ))}
        </div>
      );
    }, [recentActivities]);

    return (
      <div className='mt-[3vh] bg-basic-black-gray rounded-lg p-[2vw]'>
        {/* ⚡ 활동 목록만 표시 (헤더 제거) */}
        <div>{activityItems}</div>
      </div>
    );
  }
);

MemberActivityHistory.displayName = "MemberActivityHistory";

export default MemberActivityHistory;
