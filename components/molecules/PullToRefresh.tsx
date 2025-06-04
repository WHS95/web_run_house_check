"use client";

import React from "react";

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  isTriggered: boolean;
  style?: React.CSSProperties;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  isRefreshing,
  pullDistance,
  isTriggered,
  style,
}) => {
  const rotation = Math.min((pullDistance / 100) * 180, 180);

  return (
    <div
      className='fixed top-0 left-1/2 transform -translate-x-1/2 z-50 pt-safe'
      style={{
        ...style,
        pointerEvents: "none",
      }}
    >
      <div className='flex flex-col items-center justify-center py-4'>
        {/* 새로고침 아이콘 */}
        <div
          className={`
                        w-8 h-8 rounded-full bg-white shadow-lg
                        flex items-center justify-center
                        transition-all duration-300 ease-out
                        ${isRefreshing ? "pull-refresh-indicator" : ""}
                        ${
                          isTriggered
                            ? "bg-blue-500 text-white"
                            : "text-gray-600"
                        }
                    `}
          style={{
            transform: isRefreshing ? "rotate(0deg)" : `rotate(${rotation}deg)`,
          }}
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polyline points='23 4 23 10 17 10' />
            <polyline points='1 20 1 14 7 14' />
            <path d='M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15' />
          </svg>
        </div>

        {/* 상태 텍스트 */}
        <div className='mt-2 text-xs font-medium text-gray-600'>
          {isRefreshing
            ? "새로고침 중..."
            : isTriggered
            ? "놓으면 새로고침"
            : pullDistance > 0
            ? "아래로 당겨서 새로고침"
            : null}
        </div>

        {/* 진행 바 */}
        {pullDistance > 0 && !isRefreshing && (
          <div className='mt-2 w-16 h-1 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className={`h-full transition-all duration-150 ease-out ${
                isTriggered ? "bg-blue-500" : "bg-gray-400"
              }`}
              style={{
                width: `${Math.min((pullDistance / 100) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PullToRefresh;
