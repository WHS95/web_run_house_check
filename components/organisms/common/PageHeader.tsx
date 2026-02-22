import React from "react";
import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";

interface PageHeaderProps {
  title: string;
  backLink?: string;
  iconColor?: "white" | "black";
  borderColor?: string;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  backgroundColor,
  backLink = "/",
  iconColor = "white",
  borderColor,
  rightAction,
}) => {
  return (
    <header
      className={`flex relative z-50 items-center h-11 border-b border-ios-separator ${
        backgroundColor || "bg-ios-elevated/72 backdrop-blur-[20px]"
      }`}
    >
      {/* 뒤로가기 버튼 */}
      {backLink && (
        <Link
          href={backLink}
          className='flex items-center pl-2 pr-1 h-full text-ios-accent active:opacity-70 transition-opacity'
        >
          <FiChevronLeft size={24} />
        </Link>
      )}

      {/* 타이틀 (중앙) */}
      <div className='flex-1 px-2'>
        <h1 className='text-ios-headline text-ios-label truncate'>{title}</h1>
      </div>

      {/* 우측 액션 */}
      {rightAction && <div className='px-3'>{rightAction}</div>}
    </header>
  );
};

export default PageHeader;
