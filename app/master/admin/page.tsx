"use client";

import React, { useEffect, useState } from "react";
import { LayoutDashboard, Building2, Key, Shield, Menu, X } from "lucide-react";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";
import { haptic } from "@/lib/haptic";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

// 개별 컴포넌트 임포트
import MasterDashboard from "@/components/organisms/master/MasterDashboard";
import CrewManagement from "@/components/organisms/master/CrewManagement";
import InviteCodeManagement from "@/components/organisms/master/InviteCodeManagement";

interface Crew {
  id: string;
  name: string;
  description: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface InviteCode {
  id: number;
  crew_id: string;
  invite_code: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  crew_name?: string;
}

const sidebarItems = [
  {
    id: "dashboard",
    label: "대시보드",
    icon: LayoutDashboard,
    description: "전체 현황 및 통계",
  },
  {
    id: "crews",
    label: "크루 관리",
    icon: Building2,
    description: "크루 생성 및 관리",
  },
  {
    id: "invite-codes",
    label: "초대 코드",
    icon: Key,
    description: "초대 코드 생성 및 관리",
  },
];

export default function MasterAdminPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 알림 상태
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  // 알림 표시 함수
  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 데이터 로드
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [crewsResponse, codesResponse] = await Promise.all([
        fetch("/api/master/crews"),
        fetch("/api/master/invite-codes"),
      ]);

      if (crewsResponse.ok) {
        const crewsResult = await crewsResponse.json();
        if (crewsResult.success) {
          setCrews(crewsResult.data || []);
        }
      }

      if (codesResponse.ok) {
        const codesResult = await codesResponse.json();
        if (codesResult.success) {
          setInviteCodes(codesResult.data || []);
        }
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      showNotification("데이터를 불러오는데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 사이드바 아이템 클릭
  const handleSidebarItemClick = (itemId: string) => {
    setActiveSection(itemId);
    setSidebarOpen(false); // 모바일에서 선택 후 사이드바 닫기
    haptic.light();
  };

  // 현재 섹션 렌더링
  const renderCurrentSection = () => {
    if (isLoading) {
      return (
        <div className='flex justify-center items-center h-64'>
          <LoadingSpinner size='lg' color='blue' />
        </div>
      );
    }

    switch (activeSection) {
      case "dashboard":
        return <MasterDashboard crews={crews} inviteCodes={inviteCodes} />;
      case "crews":
        return (
          <CrewManagement
            crews={crews}
            onCrewCreated={loadData}
            showNotification={showNotification}
          />
        );
      case "invite-codes":
        return (
          <InviteCodeManagement
            crews={crews}
            inviteCodes={inviteCodes}
            onCodeCreated={loadData}
            showNotification={showNotification}
          />
        );
      default:
        return <MasterDashboard crews={crews} inviteCodes={inviteCodes} />;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className='flex min-h-screen text-white bg-basic-black'>
      {/* 사이드바 오버레이 (모바일) */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-basic-black-gray border-r border-basic-gray transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* 사이드바 헤더 */}
        <div className='flex justify-between items-center p-4 border-b border-basic-gray'>
          <div className='flex items-center space-x-3'>
            <Shield className='w-6 h-6 text-basic-blue' />
            <div>
              <h1 className='text-lg font-semibold'>마스터 관리자</h1>
              <p className='text-xs text-gray-400'>SUPER ADMIN</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className='text-gray-400 lg:hidden hover:text-white'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className='p-4 space-y-2'>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSidebarItemClick(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors
                  ${
                    isActive
                      ? "text-white bg-basic-blue"
                      : "text-gray-300 hover:bg-basic-black hover:text-white"
                  }
                `}
              >
                <Icon className='flex-shrink-0 w-5 h-5' />
                <div className='flex-1 min-w-0'>
                  <p className='font-medium'>{item.label}</p>
                  <p className='text-xs truncate opacity-75'>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* 사이드바 푸터 */}
        <div className='absolute right-0 bottom-0 left-0 p-4 border-t border-basic-gray'>
          <div className='text-xs text-center text-gray-500'>
            RunHouse Master Admin
            <br />
            v1.0.0
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className='flex flex-col flex-1 min-h-screen'>
        {/* 모바일 헤더 */}
        <div className='p-4 border-b lg:hidden bg-basic-black-gray border-basic-gray'>
          <div className='flex justify-between items-center'>
            <button
              onClick={() => setSidebarOpen(true)}
              className='text-gray-400 hover:text-white'
            >
              <Menu className='w-6 h-6' />
            </button>
            <div className='flex items-center space-x-2'>
              <Shield className='w-5 h-5 text-basic-blue' />
              <span className='font-medium'>마스터 관리자</span>
            </div>
            <div className='w-6 h-6' /> {/* 균형을 위한 공간 */}
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className='overflow-auto flex-1 p-6 pb-24'>
          {renderCurrentSection()}
        </div>
      </div>

      {/* 알림 */}
      {notification && (
        <PopupNotification
          isVisible={!!notification}
          message={notification.message}
          type={notification.type}
          duration={3000}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
