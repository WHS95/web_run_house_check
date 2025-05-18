import React from "react";
import Link from "next/link";
// import Image from "next/image"; // Image 컴포넌트 제거
import { FiBell, FiMenu, FiUser } from "react-icons/fi"; // react-icons import 추가

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "RUNHOUSE" }) => {
  const mypageLink = "/mypage/1";
  return (
    <header className='flex items-center justify-between w-full px-3 py-4'>
      <div className='flex items-center justify-between w-full mx-auto'>
        <div>
          <h1 className='text-2xl font-bold tracking-wider text-white'>
            {title}
          </h1>
        </div>
        <div className='flex items-center gap-3 text-white'>
          <div className='relative w-6 h-6 cursor-pointer'>
            <Link href={mypageLink}>
              <FiUser size={24} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
