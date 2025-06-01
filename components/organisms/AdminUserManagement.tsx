"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";

// 오늘 기준 몇일 전인지 계산하는 함수
const getDaysAgo = (dateString: string): string => {
  const today = new Date();
  const targetDate = new Date(dateString);
  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "1일 전";
  return `${diffDays}일 전`;
};

// 임시 사용자 데이터
const mockUsers = [
  {
    id: "1",
    name: "김러너",
    phone: "010-1234-5678",
    status: "active",
    joinDate: "2024-01-15",
    lastAttendance: "2025-01-20",
  },
  {
    id: "2",
    name: "박달리기",
    phone: "010-2345-6789",
    status: "inactive",
    joinDate: "2024-02-01",
    lastAttendance: "2025-01-18",
  },
  {
    id: "3",
    name: "이조깅",
    phone: "010-3456-7890",
    status: "active",
    joinDate: "2024-02-20",
    lastAttendance: "2025-01-21",
  },
  {
    id: "4",
    name: "최마라톤",
    phone: "010-4567-8901",
    status: "active",
    joinDate: "2024-03-01",
    lastAttendance: "2025-01-19",
  },
  {
    id: "5",
    name: "정스프린트",
    phone: "010-5678-9012",
    status: "inactive",
    joinDate: "2024-01-10",
    lastAttendance: "2025-01-15",
  },
  {
    id: "6",
    name: "한러닝",
    phone: "010-6789-0123",
    status: "active",
    joinDate: "2024-03-15",
    lastAttendance: "2025-01-21",
  },
];

export default function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [sortBy, setSortBy] = useState("lastAttendance"); // 기본값: 최근 참석일
  const [sortOrder, setSortOrder] = useState("desc"); // desc: 최신순, asc: 오래된순
  const [users, setUsers] = useState(mockUsers);

  // 정렬 함수
  const sortUsers = (users: typeof mockUsers) => {
    return [...users].sort((a, b) => {
      switch (sortBy) {
        case "lastAttendance":
          const aDate = new Date(a.lastAttendance).getTime();
          const bDate = new Date(b.lastAttendance).getTime();
          return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
        case "joinDate":
          const aJoinDate = new Date(a.joinDate).getTime();
          const bJoinDate = new Date(b.joinDate).getTime();
          return sortOrder === "desc"
            ? bJoinDate - aJoinDate
            : aJoinDate - bJoinDate;
        case "name":
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  };

  const filteredUsers = sortUsers(
    users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm);
      const matchesStatus =
        statusFilter === "전체" ||
        (statusFilter === "활성" && user.status === "active") ||
        (statusFilter === "비활성" && user.status === "inactive");
      return matchesSearch && matchesStatus;
    })
  );

  const handleToggleUserStatus = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "active" ? "inactive" : "active",
            }
          : user
      )
    );
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className='text-green-800 bg-green-100 hover:bg-green-100'>
            활성
          </Badge>
        );
      case "inactive":
        return (
          <Badge className='text-gray-800 bg-gray-100 hover:bg-gray-100'>
            비활성
          </Badge>
        );
      default:
        return <Badge variant='secondary'>알 수 없음</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "lastAttendance":
        return `최근 참석일 ${sortOrder === "desc" ? "↓" : "↑"}`;
      case "joinDate":
        return `가입일 ${sortOrder === "desc" ? "↓" : "↑"}`;
      case "name":
        return `이름 ${sortOrder === "desc" ? "↓" : "↑"}`;
      default:
        return "정렬";
    }
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 헤더 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>회원 관리</h1>
              <p className='text-sm text-gray-500'>
                {filteredUsers.length}명의 회원
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 - 고정 */}
      <div className='sticky top-[73px] z-10 bg-gray-50 px-4 py-4 space-y-4 border-b border-gray-100'>
        {/* 검색 */}
        <div className='relative'>
          <Search className='absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2' />
          <Input
            placeholder='이름 또는 전화번호로 검색'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 bg-white border-gray-200 rounded-lg'
          />
        </div>

        {/* 상태 필터 탭과 정렬 */}
        <div className='flex items-center justify-between'>
          <div className='flex space-x-2'>
            {["전체", "활성", "비활성"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size='sm'
                onClick={() => setStatusFilter(status)}
                className={`rounded-full ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {status}
              </Button>
            ))}
          </div>

          {/* 정렬 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='bg-white rounded-full'
              >
                <ArrowUpDown className='w-4 h-4 mr-1' />
                {getSortLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => handleSort("lastAttendance")}>
                최근 참석일순
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("joinDate")}>
                가입일순
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("name")}>
                이름순
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 메인 컨텐츠 - 스크롤 가능  하단 바텀에 가려지지지 않게 pb-24 반영*/}
      <div className='flex-1 px-4 py-4 pb-24 overflow-y-auto'>
        {/* 사용자 목록 */}
        <div className='space-y-3'>
          {filteredUsers.map((user) => (
            <Card key={user.id} className='bg-white border-gray-200'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-3'>
                        <h3 className='font-semibold text-gray-900'>
                          {user.name}
                        </h3>
                        {getStatusBadge(user.status)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='w-8 h-8'
                          >
                            <MoreVertical className='w-4 h-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => handleToggleUserStatus(user.id)}
                          >
                            {user.status === "active" ? "비활성화" : "활성화"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className='space-y-1 text-sm text-gray-600'>
                      <div className='flex justify-between'>
                        <span>전화번호</span>
                        <span>{user.phone}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>가입일</span>
                        <span>{formatDate(user.joinDate)}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>최근 참석일</span>
                        <span
                          className={`font-medium ${
                            new Date(user.lastAttendance) >
                            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                              ? "text-green-600"
                              : new Date(user.lastAttendance) >
                                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {getDaysAgo(user.lastAttendance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className='py-8 text-center'>
            <p className='text-gray-500'>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <AdminBottomNavigation />
    </div>
  );
}
