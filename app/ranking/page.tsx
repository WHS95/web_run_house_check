import React, { Suspense } from "react";
import nextDynamic from "next/dynamic";

// 동적 로딩으로 번들 크기 최적화
const UltraFastRankingTemplate = nextDynamic(
  () => import("@/components/templates/UltraFastRankingTemplate"),
  {
    loading: () => (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent'></div>
      </div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링
  }
);

// 동적 렌더링 강제 (클라이언트 렌더링)
export const dynamic = "force-dynamic";

// 페이지 메타데이터 최적화
export const metadata = {
  title: "랭킹",
  description: "RUNHOUSE 랭킹 페이지",
};

// 로딩 폴백 컴포넌트
const RankingPageFallback = () => (
  <div className='min-h-screen bg-white'>
    <div className='pt-safe'>
      <div className='flex items-center justify-between w-full px-4 py-4 border-b border-[#EAEAF3]'>
        <div className='h-6 bg-gray-200 rounded w-16 animate-pulse'></div>
        <div className='w-6 h-6 bg-gray-200 rounded animate-pulse'></div>
      </div>
    </div>

    {/* 랭킹 정보 스켈레톤 */}
    <div className='px-4 pt-6'>
      <div className='bg-gray-100 rounded-2xl p-4 mb-6 animate-pulse'>
        <div className='h-4 bg-gray-200 rounded w-32 mb-2'></div>
        <div className='h-8 bg-gray-200 rounded w-20'></div>
      </div>

      {/* 탭 스켈레톤 */}
      <div className='flex space-x-2 mb-6'>
        <div className='h-10 bg-gray-200 rounded-xl w-20 animate-pulse'></div>
        <div className='h-10 bg-gray-200 rounded-xl w-20 animate-pulse'></div>
      </div>

      {/* 리스트 스켈레톤 */}
      <div className='space-y-3'>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className='flex items-center space-x-3 p-3 animate-pulse'
          >
            <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
            <div className='flex-1'>
              <div className='h-4 bg-gray-200 rounded w-24 mb-1'></div>
              <div className='h-3 bg-gray-200 rounded w-16'></div>
            </div>
            <div className='h-4 bg-gray-200 rounded w-12'></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function RankingPage() {
  return (
    <Suspense fallback={<RankingPageFallback />}>
      <UltraFastRankingTemplate />
    </Suspense>
  );
}
