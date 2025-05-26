import React from "react";
import Image from "next/image";

interface HeroProps {
  username: string;
  rank: string | null;
}

const Hero: React.FC<HeroProps> = ({ username, rank }) => {
  return (
    <div className='relative w-full h-screen overflow-hidden bg-black'>
      {/* 그라데이션 오버레이 */}
      <div className='absolute inset-0 z-20 hero-gradient'></div>

      {/* 텍스트 콘텐츠 - 중앙 배치 */}
      <div className='absolute inset-0 z-30 flex flex-col items-center justify-center'>
        <div className='max-w-md mx-auto text-center '>
          <p className='text-2xl font-light leading-[1.3] text-left text-white'>
            안녕하세요👋🏻 {username} 님,
            <br />
            현재 크루 내 등급은
            <br />
            <span className='ranking-text'>{rank || "등급 없음"}</span>{" "}
            입니다.✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
