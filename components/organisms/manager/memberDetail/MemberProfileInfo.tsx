import React from "react";
import Image from "next/image";

interface MemberProfileInfoProps {
  name: string;
  joinDate: string;
  grade: string;
  // profileImageUrl?: string; // TODO: 실제 프로필 이미지 URL 연동
}

const MemberProfileInfo: React.FC<MemberProfileInfoProps> = ({
  name,
  joinDate,
  grade,
}) => {
  return (
    <div className='flex items-center mb-6'>
      {/* 임시 프로필 아이콘 */}
      <div className='w-16 h-16 rounded-full bg-[#476565]/30 flex items-center justify-center mr-4 flex-shrink-0'>
        <Image
          src='/assets/profile-placeholder.svg'
          alt='프로필'
          width={32}
          height={32}
          className='filter invert brightness-0'
        />
      </div>
      <div className='flex-1'>
        <div className='flex items-center mb-1'>
          <h2 className='text-xl font-medium mr-2'>{name}</h2>
          <Image
            src='/assets/star-icon-yellow.svg'
            alt='등급'
            width={16}
            height={16}
          />
        </div>
        <div className='flex text-sm text-gray-600 space-x-4'>
          <span>가입일 {joinDate}</span>
          <span>등급 {grade}</span>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileInfo;
