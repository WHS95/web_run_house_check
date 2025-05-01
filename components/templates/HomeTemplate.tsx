import React from 'react';
import Header from '../organisms/Header';
import Hero from '../organisms/Hero';
import NoticeBar from '../molecules/NoticeBar';
import RankingCard from '../molecules/RankingCard';
import AttendanceCard from '../molecules/AttendanceCard';

const HomeTemplate: React.FC = () => {
  // 실제로는 API에서 가져와야 할 데이터
  const userData = {
    username: '서우혁',
    rank: 1,
    score: 15
  };
  
  const noticeText = '2024 정기런 장소 가이드입니다.';

  return (
    <div className="relative min-h-screen bg-background-dark overflow-hidden">
      {/* Hero 섹션이 화면 전체를 채움 */}
      <div className="absolute inset-0 z-0">
        <Hero username={userData.username} rank={userData.rank} score={userData.score} />
      </div>
      
      {/* 헤더 */}
      <div className="relative z-50">
        <Header />
      </div>
      
      {/* 공지사항 */}
      <div className="absolute top-[120px] left-0 right-0 z-40 px-4">
        <div className="max-w-md mx-auto">
          <NoticeBar noticeText={noticeText} />
        </div>
      </div>
      
      {/* 카드 섹션 - 화면 하단에 고정 */}
      <div className="absolute left-0 right-0 bottom-0 z-40">
        <div className="relative">
          {/* 랭킹 카드 - 뒤에 위치 */}
          <div className="absolute -top-[280px] inset-x-0 z-10">
            <RankingCard />
          </div>
          
          {/* 출석 체크 카드 - 앞에 위치 */}
          <div className="absolute -top-[150px] inset-x-0 z-20">
            <AttendanceCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTemplate; 