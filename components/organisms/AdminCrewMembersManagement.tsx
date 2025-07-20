"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MoreVertical,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Crown,
  UserX,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { haptic } from "@/lib/haptic";
import PopupNotification, { NotificationType } from "@/components/molecules/common/PopupNotification";

interface CrewMember {
  id: string;
  first_name: string | null;
  email: string | null;
  phone: string | null;
  birth_year: number | null;
  profile_image_url: string | null;
  role_id: number | null; // user_roles 테이블의 role_id (2: ADMIN, 3: USER)
  is_crew_verified: boolean;
  created_at: string;
}

interface AdminCrewMembersManagementProps {
  crewId: string;
}

export default function AdminCrewMembersManagement({
  crewId,
}: AdminCrewMembersManagementProps) {
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // 알림 상태
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as NotificationType,
  });

  // 알림 표시 함수
  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({
      isVisible: true,
      message,
      type,
    });
  }, []);

  // 알림 닫기
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  // 멤버 목록 조회
  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/crew-members?crewId=${crewId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setMembers(result.data);
      } else {
        console.error("멤버 조회 오류:", result.error);
        haptic.error();
        showNotification("멤버 조회에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("멤버 조회 실패:", error);
      haptic.error();
      showNotification("멤버 조회 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [crewId, showNotification]);

  // 운영진 권한 토글
  const handleToggleAdmin = useCallback(
    async (userId: string, isAdmin: boolean) => {
      if (actionLoading) return;

      try {
        setActionLoading(true);
        setIsUpdating(userId);
        haptic.medium();

        const response = await fetch("/api/admin/crew-members", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, isAdmin, crewId }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          haptic.success();
          await fetchMembers(); // 목록 새로고침
          showNotification(result.message || "권한이 성공적으로 변경되었습니다.", "success");
        } else {
          haptic.error();
          showNotification(result.error || "권한 변경에 실패했습니다.", "error");
        }
      } catch (error) {
        console.error("권한 변경 실패:", error);
        haptic.error();
        showNotification("권한 변경 중 오류가 발생했습니다.", "error");
      } finally {
        setActionLoading(false);
        setIsUpdating(null);
      }
    },
    [crewId, fetchMembers, actionLoading, showNotification]
  );

  // 정렬 함수
  const sortMembers = (members: CrewMember[]) => {
    return [...members].sort((a, b) => {
      switch (sortBy) {
        case "name":
          const aName = a.first_name || "이름 없음";
          const bName = b.first_name || "이름 없음";
          return sortOrder === "asc"
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        case "joinDate":
          const aDate = new Date(a.created_at).getTime();
          const bDate = new Date(b.created_at).getTime();
          return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
        case "role":
          const aRole = a.role_id || 3;
          const bRole = b.role_id || 3;
          return sortOrder === "asc" ? aRole - bRole : bRole - aRole;
        default:
          return 0;
      }
    });
  };

  // 검색어만 적용된 멤버 목록 (카운트 계산용)
  const searchFilteredMembers = members.filter((member) => {
    const memberName = member.first_name || "";
    const memberEmail = member.email || "";
    const memberPhone = member.phone || "";

    return (
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberPhone.includes(searchTerm)
    );
  });

  // 각 상태별 카운트 계산
  const getStatusCounts = () => {
    const total = searchFilteredMembers.length;
    const admin = searchFilteredMembers.filter(
      (member) => member.role_id === 2
    ).length;
    const user = searchFilteredMembers.filter(
      (member) => member.role_id === 3 || member.role_id === null
    ).length;

    return {
      전체: total,
      운영진: admin,
      멤버: user,
    };
  };

  const statusCounts = getStatusCounts();

  // 최종 필터링 및 정렬된 멤버 목록
  const filteredMembers = sortMembers(
    searchFilteredMembers.filter((member) => {
      const isAdmin = member.role_id === 2;
      const matchesStatus =
        statusFilter === "전체" ||
        (statusFilter === "운영진" && isAdmin) ||
        (statusFilter === "멤버" && !isAdmin);

      return matchesStatus;
    })
  );

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
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

  const getSortLabel = () => {
    switch (sortBy) {
      case "name":
        return `이름 ${sortOrder === "desc" ? "↓" : "↑"}`;
      case "joinDate":
        return `가입 ${sortOrder === "desc" ? "↓" : "↑"}`;
      case "role":
        return `권한 ${sortOrder === "desc" ? "↓" : "↑"}`;
      default:
        return "정렬";
    }
  };

  const getUserDisplayName = (member: CrewMember) => {
    return member.first_name || "이름 없음";
  };

  const getUserContactInfo = (member: CrewMember) => {
    return member.phone || member.email || "연락처 없음";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const getRoleBadge = (roleId: number | null) => {
    const isAdmin = roleId === 2;

    if (isAdmin) {
      return (
        <div className='flex items-center'>
          <span className='font-medium text-yellow-700'>운영진</span>
        </div>
      );
    } else {
      return (
        <div className='flex items-center'>
          <Users className='w-4 h-4 text-gray-500 mr-1.5' />
          <span className='text-gray-600'>멤버</span>
        </div>
      );
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (isLoading) {
    return (
      <div className='space-y-[3vh] animate-pulse'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='bg-white rounded-[0.75rem] p-[4vw]'>
            <div className='flex items-center space-x-[3vw]'>
              <div className='w-[3rem] h-[3rem] bg-gray-200 rounded-full'></div>
              <div className='flex-1 space-y-[1vh]'>
                <div className='h-[1rem] bg-gray-200 rounded w-[30vw]'></div>
                <div className='h-[0.875rem] bg-gray-200 rounded w-[50vw]'></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='bg-white rounded-[0.75rem] shadow-sm border border-gray-100 overflow-hidden'>
      {/* 헤더 */}
      <div className='p-[4vw] border-b border-gray-100'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center space-x-[2vw]'>
            <Users className='w-[1.25rem] h-[1.25rem] text-blue-600' />
            <span className='text-[1.125rem] font-bold text-gray-900'>
              운영진 관리
            </span>
            <div className='ml-[1vw] px-[2vw] py-[0.5vh] bg-gray-100 rounded-full text-[0.75rem] font-medium text-gray-600'>
              {members.length}명
            </div>
          </div>
        </div>
      </div>

      <div className='p-[4vw] space-y-[3vh]'>
        {/* 검색 */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
          <Input
            placeholder='이름 또는 이메일로 검색'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 bg-white rounded-lg border-gray-200'
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
                  className='bg-white rounded-full'
                >
                  <ChevronDown className='mr-1 w-4 h-4' />
                  {statusFilter}
                  <span className='ml-2 text-gray-500'>
                    {statusCounts[statusFilter as keyof typeof statusCounts]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                {["전체", "운영진", "멤버"].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={
                      statusFilter === status ? "bg-blue-50 font-medium" : ""
                    }
                  >
                    <div className='flex justify-between items-center w-full'>
                      <span>{status}</span>
                      <span className='ml-2 text-gray-500'>
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
                  className='bg-white rounded-full'
                >
                  <ArrowUpDown className='mr-1 w-4 h-4' />
                  {getSortLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => handleSort("name")}>
                  이름
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("joinDate")}>
                  가입일
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("role")}>
                  권한
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className='space-y-3 max-h-[60vh] overflow-y-auto'>
          {filteredMembers.map((member) => {
            const isExpanded = expandedUsers.has(member.id);
            const isAdmin = member.role_id === 2;

            return (
              <Card key={member.id} className='bg-white border-gray-200'>
                <CardContent className='px-3 py-2'>
                  {/* 메인 멤버 정보 */}
                  <div className='flex justify-between items-center'>
                    <div className='flex-1'>
                      <div className='flex justify-between items-center'>
                        <div className='flex items-center space-x-2 sm:space-x-3'>
                          <div className='flex items-center space-x-2'>
                            <h3 className='text-base font-semibold text-gray-900 sm:text-lg'>
                              {getUserDisplayName(member)}
                            </h3>
                            {getRoleBadge(member.role_id)}
                          </div>
                        </div>

                        <div className='flex items-center space-x-2'>
                          {/* 아코디언 토글 버튼 */}
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => toggleUserExpansion(member.id)}
                            className='p-1 w-8 h-8 transition-transform duration-200 sm:h-6 sm:w-6'
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
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
                                disabled={isUpdating === member.id}
                              >
                                <MoreVertical className='w-4 h-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleAdmin(member.id, !isAdmin)
                                }
                                disabled={isUpdating === member.id}
                              >
                                {isUpdating === member.id
                                  ? "처리 중..."
                                  : isAdmin
                                  ? "운영진 권한 해제"
                                  : "운영진  승격"}
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
                    <div className='pt-3 mt-3 border-t border-gray-100'>
                      <div className='grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2'>
                        <div className='flex justify-between'>
                          <span className='font-bold'>연락처</span>
                          <span className='text-right break-all'>
                            {getUserContactInfo(member)}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='font-bold'>가입일</span>
                          <span className='text-right'>
                            {formatDate(member.created_at)}
                          </span>
                        </div>
                        {member.birth_year && (
                          <div className='flex justify-between'>
                            <span className='font-bold'>출생연도</span>
                            <span className='text-right'>
                              {member.birth_year}
                            </span>
                          </div>
                        )}
                        <div className='flex justify-between'>
                          <span className='font-bold'>권한</span>
                          <span className='text-right'>
                            {isAdmin ? "운영진" : "일반 멤버"}
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

        {filteredMembers.length === 0 && (
          <div className='py-8 text-center'>
            <Users className='mx-auto mb-4 w-16 h-16 text-gray-300' />
            <p className='mb-2 text-lg font-medium text-gray-500'>
              {searchTerm ? "검색 결과가 없습니다" : "등록된 멤버가 없습니다"}
            </p>
            <p className='text-gray-400'>
              {searchTerm
                ? "다른 검색어를 시도해보세요"
                : "새로운 멤버가 가입하면 여기에 표시됩니다"}
            </p>
          </div>
        )}
      </div>

      {/* 알림 팝업 */}
      <PopupNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        duration={2000}
        onClose={closeNotification}
      />
    </div>
  );
}
