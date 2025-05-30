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
      <Link href={backLink} className='absolute left-0 px-3'>
        <FiChevronLeft size={24} color={iconColor} />
      </Link>
      <h1 className={`text-base font-semibold ${textColor}`}>{title}</h1>
      {rightAction && (
        <div className='absolute right-0 px-3'>{rightAction}</div>
      )}
    </header>
  );
};

export default PageHeader;
