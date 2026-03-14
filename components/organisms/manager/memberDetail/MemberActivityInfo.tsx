import React from "react";

interface MemberActivityInfoProps {
  attendanceCount: number;
  meetingsCreatedCount: number;
}

const MemberActivityInfo: React.FC<MemberActivityInfoProps> = ({
  attendanceCount,
  meetingsCreatedCount,
}) => {
  return (
    <div className='mt-6 bg-white rounded-lg overflow-hidden'>
      <div className='px-4 py-3 bg-gray-50'>
        <h3 className='text-base font-medium text-rh-text-inverted'>활동 통계</h3>
      </div>
      <div className='divide-y divide-gray-100'>
        <div className='flex justify-between items-center py-3 px-4'>
          <span className='text-base text-rh-text-inverted'>출석 횟수</span>
          <span className='text-base font-medium text-rh-text-inverted'>
            {attendanceCount}회
          </span>
        </div>
        <div className='flex justify-between items-center py-3 px-4'>
          <span className='text-base text-rh-text-inverted'>모임 개설 횟수</span>
          <span className='text-base font-medium text-rh-text-inverted'>
            {meetingsCreatedCount}회
          </span>
        </div>
      </div>
    </div>
  );
};

export default MemberActivityInfo;
