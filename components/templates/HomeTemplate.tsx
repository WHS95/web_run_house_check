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

  const crewData = {
    name: 'ETC_RUNHOUSE',
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
        <Header title={crewData.name} />
      </div>
      
      {/* 공지사항 */}
      <div className="absolute top-[120px] left-0 right-0 z-40 px-4">
        <div className="mx-auto">
          <NoticeBar noticeText={noticeText} />
        </div>
      </div>
      
      {/* 카드 섹션 - 화면 하단에 고정 */}
      <div className="absolute left-0 right-0 bottom-0 z-10">
        <div className="mx-auto">
          {/* 카드 스택 컨테이너 */}
          <div className="relative h-[380px] bg-transparent">
            {/* 파란색 랭킹 카드 - 하단에 위치 */}
            <div className="absolute bottom-0 left-0 right-0 z-40">
              <RankingCard />
            </div>
            
            {/* 보라색 출석 체크 카드 - 상단에 위치하며 파란색 카드 위로 겹침 */}
            <div className="absolute bottom-[60px] left-0 right-0 z-20">
              <AttendanceCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTemplate; 