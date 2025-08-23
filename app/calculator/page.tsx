"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// 동적 로딩으로 번들 크기 최적화
const PageHeader = dynamic(() => import("@/components/organisms/common/PageHeader"), {
  ssr: true,
});

const calculatorItems = [
  {
    title: "페이스 계산기",
    description: "거리, 시간, 페이스 계산",
    href: "/calculator/pace",
  },
  {
    title: "완주 시간 예측기",
    description: "기록 기반 완주 시간 예측",
    href: "/calculator/prediction",
  },
  {
    title: "스플릿 타임 계산기",
    description: "구간별 예상 기록 계산",
    href: "/calculator/split-time",
  },
  {
    title: "심박수 존 계산기",
    description: "나이별 트레이닝 존 계산",
    href: "/calculator/heart-rate",
  },
];

export default function CalculatorPage() {
  const router = useRouter();

  // 모든 계산기 페이지들을 미리 prefetch
  useEffect(() => {
    const calculatorRoutes = [
      "/calculator/pace",
      "/calculator/prediction", 
      "/calculator/split-time",
      "/calculator/heart-rate"
    ];

    // 각 계산기 페이지를 순차적으로 prefetch
    calculatorRoutes.forEach((route, index) => {
      // 약간의 딜레이를 두고 순차적으로 prefetch하여 네트워크 부하 최소화
      setTimeout(() => {
        router.prefetch(route);
      }, index * 100);
    });
  }, [router]);

  return (
    <div className='flex flex-col h-screen bg-basic-black'>
      <div className='fixed top-0 right-0 left-0 z-10 bg-basic-black-gray'>
        <PageHeader
          title='러닝 계산기'
          iconColor='white'
          borderColor='gray-300'
        />
      </div>

      <div className='flex-1 overflow-y-auto px-2 py-2 pt-[80px]'>
        <div className='bg-basic-black'>
          {calculatorItems.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.href)}
              onMouseEnter={() => router.prefetch(item.href)}
              onFocus={() => router.prefetch(item.href)}
              className='flex justify-between items-center px-2 py-6 w-full transition-colors hover:bg-basic-black-gray'
            >
              <div className='flex gap-3 items-center'>
                <div className='text-left'>
                  <div className='font-extrabold text-basic-blue'>
                    {item.title}
                  </div>
                  <div className='text-sm text-white'>{item.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}