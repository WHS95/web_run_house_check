import React from "react";
import Link from "next/link";
import { Home, Users, CalendarDays, MessageCircle, BarChart3 } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  icon: Icon,
  label,
  isActive,
}) => {
  const color = isActive ? "text-black" : "text-[#ACACBB]";
  const fontWeight = isActive ? "font-semibold" : "font-normal";

  return (
    <Link
      href={href}
      className='flex flex-col items-center justify-center flex-1'
    >
      <Icon className={`w-6 h-6 mb-1 ${color}`} />
      <span className={`text-xs ${fontWeight} ${color}`}>{label}</span>
    </Link>
  );
};

const ManagerBottomNav: React.FC = () => {
  // TODO: 현재 경로에 따라 isActive 상태 관리 필요
  const currentPath = "/manager/members"; // 예시: 현재 경로

  const navItems = [
    { href: "/manager", icon: Home, label: "홈" },
    { href: "/manager/members", icon: Users, label: "회원" },
    { href: "/manager/attendance", icon: CalendarDays, label: "출석" },
    { href: "/manager/meetings", icon: MessageCircle, label: "모임" },
    { href: "/manager/stats", icon: BarChart3, label: "통계" },
  ];

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-white border-t border-[#E3E3EA] flex h-16'>
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          isActive={currentPath.startsWith(item.href)} // 간단한 활성 상태 확인
        />
      ))}
    </nav>
  );
};

export default ManagerBottomNav;
