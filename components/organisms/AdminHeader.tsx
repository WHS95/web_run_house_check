// "use client";

// export default function AdminHeader() {
//   return (
//     <header className='bg-white border-b border-gray-200'>
//       <div className='flex items-center justify-center h-12'>
//         <h1 className='text-xl font-bold'>TCRC Admin</h1>
//       </div>
//       <div className='h-1 bg-gray-200'></div>
//     </header>
//   );
// }

import React from "react";
import Link from "next/link";
// import Image from "next/image"; // Image 컴포넌트 제거
import { FiBell, FiMenu, FiUser } from "react-icons/fi"; // react-icons import 추가

const Header: React.FC = () => {
  const mypageLink = "/mypage/1";
  return (
    <header className='flex items-center justify-between w-full p-4 bg-black'>
      <div className='flex items-center justify-between w-full mx-auto'>
        <div>
          <h1 className='text-2xl font-bold tracking-wider text-white'>TCRC</h1>
        </div>
        <div className='flex items-center gap-3 text-white'></div>
      </div>
    </header>
  );
};

export default Header;
