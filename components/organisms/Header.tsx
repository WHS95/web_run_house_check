import React from "react";
import Link from "next/link";
// import Image from "next/image"; // Image 컴포넌트 제거
import { FaRegUserCircle } from "react-icons/fa"; // react-icons import 추가

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "RUNHOUSE" }) => {
  const mypageLink = "/mypage";
  return (
    <header className='fixed top-0 left-0 right-0 z-50 w-full bg-basic-black border-b border-gray-800/20'>
      <div className='pt-safe'>
        <div className='flex items-center justify-between w-full px-3 py-4'>
          <div className='flex items-center justify-between w-full mx-auto'>
            <div>
              <h1 className='text-2xl font-bold tracking-wider text-white black-han-sans-regular'>
                {title}
              </h1>
            </div>
            <div className='flex items-center gap-3 text-white'>
              <Link
                href={mypageLink}
                className='p-2 transition-colors rounded-lg cursor-pointer hover:bg-white/10'
              >
                <div className='relative w-6 h-6'>
                  <FaRegUserCircle size={24} />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
