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
  backgroundColor = "bg-basic-black-gray",
  backLink = "/",
  iconColor = "black",
  borderColor,
  rightAction,
}) => {
  const textColor = iconColor === "white" ? "text-white" : "text-white";

  return (
    <header
      className={`flex relative z-50 items-center py-4 border-b border-basic-gray shadow-sm ${backgroundColor}`}
    >
      <div className='flex-1 px-4'>
        {/* 
          font-thin: 100
          font-extralight: 200
          font-light: 300
          font-normal: 400
          font-medium: 500
          font-semibold: 600
          font-bold: 700
          font-extrabold: 800
          font-black: 900
        */}
        <h1 className={`text-xl font-bold ${textColor} black-han-sans-regular`}>
          {title}
        </h1>
      </div>
      {rightAction && <div className='px-3'>{rightAction}</div>}
    </header>
  );
};

export default PageHeader;
