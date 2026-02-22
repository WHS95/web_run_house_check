"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiUser, FiCalendar, FiBarChart2 } from "react-icons/fi";

export default function AdminBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      href: "/admin",
      icon: FiHome,
      label: "홈",
      isActive:
        isActive("/admin") &&
        !isActive("/admin/user") &&
        !isActive("/admin/attendance") &&
        !isActive("/admin/stats"),
    },
    {
      href: "/admin/user",
      icon: FiUser,
      label: "회원",
      isActive: isActive("/admin/user"),
    },
    {
      href: "/admin/attendance/calendar",
      icon: FiCalendar,
      label: "출석",
      isActive: isActive("/admin/attendance"),
    },
    {
      href: "/admin/stats",
      icon: FiBarChart2,
      label: "통계",
      isActive: isActive("/admin/stats"),
    },
  ];

  return (
    <nav className='ios-tab-bar'>
      <div className='grid grid-cols-4 h-[49px]'>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:opacity-70 ${
                item.isActive ? "text-ios-accent" : "text-ios-label-tertiary"
              }`}
            >
              <Icon size={22} />
              <span
                className={`text-ios-caption ${
                  item.isActive ? "font-semibold" : ""
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className='pb-safe' />
    </nav>
  );
}
