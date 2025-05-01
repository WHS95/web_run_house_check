import React from "react";
import Image from "next/image";

interface HeroProps {
  username: string;
  rank: number;
  score: number;
}

const Hero: React.FC<HeroProps> = ({ username, rank, score }) => {
  return (
    <div className='relative w-full h-screen bg-primary-dark overflow-hidden'>
      {/* 배경 이미지 */}
      <div className='absolute inset-0 z-10'>
        <Image
          src='/assets/hero-background.png'
          alt='배경 이미지'
          fill
          className='object-cover opacity-70'
          priority
        />
      </div>

      {/* 그라데이션 오버레이 */}
      <div className='absolute inset-0 z-20 hero-gradient'></div>

      {/* 텍스트 콘텐츠 - 중앙 배치 */}
      <div className='absolute inset-0 z-30 flex flex-col justify-center items-center'>
        <div className='text-center max-w-md mx-auto '>
          <p className='text-[1.4rem] font-light leading-[1.3] text-left text-white'>
            안녕하세요👋🏻 {username} 님,
            <br />
            현재 랭킹은
            <br />
            <span className='ranking-text'>
              {rank}위 {score}점
            </span>{" "}
            입니다.✨
            <br />
            {rank + 1}위가 열심히 뒤따라오네요!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
