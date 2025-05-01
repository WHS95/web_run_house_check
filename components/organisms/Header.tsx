import React from "react";
import Link from "next/link";
// import Image from "next/image"; // Image 컴포넌트 제거
import { FiBell, FiMenu, FiUser } from "react-icons/fi"; // react-icons import 추가

const Header: React.FC = () => {
  const mypageLink = "/mypage/1";
  return (
    <header className='flex justify-between items-center w-full py-4 px-3'>
      <div className='max-w-md mx-auto w-full flex justify-between items-center'>
        <div>
          <h1 className='text-white text-2xl font-bold tracking-wider'>TCRC</h1>
        </div>
        <div className='flex items-center gap-3 text-white'>
          {" "}
          <div className='w-6 h-6 relative cursor-pointer'>
            {/* Hamburger 메뉴 아이콘 교체 */}
            <FiMenu size={24} />
          </div>
          <div className='w-6 h-6 relative cursor-pointer'>
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
