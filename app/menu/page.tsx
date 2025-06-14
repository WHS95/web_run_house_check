"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  Bell,
  User,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    icon: User,
    title: "프로필 설정",
    description: "개인 정보 수정",
    href: "/mypage",
  },
  {
    icon: Bell,
    title: "알림 설정",
    description: "푸시 알림 관리",
    href: "/settings/notifications",
  },
  {
    icon: Settings,
    title: "앱 설정",
    description: "언어, 테마 등",
    href: "/settings",
  },
  {
    icon: Shield,
    title: "개인정보 처리방침",
    description: "개인정보 보호 정책",
    href: "/privacy",
  },
  {
    icon: HelpCircle,
    title: "고객센터",
    description: "문의 및 도움말",
    href: "/support",
  },
  {
    icon: LogOut,
    title: "로그아웃",
    description: "계정에서 로그아웃",
    action: "logout",
  },
];

export default function MenuPage() {
  const router = useRouter();

  const handleItemClick = (item: (typeof menuItems)[0]) => {
    if (item.action === "logout") {
      // 로그아웃 로직
      console.log("로그아웃 처리");
      router.push("/auth/login");
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 헤더 */}
      <div className='px-4 py-4 bg-white border-b border-gray-200'>
        <h1 className='text-xl font-bold text-gray-900'>메뉴</h1>
      </div>

      {/* 메뉴 리스트 */}
      <div className='mt-4'>
        <div className='bg-white'>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                className='flex items-center justify-between w-full px-4 py-4 transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full'>
                    <IconComponent
                      size={20}
                      className={`${
                        item.action === "logout"
                          ? "text-red-500"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div className='text-left'>
                    <div
                      className={`font-medium ${
                        item.action === "logout"
                          ? "text-red-500"
                          : "text-gray-900"
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className='text-gray-400' />
              </button>
            );
          })}
        </div>
      </div>

      {/* 앱 정보 */}
      <div className='px-4 mt-8'>
        <div className='p-4 bg-white rounded-lg'>
          <div className='text-center'>
            <h3 className='mb-1 font-semibold text-gray-900'>RunHouse</h3>
            <p className='text-sm text-gray-500'>버전 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
