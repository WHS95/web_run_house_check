"use client";

import React, { useState, useEffect } from "react";
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
    href: "/admin/analyze",
    icon: BarChart3,
    isComingSoon: false,
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

  /* Bottom Inset Layer System: 마운트 시 CSS 변수 설정 */
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--rh-bottom-inset',
      'calc(4.5rem + env(safe-area-inset-bottom, 0px))'
    );
    return () => {
      document.documentElement.style.setProperty('--rh-bottom-inset', '0px');
    };
  }, []);

  const handleComingSoonClick = (itemName: string) => {
    setModalContent({
      title: "공지",
      content: `기능 추후 제공 예정이니 기대해 주세요😁`,
    });
    setIsModalOpen(true);
  };

  return (
    <>
      <div className='fixed right-0 bottom-0 left-0 z-40 border-t bg-rh-bg-surface border-rh-border safe-area-pb'>
        <div className='flex justify-around items-center px-2 py-2'>
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
                    className={`flex flex-col justify-center items-center px-1 py-2 w-full h-auto text-rh-text-secondary rounded-xl`}
                  >
                    <item.icon className='mb-1 w-5 h-5 text-rh-text-secondary' />
                    <span className='text-xs font-medium text-rh-text-secondary'>
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
                    isActive ? "text-rh-accent" : "text-rh-text-secondary"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 mb-1 ${
                      isActive ? "text-rh-accent" : "text-rh-text-secondary"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-rh-accent" : "text-rh-text-secondary"
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
