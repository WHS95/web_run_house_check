"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Timer,
  Target,
  Heart,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import PageHeader from "@/components/organisms/common/PageHeader";

const menuItems = [
  {
    icon: Calculator,
    title: "페이스 계산기",
    description: "거리, 시간, 페이스 계산",
    href: "/calculator/pace",
  },
  {
    icon: Target,
    title: "완주 시간 예측기",
    description: "기록 기반 완주 시간 예측",
    href: "/calculator/prediction",
  },
  {
    icon: Timer,
    title: "스플릿 타임 계산기",
    description: "구간별 예상 기록 계산",
    href: "/calculator/split-time",
  },
  {
    icon: Heart,
    title: "심박수 존 계산기",
    description: "나이별 트레이닝 존 계산",
    href: "/calculator/heart-rate",
  },
];

export default function MenuPage() {
  const router = useRouter();

  // Supabase 클라이언트 생성
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleItemClick = (item: (typeof menuItems)[0]) => {
    // 햅틱 피드백
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    router.push(item.href);
  };

  const handleLogout = async () => {
    try {
      // 햅틱 피드백
      if (typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate([50, 100, 50]);
      }

      // Supabase 세션 종료
      const { error } = await supabase.auth.signOut();

      if (error) {
        //console.error("로그아웃 중 오류:", error);
        alert("로그아웃 중 오류가 발생했습니다.");
        return;
      }

      // 로그인 페이지로 리다이렉트
      router.push("/auth/login");
    } catch (error) {
      //console.error("로그아웃 처리 중 예외:", error);
      alert("로그아웃 처리 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className='flex flex-col h-screen bg-basic-black'>
      <div className='fixed top-0 right-0 left-0 z-10 bg-basic-black-gray'>
        <PageHeader
          title='러닝 계산기'
          iconColor='white'
          borderColor='gray-300'
        />
      </div>

      {/* 메뉴 리스트 */}
      <div className='flex-1 overflow-y-auto px-2 py-2 pt-[80px]'>
        <div className='bg-basic-black'>
          {/* 계산기 메뉴들 */}
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                className='flex justify-between items-center px-2 py-6 w-full transition-colors hover:bg-basic-black-gray'
              >
                <div className='flex gap-3 items-center'>
                  <div className='flex justify-center items-center w-10 h-10 rounded-full bg-basic-black-gray'>
                    <IconComponent size={20} className='text-white' />
                  </div>
                  <div className='text-left'>
                    <div className='font-extrabold text-basic-blue'>
                      {item.title}
                    </div>
                    <div className='text-sm text-white'>{item.description}</div>
                  </div>
                </div>
                <ChevronRight size={20} className='text-gray-400' />
              </button>
            );
          })}

          {/* 구분선 */}
          <div className='my-4 border-t border-gray-600'></div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className='flex justify-between items-center px-2 py-6 w-full transition-colors hover:bg-red-900/20'
          >
            <div className='flex gap-3 items-center'>
              <div className='flex justify-center items-center w-10 h-10 bg-red-600 rounded-full'>
                <LogOut size={20} className='text-white' />
              </div>
              <div className='text-left'>
                <div className='font-extrabold text-red-500'>로그아웃</div>
                <div className='text-sm text-gray-400'>계정에서 로그아웃</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
