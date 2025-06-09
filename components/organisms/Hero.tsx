import React from "react";

interface HeroProps {
  username: string;
  crewName: string | null;
  // rank: string | null;
}

const Hero: React.FC<HeroProps> = ({ username, crewName }) => {
  return (
    <div className='relative w-full min-h-screen '>
      {/* 텍스트 콘텐츠 - 헤더와 출석카드 사이 중앙 배치 */}
      <div className='absolute inset-0 z-30 flex flex-col items-center justify-center'>
        <div className='max-w-md mx-auto text-center '>
          <p className='text-2xl font-light leading-[1.3] text-left text-white'>
            안녕하세요 👋🏻
            <br />
            {crewName && (
              <span className='text-2xl font-bold text-[#95bdf4]'>
                {crewName}
              </span>
            )}
            <br />
            <span className='text-2xl font-bold text-white'>
              {username} 님,
            </span>
            <br />
            오늘도 즐거운
            <br />
            러닝 하세요!
            <br />
            {/* <span className='ranking-text'>{rank || "등급 없음"}</span>{" "}
            입니다.✨ */}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
