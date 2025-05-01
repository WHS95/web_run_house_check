import React from "react";
import { InfoField } from "./MemberContactInfo"; // InfoField 컴포넌트 import

interface MemberActivityInfoProps {
  attendanceCount: number;
  meetingsCreatedCount: number;
}

const MemberActivityInfo: React.FC<MemberActivityInfoProps> = ({
  attendanceCount,
  meetingsCreatedCount,
}) => {
  return (
    <div className='mb-6'>
      <InfoField label='출석 횟수' value={`${attendanceCount}회`} />
      <InfoField label='모임 개설 횟수' value={`${meetingsCreatedCount}회`} />
    </div>
  );
};

export default MemberActivityInfo;
