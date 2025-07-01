"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, ArrowUpDown, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";
import UserEditModal from "@/components/molecules/UserEditModal";
import {
  UserForAdmin,
  updateUserStatus,
  updateUserInfo,
} from "@/lib/supabase/admin";
import { useAdminContext } from "@/app/admin/AdminContextProvider";

interface AdminUserManagementProps {
  initialUsers: UserForAdmin[];
}

// 오늘 기준 몇일 전인지 계산하는 함수
const getDaysAgo = (dateString: string | null): string => {
  if (!dateString) return "출석 기록 없음";

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정

  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "1일 전";
  if (diffDays > 1) return `${diffDays}일 전`;
  if (diffDays === -1) return "1일 후";
  return `${Math.abs(diffDays)}일 후`;
};

export default function AdminUserManagement({
  initialUsers,
}: AdminUserManagementProps) {
  const { crewId } = useAdminContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [sortBy, setSortBy] = useState("lastAttendance"); // 기본값: 최근 참석일
  const [sortOrder, setSortOrder] = useState("desc"); // desc: 최신순, asc: 오래된순
  const [users, setUsers] = useState(initialUsers);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserForAdmin | null>(null);

  // 정렬 함수
  const sortUsers = (users: UserForAdmin[]) => {
    return [...users].sort((a, b) => {
      switch (sortBy) {
        case "lastAttendance":
          const aDate = a.last_attendance_date
            ? new Date(a.last_attendance_date).getTime()
            : 0;
          const bDate = b.last_attendance_date
            ? new Date(b.last_attendance_date).getTime()
            : 0;
          return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
        case "joinDate":
          const aJoinDate = a.join_date
            ? new Date(a.join_date).getTime()
            : new Date(a.created_at).getTime();
          const bJoinDate = b.join_date
            ? new Date(b.join_date).getTime()
            : new Date(b.created_at).getTime();
          return sortOrder === "desc"
            ? bJoinDate - aJoinDate
            : aJoinDate - bJoinDate;
        case "name":
          const aName = a.first_name || "이름 없음";
          const bName = b.first_name || "이름 없음";
          return sortOrder === "asc"
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        default:
          return 0;
      }
    });
  };

  const filteredUsers = sortUsers(
    users.filter((user) => {
      const userName = user.first_name || "";
      const userPhone = user.phone || "";
      const userEmail = user.email || "";

      const matchesSearch =
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userPhone.includes(searchTerm) ||
        userEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const isActive = user.status === "ACTIVE" || user.status === null;
      const matchesStatus =
        statusFilter === "전체" ||
        (statusFilter === "활성" && isActive) ||
        (statusFilter === "비활성" && !isActive);

      return matchesSearch && matchesStatus;
    })
  );

  const handleToggleUserStatus = async (userId: string) => {
    setIsUpdating(userId);

    try {
      const currentUser = users.find((u) => u.id === userId);
      if (!currentUser) return;

      const isCurrentlyActive =
        currentUser.status === "ACTIVE" || currentUser.status === null;
      const newStatus = !isCurrentlyActive;
      const { error } = await updateUserStatus(userId, crewId, newStatus);

      if (error) {
        console.error("사용자 상태 업데이트 실패:", error);
        alert("사용자 상태 변경에 실패했습니다.");
        return;
      }

      // 로컬 상태 업데이트
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, status: newStatus ? "ACTIVE" : "SUSPENDED" }
            : user
        )
      );
    } catch (error) {
      console.error("사용자 상태 업데이트 오류:", error);
      alert("사용자 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleEditUser = (user: UserForAdmin) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleSaveUserInfo = async (userData: {
    first_name: string;
    phone: string;
    birth_year: number;
  }) => {
    if (!selectedUser) return;

    try {
      const { error } = await updateUserInfo(selectedUser.id, userData);

      if (error) {
        console.error("사용자 정보 업데이트 실패:", error);
        alert("사용자 정보 수정에 실패했습니다.");
        return;
      }

      // 로컬 상태 업데이트
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, ...userData } : user
        )
      );

      setEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("사용자 정보 업데이트 오류:", error);
      alert("사용자 정보 수정 중 오류가 발생했습니다.");
    }
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const getStatusBadge = (status: string | null) => {
    // status가 'ACTIVE' 또는 null이면 활성, 'SUSPENDED'면 비활성
    const isActive = status === "ACTIVE" || status === null;

    if (isActive) {
      return (
        <Badge className='text-green-800 bg-green-100 hover:bg-green-100'>
          활성
        </Badge>
      );
    } else {
      return (
        <Badge className='text-gray-800 bg-gray-100 hover:bg-gray-100'>
          비활성
        </Badge>
      );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "정보 없음";

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

  const getUserDisplayName = (user: UserForAdmin) => {
    return user.first_name || "이름 없음";
  };

  const getUserContactInfo = (user: UserForAdmin) => {
    return user.phone || user.email || "연락처 없음";
  };

  return (
    <div className='flex overflow-hidden relative flex-col h-screen bg-gray-50'>
      {/* 검색 및 필터 - 고정 */}
      <div className='fixed top-0 right-0 left-0 z-50 px-4 py-4 space-y-4 bg-gray-50 border-b border-gray-100'>
        {/* 검색 */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
          <Input
            placeholder='이름, 전화번호 또는 이메일로 검색'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 bg-white rounded-lg border-gray-200'
          />
        </div>

        {/* 상태 필터 탭과 정렬 */}
        <div className='flex justify-between items-center'>
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
                <ArrowUpDown className='mr-1 w-4 h-4' />
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
      <div className='overflow-y-auto flex-1 px-4 pt-32 pb-24'>
        {/* 사용자 목록 */}
        <div className='space-y-3'>
          {filteredUsers.map((user) => (
            <Card key={user.id} className='bg-white border-gray-200'>
              <CardContent className='p-4'>
                <div className='flex justify-between items-center'>
                  <div className='flex-1'>
                    <div className='flex justify-between items-center mb-2'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex items-center space-x-2'>
                          <h3 className='font-semibold text-gray-900'>
                            {getUserDisplayName(user)}
                          </h3>
                          {user.birth_year && (
                            <span className='text-sm text-gray-500'>
                              ({user.birth_year}년생)
                            </span>
                          )}
                        </div>
                        {getStatusBadge(user.status)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='w-8 h-8'
                            disabled={isUpdating === user.id}
                          >
                            <MoreVertical className='w-4 h-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className='mr-2 w-4 h-4' />
                            정보 수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleUserStatus(user.id)}
                            disabled={isUpdating === user.id}
                          >
                            {isUpdating === user.id
                              ? "처리 중..."
                              : user.status === "ACTIVE" || user.status === null
                              ? "비활성화"
                              : "활성화"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className='space-y-1 text-sm text-gray-600'>
                      <div className='flex justify-between'>
                        <span>연락처</span>
                        <span>{getUserContactInfo(user)}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>가입일</span>
                        <span>
                          {formatDate(user.join_date || user.created_at)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>최근 참석일</span>
                        <span
                          className={`font-medium ${
                            user.last_attendance_date &&
                            new Date(user.last_attendance_date) >
                              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                              ? "text-green-600"
                              : user.last_attendance_date &&
                                new Date(user.last_attendance_date) >
                                  new Date(
                                    Date.now() - 30 * 24 * 60 * 60 * 1000
                                  )
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {getDaysAgo(user.last_attendance_date)}
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

      {/* 사용자 정보 수정 모달 */}
      {selectedUser && (
        <UserEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={handleSaveUserInfo}
        />
      )}
    </div>
  );
}
