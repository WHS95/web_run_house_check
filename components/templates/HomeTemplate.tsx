import React from 'react';
import Header from '../organisms/Header';
import Hero from '../organisms/Hero';
import NoticeBar from '../molecules/NoticeBar';
import RankingCard from '../molecules/RankingCard';
import AttendanceCard from '../molecules/AttendanceCard';

interface HomeTemplateProps {
  username: string | null; // 비로그인 상태 등 고려하여 null 허용 가능
  rankName: string | null; // 등급 정보가 없을 수도 있음
  crewName: string | null; // 크루 정보가 없을 수도 있음
  noticeText: string | null;
}

const HomeTemplate: React.FC<HomeTemplateProps> = ({
  username,
  rankName,
  crewName,
  noticeText,
}) => {
  // Hero에 전달할 rank 값은 rankName으로 대체하거나, Hero 내부에서 rankName을 어떻게 표시할지 결정 필요
  // 우선 rankName을 rank prop으로 전달하고, score는 제거.
  // Hero 컴포넌트도 이 변경에 맞춰 수정 필요할 수 있음.
  const heroRankDisplay = rankName; // 또는 별도 포맷팅

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Hero 섹션이 화면 전체를 채움 */}
      <div className="absolute inset-0 z-0">
        {username && ( // username이 있을 때만 Hero 렌더링 (예시)
          <Hero
            username={username}
            rank={heroRankDisplay} /* rankName 또는 포맷팅된 값 */
            // score prop 제거
          />
        )}
      </div>

      {/* 헤더 */}
      <div className="relative z-50">
        <Header title={"RUN HOUSE"} /> {/* 크루 이름이 없으면 기본값 */}
      </div>

      {/* 공지사항 */}
      {noticeText && (
        <div className="absolute top-[120px] left-0 right-0 z-40 px-4">
          <div className="mx-auto">
            <NoticeBar noticeText={noticeText} />
          </div>
        </div>
      )}

      {/* 카드 섹션 - 화면 하단에 고정 */}
      <div className="absolute left-0 right-0 bottom-0 z-10">
        <div className="mx-auto">
          {/* 카드 스택 컨테이너 */}
          <div className="relative h-[400px] bg-transparent">
            {/* 파란색 랭킹 카드 - 하단에 위치 */}
            <div className="absolute bottom-0 left-0 right-0 z-40">
              <RankingCard />
            </div>

            {/* 보라색 출석 체크 카드 - 상단에 위치하며 파란색 카드 위로 겹침 */}
            <div className="absolute bottom-[90px] left-0 right-0 z-20">
              <AttendanceCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTemplate; 