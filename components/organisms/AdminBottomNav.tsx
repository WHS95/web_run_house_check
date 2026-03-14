"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Calendar, BarChart2 } from "lucide-react";

export default function AdminBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      href: "/admin",
      icon: Home,
      label: "홈",
      isActive:
        isActive("/admin") &&
        !isActive("/admin/user") &&
        !isActive("/admin/attendance") &&
        !isActive("/admin/stats"),
    },
    {
      href: "/admin/user",
      icon: User,
      label: "회원",
      isActive: isActive("/admin/user"),
    },
    {
      href: "/admin/attendance/calendar",
      icon: Calendar,
      label: "출석",
      isActive: isActive("/admin/attendance"),
    },
    {
      href: "/admin/stats",
      icon: BarChart2,
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
                item.isActive ? "text-rh-accent" : "text-rh-text-tertiary"
              }`}
            >
              <Icon size={22} />
              <span
                className={`text-rh-caption ${
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
