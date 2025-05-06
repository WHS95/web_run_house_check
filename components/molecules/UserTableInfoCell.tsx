import React from "react";
import Avatar from "@/components/atoms/Avatar";

interface UserTableInfoCellProps {
  profileUrl?: string | null;
  name: string;
  birthYear?: number | null;
}

// 사용자 이름과 출생 연도 끝 두 자리를 형식에 맞게 반환하는 헬퍼 함수 (Figma 기준)
const formatUserNameBirthYear = (
  name: string,
  birthYear?: number | null
): string => {
  if (!birthYear) {
    return `${name}(미입력)`;
  }
  const yearSuffix = birthYear.toString().slice(-2);
  return `${name}(${yearSuffix})`;
};

const UserTableInfoCell: React.FC<UserTableInfoCellProps> = ({
  profileUrl,
  name,
  birthYear,
}) => {
  const displayName = formatUserNameBirthYear(name, birthYear);

  return (
    <div className='flex items-center'>
      <div className='flex-shrink-0'>
        <Avatar src={profileUrl} alt={`${name} profile`} size={40} />
      </div>
      <div className='ml-4'>
        <div className='text-sm font-medium text-gray-900'>{displayName}</div>
      </div>
    </div>
  );
};

export default UserTableInfoCell;
