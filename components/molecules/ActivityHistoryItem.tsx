import React from "react";

interface ActivityHistoryItemProps {
  type: "attendance" | "create_meeting";
  date: string;
  location: string;
  exerciseType: string;
}

const ActivityHistoryItem: React.FC<ActivityHistoryItemProps> = ({
  type,
  date,
  location,
  exerciseType,
}) => {
  const activityText = type === "attendance" ? "출석" : "모임 개설";
  const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className='px-4 py-3 border-b border-gray-100'>
      <div className='flex items-center justify-between mb-1'>
        <span className='text-base font-medium text-gray-800'>
          {activityText}
        </span>
        <span className='text-sm text-gray-500'>{formattedDate}</span>
      </div>
      <div className='flex items-center gap-4 text-sm text-gray-600'>
        <div className='flex items-center gap-1'>
          <span className='font-medium'>장소:</span>
          <span>{location}</span>
        </div>
        <div className='flex items-center gap-1'>
          <span className='font-medium'>운동:</span>
          <span>{exerciseType}</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHistoryItem;
