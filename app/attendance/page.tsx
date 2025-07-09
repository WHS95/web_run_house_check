import React, { Suspense } from "react";
import nextDynamic from "next/dynamic";

// 동적 로딩으로 번들 크기 최적화
const UltraFastAttendanceTemplate = nextDynamic(
  () => import("@/components/templates/UltraFastAttendanceTemplate"),
  {
    loading: () => (
      <div className='flex justify-center items-center min-h-screen bg-basic-black'>
        <div className='w-8 h-8 rounded-full border-2 border-blue-500 animate-spin border-t-transparent'></div>
      </div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링
  }
);

// 동적 렌더링 강제 (클라이언트 렌더링)
export const dynamic = "force-dynamic";

// 페이지 메타데이터 최적화
export const metadata = {
  title: "출석 체크",
  description: "RUNHOUSE 출석 체크 페이지",
};

// 로딩 폴백 컴포넌트
const AttendancePageFallback = () => (
  <div className='min-h-screen bg-basic-black'>
    <div className='pt-safe'>
      <div className='flex items-center justify-between w-full px-4 py-4 border-b border-[#EAEAF3]'>
        <div className='w-20 h-6 rounded animate-pulse bg-basic-black'></div>
        <div className='w-6 h-6 rounded animate-pulse bg-basic-black'></div>
      </div>
    </div>
    <div className='px-4 pt-6 space-y-6'>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className='animate-pulse'>
          <div className='mb-3 w-24 h-4 rounded bg-basic-black'></div>
          <div className='h-12 rounded-xl bg-basic-black'></div>
        </div>
      ))}
    </div>
  </div>
);

export default function AttendancePage() {
  return (
    <Suspense fallback={<AttendancePageFallback />}>
      <UltraFastAttendanceTemplate />
    </Suspense>
  );
}
