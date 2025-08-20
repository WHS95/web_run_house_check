"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MoreVertical,
  ArrowUpDown,
  Edit,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";
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
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

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

  // 검색어만 적용된 사용자 목록 (카운트 계산용)
  const searchFilteredUsers = users.filter((user) => {
    const userName = user.first_name || "";
    const userPhone = user.phone || "";
    const userEmail = user.email || "";

    return (
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userPhone.includes(searchTerm) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // 각 상태별 카운트 계산
  const getStatusCounts = () => {
    const total = searchFilteredUsers.length;
    const active = searchFilteredUsers.filter(
      (user) => user.status === "ACTIVE" || user.status === null
    ).length;
    const inactive = searchFilteredUsers.filter(
      (user) => user.status === "SUSPENDED"
    ).length;

    return {
      전체: total,
      활성: active,
      비활성: inactive,
    };
  };

  const statusCounts = getStatusCounts();

  // 최종 필터링 및 정렬된 사용자 목록
  const filteredUsers = sortUsers(
    searchFilteredUsers.filter((user) => {
      const isActive = user.status === "ACTIVE" || user.status === null;
      const matchesStatus =
        statusFilter === "전체" ||
        (statusFilter === "활성" && isActive) ||
        (statusFilter === "비활성" && !isActive);

      return matchesStatus;
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
        //console.error("사용자 상태 업데이트 실패:", error);
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
      //console.error("사용자 상태 업데이트 오류:", error);
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
        //console.error("사용자 정보 업데이트 실패:", error);
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
      //console.error("사용자 정보 업데이트 오류:", error);
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

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string | null) => {
    // status가 'ACTIVE' 또는 null이면 활성, 'SUSPENDED'면 비활성
    const isActive = status === "ACTIVE" || status === null;
    return (
      <Badge className='text-white bg-basic-gray'>
        {isActive ? "활성" : "비활성"}
      </Badge>
    );
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
        return `참석 ${sortOrder === "desc" ? "↓" : "↑"}`;
      case "joinDate":
        return `가입 ${sortOrder === "desc" ? "↓" : "↑"}`;
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
    <div className='flex overflow-hidden relative flex-col h-screen bg-basic-black'>
      {/* 검색 및 필터 - 고정 */}
      <div className='sticky top-[28px] z-10 bg-basic-black px-4 py-4 space-y-4 '>
        {/* 검색 */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
          <Input
            placeholder='이름, 전화번호 또는 이메일로 검색'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 text-white rounded-lg border-0 bg-basic-black-gray placeholder:text-gray-400'
          />
        </div>

        {/* 상태 필터 탭과 정렬 */}
        <div className='flex justify-between items-center'>
          <div className='flex space-x-2'>
            {/* 상태 필터 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-white rounded-full border-0 bg-basic-black-gray'
                >
                  <ChevronDown className='mr-1 w-4 h-4' />
                  {statusFilter}
                  <span className='ml-2 text-gray-400'>
                    {statusCounts[statusFilter as keyof typeof statusCounts]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='start'
                className='border-0 bg-basic-black-gray'
              >
                {["전체", "활성", "비활성"].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-white hover:bg-basic-gray ${
                      statusFilter === status ? "bg-basic-blue font-medium" : ""
                    }`}
                  >
                    <div className='flex justify-between items-center w-full'>
                      <span>{status}</span>
                      <span className='ml-2 text-gray-400'>
                        {statusCounts[status as keyof typeof statusCounts]}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='flex space-x-2'>
            {/* 정렬 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-white rounded-full border-0 bg-basic-black-gray'
                >
                  <ArrowUpDown className='mr-1 w-4 h-4' />
                  {getSortLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='border-0 bg-basic-black-gray'
              >
                <DropdownMenuItem
                  onClick={() => handleSort("lastAttendance")}
                  className='text-white hover:bg-basic-gray'
                >
                  참석
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSort("joinDate")}
                  className='text-white hover:bg-basic-gray'
                >
                  가입
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSort("name")}
                  className='text-white hover:bg-basic-gray'
                >
                  이름
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className='overflow-y-auto flex-1 px-4 py-4'>
        {/* 사용자 목록 */}
        <div className='space-y-3'>
          {filteredUsers.map((user) => {
            const isExpanded = expandedUsers.has(user.id);

            return (
              <Card key={user.id} className='border-0 bg-basic-black-gray'>
                <CardContent className='px-3 py-2'>
                  {/* 메인 사용자 정보 */}
                  <div className='flex justify-between items-center'>
                    <div className='flex-1'>
                      <div className='flex justify-between items-center'>
                        <div className='flex items-center space-x-2 sm:space-x-3'>
                          <div className='flex items-center space-x-2'>
                            <h3 className='text-base font-semibold text-white sm:text-lg'>
                              {getUserDisplayName(user)}
                            </h3>
                            {getStatusBadge(user.status)}
                          </div>
                        </div>

                        <div className='flex items-center space-x-2'>
                          {/* 최근 참석일 (항상 표시) */}
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              user.last_attendance_date &&
                              new Date(user.last_attendance_date) >
                                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                ? "text-basic-blue"
                                : user.last_attendance_date &&
                                  new Date(user.last_attendance_date) >
                                    new Date(
                                      Date.now() - 30 * 24 * 60 * 60 * 1000
                                    )
                                ? "text-white"
                                : "text-white"
                            }`}
                          >
                            {getDaysAgo(user.last_attendance_date)}
                          </span>

                          {/* 아코디언 토글 버튼 */}
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => toggleUserExpansion(user.id)}
                            className='p-1 w-8 h-8 transition-transform duration-200 sm:h-6 sm:w-6'
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 text-white ${
                                isExpanded ? "rotate-90" : "rotate-0"
                              }`}
                            />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='w-8 h-8 sm:w-8 sm:h-8'
                                disabled={isUpdating === user.id}
                              >
                                <MoreVertical className='w-4 h-4 text-white' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align='end'
                              className='border-0 bg-basic-black-gray'
                            >
                              <DropdownMenuItem
                                onClick={() => handleEditUser(user)}
                                className='text-white hover:bg-basic-gray'
                              >
                                <Edit className='mr-2 w-4 h-4' />
                                정보 수정
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleUserStatus(user.id)}
                                disabled={isUpdating === user.id}
                                className='text-white hover:bg-basic-gray'
                              >
                                {isUpdating === user.id
                                  ? "처리 중..."
                                  : user.status === "ACTIVE" ||
                                    user.status === null
                                  ? "비활성화"
                                  : "활성화"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 펼쳐진 상세 정보 */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className='pt-3 mt-3 border-t border-basic-gray'>
                      <div className='grid grid-cols-1 gap-3 text-sm text-gray-300 sm:grid-cols-2'>
                        <div className='flex justify-between'>
                          <span className='text-white'>연락처</span>
                          <span className='text-right break-all'>
                            {getUserContactInfo(user)}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-white'>가입일</span>
                          <span className='text-right'>
                            {formatDate(user.join_date || user.created_at)}
                          </span>
                        </div>
                        {user.birth_year && (
                          <div className='flex justify-between'>
                            <span className='text-white'>출생연도</span>
                            <span className='text-right'>
                              {user.birth_year}
                            </span>
                          </div>
                        )}
                        <div className='flex justify-between'>
                          <span className='text-white'>최근 참석일</span>
                          <span className='text-right'>
                            {user.last_attendance_date
                              ? formatDate(user.last_attendance_date)
                              : "출석 기록 없음"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className='py-8 text-center'>
            <p className='text-gray-400'>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      {/* <AdminBottomNavigation /> */}

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
