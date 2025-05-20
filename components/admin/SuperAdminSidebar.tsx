"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Tag, List, BarChart3, Settings } from "lucide-react";

export default function SuperAdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "대시보드",
      href: "/admin/super",
      icon: <Home size={20} />,
      active: pathname === "/admin/super",
    },
    {
      name: "크루 관리",
      href: "/admin/super/crews",
      icon: <Users size={20} />,
      active: pathname.startsWith("/admin/super/crews"),
    },
    {
      name: "초대 코드",
      href: "/admin/super/invite-codes",
      icon: <Tag size={20} />,
      active: pathname.startsWith("/admin/super/invite-codes"),
    },
    {
      name: "회원 관리",
      href: "/admin/super/members",
      icon: <List size={20} />,
      active: pathname.startsWith("/admin/super/members"),
    },
    {
      name: "통계",
      href: "/admin/super/stats",
      icon: <BarChart3 size={20} />,
      active: pathname.startsWith("/admin/super/stats"),
    },
    {
      name: "설정",
      href: "/admin/super/settings",
      icon: <Settings size={20} />,
      active: pathname.startsWith("/admin/super/settings"),
    },
  ];

  return (
    <div className='w-64 bg-white h-screen shadow-md pt-6 flex flex-col'>
      <div className='px-6 mb-6'>
        <h1 className='text-xl font-bold text-blue-600'>런하우스 관리자</h1>
        <p className='text-xs text-gray-500 mt-1'>슈퍼 관리자 콘솔</p>
      </div>

      <nav className='flex-1'>
        <ul className='space-y-1 px-3'>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  item.active
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className='mr-3'>{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className='border-t border-gray-200 mt-auto'>
        <div className='px-6 py-4'>
          <Link
            href='/'
            className='text-sm text-gray-600 hover:text-blue-600 flex items-center'
          >
            <Home size={16} className='mr-2' />
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
