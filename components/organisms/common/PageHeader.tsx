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
  /* 단일 sticky 엘리먼트 패턴.
     iOS Safari에서 nested sticky + GPU 레이어 조합은 overscroll/URL바 토글 시
     레이어 재합성 과정에서 sticky 위치가 일시적으로 풀려 헤더가 내려오는 현상이 발생.
     pt-safe(safe-area)는 외부 sticky에, h-14는 비-sticky 내부 div에 분리. */
  return (
    <header className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
      <div
        className={`flex items-center h-14 border-b border-rh-border ${
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
      </div>
    </header>
  );
};

export default PageHeader;
