import React from "react";
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
    <div className='mt-6 overflow-hidden bg-white rounded-lg'>
      <div className='px-4 py-3 bg-gray-50'>
        <h3 className='text-base font-medium text-gray-900'>최근 활동 내역</h3>
      </div>
      <div className='divide-y divide-gray-100'>
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <ActivityHistoryItem
              key={index}
              type={activity.type}
              date={activity.date}
              location={activity.location}
              exerciseType={activity.exerciseType}
            />
          ))
        ) : (
          <div className='px-4 py-8 text-center text-gray-500'>
            최근 30일간 활동 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberActivityHistory;
