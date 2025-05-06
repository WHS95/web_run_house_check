"use client";

import React from "react";
import UserTableInfoCell from "@/components/molecules/UserTableInfoCell";

// TODO: 필요한 아이콘 import (예: MoreVertical)
// import { MoreVertical } from 'lucide-react';

// TODO: 공통 Button 컴포넌트 import
// import Button from '@/components/atoms/Button';

// TODO: User 타입 정의 가져오기 (예시, 실제 경로/타입으로 수정 필요)
type User = {
  id: string;
  first_name: string; // DB 스키마 기준
  birth_year?: number | null;
  profile_image_url?: string | null;
  join_date: string; // 날짜 형식 고려 필요 (string or Date)
};

interface UserListTableProps {
  users: User[];
}

const UserListTable: React.FC<UserListTableProps> = ({ users }) => {
  // TODO: 가입일 포맷 함수 (필요시 utils로 분리)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // 간단한 YYYY-MM-DD 형식, 필요시 locale 고려
      return date.toISOString().split("T")[0];
    } catch (error) {
      return dateString; // 파싱 실패 시 원본 반환
    }
  };

  return (
    <div className='relative w-full overflow-hidden'>
      {/* 테이블 컨테이너에 스크롤바를 숨기는 스타일 적용 */}
      <div
        className='w-full overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-hide'
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* IE/Edge */,
        }}
      >
        {/* 스크롤바 숨김 처리 */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>

        <table className='min-w-full border-collapse table-fixed md:table-auto'>
          <thead className='bg-white border-b border-gray-200 sticky top-0 z-10'>
            <tr>
              <th
                scope='col'
                className='px-3 sm:px-6 py-3 text-left text-sm font-normal text-gray-500 opacity-60 w-1/2'
              >
                이름/나이
              </th>
              <th
                scope='col'
                className='px-3 sm:px-6 py-3 text-left text-sm font-normal text-gray-500 opacity-60 w-1/3'
              >
                가입일
              </th>
              <th
                scope='col'
                className='relative py-3.5 pl-3 pr-2 sm:pr-6 w-[60px]'
              >
                <span className='sr-only'>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className='bg-white'>
            {users.map((user) => (
              <tr key={user.id}>
                <td className='px-3 sm:px-6 pt-4 pb-3 text-xs text-gray-900'>
                  <UserTableInfoCell
                    profileUrl={user.profile_image_url}
                    name={user.first_name}
                    birthYear={user.birth_year}
                  />
                </td>
                <td className='px-3 sm:px-6 pt-4 pb-3 text-xs text-gray-900'>
                  {formatDate(user.join_date)}
                </td>
                <td className='relative pt-4 pb-6 pl-3 pr-2 sm:pr-6 text-right text-sm font-medium'>
                  <button className='text-gray-400 hover:text-gray-600'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserListTable;
