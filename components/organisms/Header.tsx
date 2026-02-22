"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FaRegUserCircle } from "react-icons/fa";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "RUNHOUSE" }) => {
  const mypageLink = "/mypage";
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 44);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <>
      {/* iOS 네비게이션 바 (스크롤 시 축소 상태) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200 ${
          isScrolled
            ? "bg-ios-elevated/72 backdrop-blur-[20px] border-b border-ios-separator"
            : "bg-transparent"
        }`}
      >
        <div className='pt-safe'>
          <div className='flex items-center justify-between w-full px-4 h-11'>
            <div className='flex items-center justify-between w-full'>
              {/* 축소 상태: 타이틀이 중앙에 표시 */}
              <div
                className={`transition-opacity duration-200 ${
                  isScrolled ? "opacity-100" : "opacity-0"
                }`}
              >
                <h1 className='text-ios-headline text-ios-label'>{title}</h1>
              </div>
              <div className='flex items-center gap-3'>
                <Link
                  href={mypageLink}
                  className='p-2 rounded-full transition-colors active:bg-ios-elevated-3'
                >
                  <div className='relative w-6 h-6 text-ios-accent'>
                    <FaRegUserCircle size={24} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Large Title (스크롤 전 표시) */}
      <div className='pt-safe'>
        <div className='h-11' />
        <div
          className={`px-4 pb-2 transition-opacity duration-200 ${
            isScrolled ? "opacity-0" : "opacity-100"
          }`}
        >
          <h1 className='text-ios-large-title text-ios-label black-han-sans-regular tracking-wider'>
            {title}
          </h1>
        </div>
      </div>
    </>
  );
};

export default Header;
