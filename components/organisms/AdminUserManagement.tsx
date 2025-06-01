"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  UserX,
  UserCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";

// 임시 사용자 데이터
const mockUsers = [
  {
    id: "1",
    name: "김러너",
    email: "runner1@example.com",
    phone: "010-1234-5678",
    status: "active",
    joinDate: "2024-01-15",
    lastLogin: "2024-03-15 09:30",
    suspendedAt: null,
    suspensionReason: null,
  },
  {
    id: "2",
    name: "박달리기",
    email: "runner2@example.com",
    phone: "010-2345-6789",
    status: "suspended",
    joinDate: "2024-02-01",
    lastLogin: "2024-03-10 14:20",
    suspendedAt: "2024-03-12 10:00",
    suspensionReason: "부적절한 행동",
  },
  {
    id: "3",
    name: "이조깅",
    email: "runner3@example.com",
    phone: "010-3456-7890",
    status: "active",
    joinDate: "2024-02-20",
    lastLogin: "2024-03-14 18:45",
    suspendedAt: null,
    suspensionReason: null,
  },
  {
    id: "4",
    name: "최마라톤",
    email: "runner4@example.com",
    phone: "010-4567-8901",
    status: "active",
    joinDate: "2024-03-01",
    lastLogin: "2024-03-15 07:15",
    suspendedAt: null,
    suspensionReason: null,
  },
  {
    id: "5",
    name: "정스프린트",
    email: "runner5@example.com",
    phone: "010-5678-9012",
    status: "inactive",
    joinDate: "2024-01-10",
    lastLogin: "2024-02-28 16:30",
    suspendedAt: null,
    suspensionReason: null,
  },
];

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
};

const statusLabels = {
  active: "활성",
  inactive: "비활성",
  pending: "대기",
};

export default function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState(mockUsers);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSuspendUser = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: "suspended",
              suspendedAt: new Date().toISOString(),
              suspensionReason: "관리자에 의한 정지",
            }
          : user
      )
    );
  };

  const handleActivateUser = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: "active",
              suspendedAt: null,
              suspensionReason: null,
            }
          : user
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
            활성
          </Badge>
        );
      case "suspended":
        return (
          <Badge className='bg-red-100 text-red-800 hover:bg-red-100'>
            정지
          </Badge>
        );
      case "inactive":
        return (
          <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>
            비활성
          </Badge>
        );
      default:
        return <Badge variant='secondary'>알 수 없음</Badge>;
    }
  };

  return (
    <div className='min-h-screen pb-20 bg-gray-50'>
      {/* iOS 스타일 헤더 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Button variant='ghost' size='icon' className='rounded-full'>
                <ArrowLeft className='w-5 h-5' />
              </Button>
              <div>
                <h1 className='text-xl font-bold text-gray-900'>회원 관리</h1>
                <p className='text-sm text-gray-500'>
                  {filteredUsers.length}명의 회원
                </p>
              </div>
            </div>
            <Button
              size='sm'
              className='bg-blue-600 rounded-full hover:bg-blue-700'
            >
              <UserPlus className='w-4 h-4 mr-2' />
              추가
            </Button>
          </div>
        </div>
      </div>

      <div className='px-4 py-4 space-y-4'>
        {/* 검색 및 필터 */}
        <div className='flex space-x-3'>
          <div className='relative flex-1'>
            <Search className='absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2' />
            <Input
              placeholder='이름 또는 이메일 검색...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 bg-white border-gray-200 rounded-xl'
            />
          </div>
          <Button variant='outline' size='icon' className='rounded-xl'>
            <Filter className='w-4 h-4' />
          </Button>
        </div>

        {/* 필터 탭 */}
        <div className='flex pb-2 space-x-2 overflow-x-auto'>
          {[
            { key: "all", label: "전체", count: users.length },
            {
              key: "active",
              label: "활성",
              count: users.filter((u) => u.status === "active").length,
            },
            {
              key: "suspended",
              label: "정지",
              count: users.filter((u) => u.status === "suspended").length,
            },
            {
              key: "inactive",
              label: "비활성",
              count: users.filter((u) => u.status === "inactive").length,
            },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={statusFilter === filter.key ? "default" : "outline"}
              size='sm'
              className='rounded-full whitespace-nowrap'
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>

        {/* 사용자 목록 */}
        <div className='space-y-3'>
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              className='bg-white border-0 shadow-sm rounded-2xl'
            >
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <Avatar className='w-12 h-12'>
                      <AvatarImage src={`/avatars/${user.id}.jpg`} />
                      <AvatarFallback className='text-blue-600 bg-blue-100'>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2'>
                        <p className='font-semibold text-gray-900'>
                          {user.name}
                        </p>
                        {getStatusBadge(user.status)}
                      </div>
                      <div className='flex items-center mt-1 space-x-4'>
                        <div className='flex items-center space-x-1'>
                          <Mail className='w-3 h-3 text-gray-400' />
                          <p className='text-xs text-gray-500'>{user.email}</p>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <Phone className='w-3 h-3 text-gray-400' />
                          <p className='text-xs text-gray-500'>{user.phone}</p>
                        </div>
                      </div>
                      <div className='flex items-center mt-1 space-x-4'>
                        <div className='flex items-center space-x-1'>
                          <Calendar className='w-3 h-3 text-gray-400' />
                          <p className='text-xs text-gray-500'>
                            가입: {user.joinDate}
                          </p>
                        </div>
                        <p className='text-xs text-gray-500'>
                          최근: {user.lastLogin}
                        </p>
                      </div>
                      {user.status === "suspended" && user.suspensionReason && (
                        <p className='text-xs text-red-600 mt-1'>
                          정지 사유: {user.suspensionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full'
                      >
                        <MoreVertical className='w-4 h-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                      {user.status === "active" ? (
                        <DropdownMenuItem
                          className='text-red-600 focus:text-red-600'
                          onClick={() => handleSuspendUser(user.id)}
                        >
                          <UserX className='mr-2 h-4 w-4' />
                          활동 정지
                        </DropdownMenuItem>
                      ) : user.status === "suspended" ? (
                        <DropdownMenuItem
                          className='text-green-600 focus:text-green-600'
                          onClick={() => handleActivateUser(user.id)}
                        >
                          <UserCheck className='mr-2 h-4 w-4' />
                          활동 시작
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className='py-12 text-center'>
            <div className='mb-2 text-gray-400'>
              <Search className='w-12 h-12 mx-auto' />
            </div>
            <p className='text-gray-500'>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      <AdminBottomNavigation />
    </div>
  );
}
