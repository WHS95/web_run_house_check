"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Users, Calendar, Settings, BarChart3 } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import NoticeModal from "@/components/molecules/NoticeModal";

const navigationItems = [
  {
    name: "대시보드",
    href: "/admin",
    icon: Home,
    isComingSoon: false,
  },
  {
    name: "회원",
    href: "/admin/user",
    icon: Users,
    isComingSoon: false,
  },
  {
    name: "출석",
    href: "/admin/attendance",
    icon: Calendar,
    isComingSoon: false,
  },
  {
    name: "통계",
    href: "/admin/analytics",
    icon: BarChart3,
    isComingSoon: true,
  },
  {
    name: "설정",
    href: "/admin/settings",
    icon: Settings,
    isComingSoon: false,
  },
];

export default function AdminBottomNavigation() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    content: "",
  });

  const handleComingSoonClick = (itemName: string) => {
    setModalContent({
      title: "공지",
      content: `기능 추후 제공 예정이니 기대해 주세요😁`,
    });
    setIsModalOpen(true);
  };

  return (
    <>
      <div className='fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb'>
        <div className='flex items-center justify-around px-2 py-2'>
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            if (item.isComingSoon) {
              return (
                <button
                  key={item.name}
                  onClick={() => handleComingSoonClick(item.name)}
                  className='flex-1'
                >
                  <div
                    className={`w-full h-auto flex flex-col items-center justify-center py-2 px-1 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50`}
                  >
                    <item.icon className='w-5 h-5 mb-1 text-gray-500' />
                    <span className='text-xs font-medium text-gray-500'>
                      {item.name}
                    </span>
                  </div>
                </button>
              );
            }

            return (
              <Link key={item.name} href={item.href} className='flex-1'>
                <Button
                  variant='ghost'
                  className={`w-full h-auto flex flex-col items-center justify-center py-2 px-1 rounded-xl ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 mb-1 ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.name}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      <NoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
        buttonText='완료'
      />
    </>
  );
}
