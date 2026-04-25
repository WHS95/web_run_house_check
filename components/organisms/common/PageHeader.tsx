import React from "react";

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
      className={`flex sticky top-0 z-50 items-center h-14 border-b border-rh-border ${
        backgroundColor || "bg-rh-bg-surface/72 backdrop-blur-[20px]"
      }`}
    >
      {/* 타이틀 (좌측) */}
      <div className='flex-1 pr-2 pl-4'>
        <h1 className='text-[18px] font-semibold text-white truncate'>{title}</h1>
      </div>

      {/* 우측 액션 */}
      {rightAction && (
        <div className='flex items-center pr-3'>
          {rightAction}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
