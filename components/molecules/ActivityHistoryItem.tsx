import React from "react";
import { CheckCircle, Users, MapPin, Clock } from "lucide-react";

interface ActivityHistoryItemProps {
  type: "attendance" | "create_meeting";
  date: string;
  location: string;
  exerciseType: string;
  isLast?: boolean;
}

const ActivityHistoryItem: React.FC<ActivityHistoryItemProps> = ({
  type,
  date,
  location,
  exerciseType,
  isLast = false,
}) => {
  // 상대적 시간 계산
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInMs = now.getTime() - activityDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return diffInMinutes <= 1 ? "방금 전" : `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return activityDate.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // 활동 타입별 설정
  const getActivityConfig = () => {
    if (type === "create_meeting") {
      return {
        icon: <Users className='w-3 h-3' />,
        color: "bg-purple-500",
        borderColor: "border-purple-200",
        textColor: "text-purple-700",
        bgColor: "bg-purple-50",
        message: `${location}에서 ${exerciseType} 모임을 개설했습니다`,
        label: "모임 개설",
      };
    } else {
      return {
        icon: <CheckCircle className='w-3 h-3' />,
        color: "bg-green-500",
        borderColor: "border-green-200",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        message: `${location}에서 ${exerciseType} 활동에 참여했습니다`,
        label: "출석",
      };
    }
  };

  const config = getActivityConfig();
  const relativeTime = getRelativeTime(date);

  return (
    <div className='relative flex items-start space-x-3 pb-4'>
      {/* 타임라인 */}
      <div className='relative flex flex-col items-center'>
        {/* 아이콘 */}
        <div
          className={`
            flex items-center justify-center w-6 h-6 rounded-full text-white
            ${config.color} ring-4 ring-white shadow-sm
          `}
        >
          {config.icon}
        </div>

        {/* 연결선 (마지막 아이템이 아닌 경우) */}
        {!isLast && <div className='w-0.5 h-8 bg-gray-200 mt-1'></div>}
      </div>

      {/* 콘텐츠 */}
      <div className='flex-1 min-w-0'>
        {/* 메인 메시지 */}
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-900 leading-5'>
              {config.message}
            </p>

            {/* 메타 정보 */}
            <div className='flex items-center space-x-3 mt-1'>
              <span
                className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${config.textColor} ${config.bgColor}
                `}
              >
                {config.label}
              </span>

              <div className='flex items-center space-x-1 text-xs text-gray-500'>
                <Clock className='w-3 h-3' />
                <span>{relativeTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 정보 (호버 시 표시되는 추가 정보) */}
        <div className='mt-2 text-xs text-gray-500 space-y-1'>
          <div className='flex items-center space-x-1'>
            <MapPin className='w-3 h-3' />
            <span>{location}</span>
            <span className='text-gray-300'>•</span>
            <span>{exerciseType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHistoryItem;
