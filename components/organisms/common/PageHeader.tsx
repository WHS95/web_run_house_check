import React from "react";
import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";

interface PageHeaderProps {
  title: string;
  backLink?: string;
  iconColor?: "white" | "black";
  borderColor?: string;
  rightAction?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  backLink = "/",
  iconColor = "black",
  borderColor,
  rightAction,
}) => {
  const textColor = iconColor === "white" ? "text-white" : "text-black";
  const borderClass = borderColor ? `border-b border-${borderColor}` : "";

  return (
    <header
      className={`relative flex items-center justify-center  py-4 ${borderClass}`}
    >
      <Link
        href={backLink}
        className='absolute left-0 px-3 py-2 transition-all duration-150 ease-in-out rounded-lg hover:bg-black/5 active:bg-black/10 active:scale-95'
      >
        <FiChevronLeft
          size={24}
          color={iconColor}
          className='transition-transform duration-150 ease-in-out'
        />
      </Link>
      <h1 className={`text-base font-semibold ${textColor}`}>{title}</h1>
      {rightAction && (
        <div className='absolute right-0 px-3'>{rightAction}</div>
      )}
    </header>
  );
};

export default PageHeader;
