"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiUser,
  FiCalendar,
  FiUsers,
  FiBarChart2,
} from "react-icons/fi";

export default function AdminBottomNav() {
  const pathname = usePathname();

  // 현재 선택된 네비게이션 아이템 확인
  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  // 아이콘 색상 결정
  const getIconColor = (path: string) => {
    return isActive(path) ? "black" : "#CBCBD7";
  };

  return (
    <nav className='fixed bottom-0 w-full border-t border-gray-200 bg-white'>
      <div className='grid grid-cols-4 h-14'>
        <Link
          href='/admin'
          className={`flex flex-col items-center justify-center ${
            isActive("/admin") &&
            !isActive("/admin/user") &&
            !isActive("/admin/attendance") &&
            !isActive("/admin/stats")
              ? "text-black"
              : "text-gray-400"
          }`}
        >
          <FiHome
            size={24}
            color={
              isActive("/admin") &&
              !isActive("/admin/user") &&
              !isActive("/admin/attendance") &&
              !isActive("/admin/stats")
                ? "black"
                : "#CBCBD7"
            }
          />
          <span
            className={`text-xs mt-1 ${
              isActive("/admin") &&
              !isActive("/admin/user") &&
              !isActive("/admin/attendance") &&
              !isActive("/admin/stats")
                ? "font-semibold"
                : ""
            }`}
          >
            홈
          </span>
        </Link>
        <Link
          href='/admin/user'
          className={`flex flex-col items-center justify-center ${
            isActive("/admin/user/list") ? "text-black" : "text-gray-400"
          }`}
        >
          <FiUser size={24} color={getIconColor("/admin/user")} />
          <span
            className={`text-xs mt-1 ${
              isActive("/admin/user") ? "font-semibold" : ""
            }`}
          >
            회원
          </span>
        </Link>
        <Link
          href='/admin/attendance/calendar'
          className={`flex flex-col items-center justify-center ${
            isActive("/admin/attendance") ? "text-black" : "text-gray-400"
          }`}
        >
          <FiCalendar size={24} color={getIconColor("/admin/attendance")} />
          <span
            className={`text-xs mt-1 ${
              isActive("/admin/attendance") ? "font-semibold" : ""
            }`}
          >
            출석
          </span>
        </Link>
        <Link
          href='/admin/stats'
          className={`flex flex-col items-center justify-center ${
            isActive("/admin/stats") ? "text-black" : "text-gray-400"
          }`}
        >
          <FiBarChart2 size={24} color={getIconColor("/admin/stats")} />
          <span
            className={`text-xs mt-1 ${
              isActive("/admin/stats") ? "font-semibold" : ""
            }`}
          >
            통계
          </span>
        </Link>
      </div>
    </nav>
  );
}
