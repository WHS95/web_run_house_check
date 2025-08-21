import React, { Suspense } from "react";
import nextDynamic from "next/dynamic";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

// ⚡ 성능 최적화: 컴포넌트 프리로딩
const UltraFastRankingTemplate = nextDynamic(
  () => import("@/components/templates/UltraFastRankingTemplate"),
  {
    loading: () => (
      <div className='flex items-center justify-center min-h-screen bg-basic-black'>
        <LoadingSpinner size='lg' color='blue' />
      </div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링 (최적화됨)
  }
);

// ⚡ 동적 렌더링 강제 (실시간 데이터)
export const dynamic = "force-dynamic";

// ⚡ 페이지 메타데이터 최적화
export const metadata = {
  title: "랭킹 | RUNHOUSE",
  description: "RUNHOUSE 크루 랭킹 - 출석 및 개설 랭킹을 확인하세요",
  keywords: "랭킹, 출석, 개설, 크루, RUNHOUSE",
};

// ⚡ 고성능 로딩 폴백 컴포넌트
const RankingPageFallback = React.memo(() => (
  <div className='min-h-screen bg-basic-black'>
    <div className='pt-safe'>
      <div className='flex items-center justify-between w-full px-4 py-4 border-b border-gray-500'>
        <div className='w-16 h-6 bg-basic-black rounded animate-pulse'></div>
        <div className='w-6 h-6 bg-basic-black rounded animate-pulse'></div>
      </div>
    </div>

    {/* 랭킹 정보 스켈레톤 */}
    <div className='px-4 pt-6'>
      <div className='p-4 mb-6 bg-basic-black rounded-2xl animate-pulse'>
        <div className='w-32 h-4 mb-2 bg-basic-black rounded'></div>
        <div className='w-20 h-8 bg-basic-black rounded'></div>
      </div>

      {/* 탭 스켈레톤 */}
      <div className='flex mb-6 space-x-2'>
        <div className='w-20 h-10 bg-basic-black rounded-xl animate-pulse'></div>
        <div className='w-20 h-10 bg-basic-black rounded-xl animate-pulse'></div>
      </div>

      {/* 리스트 스켈레톤 */}
      <div className='space-y-3'>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className='flex items-center p-3 space-x-3 animate-pulse'
          >
            <div className='w-8 h-8 bg-basic-black rounded-full'></div>
            <div className='flex-1'>
              <div className='w-24 h-4 mb-1 bg-basic-black rounded'></div>
              <div className='w-16 h-3 bg-basic-black rounded'></div>
            </div>
            <div className='w-12 h-4 bg-basic-black rounded'></div>
          </div>
        ))}
      </div>
    </div>
  </div>
));
RankingPageFallback.displayName = "RankingPageFallback";

// ⚡ 컴포넌트 프리로딩 (사용자가 페이지에 접근하기 전에 미리 로드)
if (typeof window !== "undefined") {
  // 페이지 로드 후 1초 뒤에 컴포넌트 프리로드
  setTimeout(() => {
    import("@/components/templates/UltraFastRankingTemplate");
  }, 1000);
}

export default function RankingPage() {
  return (
    <Suspense fallback={<RankingPageFallback />}>
      <UltraFastRankingTemplate />
    </Suspense>
  );
}
