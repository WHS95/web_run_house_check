import React from "react";
import UserListTable from "@/components/organisms/UserListTable";
// TODO: 공통 헤더 및 레이아웃 컴포넌트 import
import Header from "@/components/organisms/Header"; // organisms 에 Header가 있음
// import AdminLayout from '@/components/templates/AdminLayout'; // 예시
// TODO: BottomNavigation 컴포넌트 import
// import BottomNavigation from '@/components/organisms/BottomNavigation'; // 예시

// TODO: 필요한 아이콘 import (예: MoreVertical)
// import { MoreVertical } from 'lucide-react';

// TODO: 공통 컴포넌트 import
// import Heading from '@/components/atoms/Heading';
// import Avatar from '@/components/atoms/Avatar';
// import Button from '@/components/atoms/Button';
// import {
//   Table,
//   TableHeader,
//   TableBody,
//   TableRow,
//   TableHead,
//   TableCell,
// } from '@/components/molecules/Table'; // 예시 경로

// TODO: Supabase 클라이언트 및 실제 데이터 타입 import
// import { createClient } from '@/lib/supabase/server';

// User 타입 정의 (임시 - 실제 타입 정의와 일치시켜야 함)
type User = {
  id: string;
  first_name: string;
  birth_year?: number | null;
  profile_image_url?: string | null;
  join_date: string; // Consider using Date type if appropriate after fetching
};

// 임시 사용자 데이터
const dummyUsers: User[] = [
  {
    id: "1",
    first_name: "서우혁",
    birth_year: 1991,
    profile_image_url: undefined,
    join_date: "2021-01-01T10:00:00Z", // ISO 형식 예시
  },
  {
    id: "2",
    first_name: "박영희",
    birth_year: 1995,
    profile_image_url: undefined,
    join_date: "2023-02-15T11:30:00Z",
  },
  {
    id: "3",
    first_name: "이민준",
    birth_year: 2000,
    profile_image_url: undefined,
    join_date: "2024-01-01T09:00:00Z",
  },
  // ... 더 많은 사용자 데이터 (Figma 처럼 보이게 추가)
  {
    id: "4",
    first_name: "김민지",
    birth_year: 1992,
    profile_image_url: undefined,
    join_date: "2022-03-10T10:00:00Z",
  },
  {
    id: "5",
    first_name: "이서준",
    birth_year: 1988,
    profile_image_url: undefined,
    join_date: "2021-07-22T10:00:00Z",
  },
  {
    id: "6",
    first_name: "최유나",
    birth_year: 1999,
    profile_image_url: undefined,
    join_date: "2023-11-05T10:00:00Z",
  },
  {
    id: "7",
    first_name: "강지훈",
    birth_year: 1990,
    profile_image_url: undefined,
    join_date: "2021-01-15T10:00:00Z",
  },
  {
    id: "8",
    first_name: "윤채원",
    birth_year: 1996,
    profile_image_url: undefined,
    join_date: "2023-08-20T10:00:00Z",
  },
  {
    id: "9",
    first_name: "정다은",
    birth_year: 1993,
    profile_image_url: undefined,
    join_date: "2024-02-28T10:00:00Z",
  },
];

const AdminUserListPage = async () => {
  // TODO: Supabase 클라이언트 생성 및 실제 데이터 가져오기
  // const supabase = createClient();
  // const { data: users, error } = await supabase.from('users').select('id, first_name, birth_year, profile_image_url, join_date');
  // if (error) { /* 에러 처리 */ }

  // 임시 데이터 사용
  const users = dummyUsers;
  const totalUsers = users.length; // 실제로는 count 쿼리 사용 고려

  return (
    // <AdminLayout>
    <div className='flex flex-col min-h-screen'>
      {/* 페이지 컨텐츠 영역 */}
      <main className='flex-grow bg-white'>
        {" "}
        {/* Figma 배경색 고려 */}
        {/* 타이틀 수정 (Figma 스타일 반영) */}
        <h1 className='text-lg font-semibold px-3 py-2'>
          총 <span className='text-blue-600'>{totalUsers}</span>명
        </h1>
        {/* TODO: 검색 및 필터 컴포넌트 추가 영역 */}
        {/* 사용자 목록 테이블 */}
        <UserListTable users={users} />
        {/* TODO: 페이지네이션 컴포넌트 추가 영역 */}
      </main>

      {/* TODO: BottomNavigation 컴포넌트 구현 및 추가 */}
      {/* <BottomNavigation activeTab="members" /> */}
      {/* 임시 하단 네비게이션 영역 */}
      <footer className='sticky bottom-0 bg-white border-t border-gray-200 p-4 text-center'>
        하단 네비게이션 영역 (회원 활성)
      </footer>
    </div>
    // </AdminLayout>
  );
};

export default AdminUserListPage;
