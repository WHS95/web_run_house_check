"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  BarChart3,
  Shield,
  Menu,
  X
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAdminContext } from "@/app/admin/AdminContextProvider";
import { haptic } from "@/lib/haptic";

const sidebarItems = [
  {
    id: "dashboard",
    label: "대시보드",
    href: "/admin",
    icon: Home,
    description: "크루 현황 및 통계",
  },
  {
    id: "user",
    label: "회원 관리",
    href: "/admin/user", 
    icon: Users,
    description: "멤버 관리 및 권한 설정",
  },
  {
    id: "attendance",
    label: "출석 관리",
    href: "/admin/attendance",
    icon: Calendar,
    description: "출석 기록 및 관리",
  },
  {
    id: "analyze",
    label: "통계 분석",
    href: "/admin/analyze",
    icon: BarChart3,
    description: "데이터 분석 및 리포트",
  },
  {
    id: "settings",
    label: "설정",
    href: "/admin/settings",
    icon: Settings,
    description: "크루 설정 및 관리",
  },
];

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const { firstName } = useAdminContext();

  // 현재 활성 섹션 확인
  const getActiveSection = () => {
    const currentItem = sidebarItems.find(item => {
      if (item.href === "/admin") {
        return pathname === "/admin";
      }
      return pathname.startsWith(item.href);
    });
    return currentItem?.id || "dashboard";
  };

  const activeSection = getActiveSection();

  // 사이드바 아이템 클릭
  const handleSidebarItemClick = () => {
    setSidebarOpen(false); // 모바일에서 선택 후 사이드바 닫기
    haptic.light();
  };

  return (
    <>
      {/* 사이드바 오버레이 (모바일) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
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
        <div className="flex justify-between items-center p-4 border-b border-basic-gray">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-basic-blue" />
            <div>
              <h1 className="text-lg font-semibold text-white">크루 관리자</h1>
              <p className="text-xs text-gray-400">{firstName || "CREW MANAGER"}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 lg:hidden hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <Link 
                key={item.id} 
                href={item.href}
                onClick={handleSidebarItemClick}
              >
                <button
                  className={`
                    w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors
                    ${
                      isActive
                        ? "text-white bg-basic-blue"
                        : "text-gray-300 hover:bg-basic-black hover:text-white"
                    }
                  `}
                >
                  <Icon className="flex-shrink-0 w-5 h-5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs truncate opacity-75">
                      {item.description}
                    </p>
                  </div>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* 사이드바 푸터 */}
        <div className="absolute right-0 bottom-0 left-0 p-4 border-t border-basic-gray">
          <div className="text-xs text-center text-gray-500">
            RunHouse Admin
            <br />
            v1.0.0
          </div>
        </div>
      </div>
    </>
  );
}