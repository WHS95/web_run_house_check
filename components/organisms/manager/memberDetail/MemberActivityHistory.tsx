import React from "react";
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

const MemberActivityHistory: React.FC<MemberActivityHistoryProps> = ({
  activities,
}) => {
  return (
    <div className='mt-6 overflow-hidden bg-white border border-gray-200 rounded-lg'>
      {/* GitHub 스타일 헤더 */}
      <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
        <div className='flex items-center space-x-2'>
          <h3 className='text-base font-semibold text-gray-900'>
            최근 활동 내역
          </h3>
        </div>
      </div>

      {/* 활동 목록 */}
      <div className='px-4 py-4'>
        {activities.length > 0 ? (
          <div className='space-y-0'>
            {activities.slice(0, 3).map((activity, index) => (
              <ActivityHistoryItem
                key={index}
                type={activity.type}
                date={activity.date}
                location={activity.location}
                exerciseType={activity.exerciseType}
                isLast={index === Math.min(3, activities.length - 1)}
              />
            ))}
          </div>
        ) : (
          <div className='py-8 text-center'>
            <GitCommit className='w-8 h-8 mx-auto mb-2 text-gray-300' />
            <p className='text-sm font-medium text-gray-500'>
              최근 30일간 활동 내역이 없습니다
            </p>
            <p className='mt-1 text-xs text-gray-400'>
              모임에 참여하거나 개설해보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberActivityHistory;
