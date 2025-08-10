"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EnhancedHomeTemplate from "@/components/templates/EnhancedHomeTemplate";
import SplashScreen from "@/components/molecules/common/SplashScreen";
import { haptic } from "@/lib/haptic";

// ⚡ 메모리 캐시 (1분 유효)
const cache = new Map();
const CACHE_DURATION = 60 * 1000; // 1분

const getCacheKey = (userId: string) => `home_data_${userId}`;

// ⚡ 캐시된 데이터 조회
const getCachedData = (userId: string) => {
  const key = getCacheKey(userId);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// ⚡ 데이터 캐시 저장
const setCachedData = (userId: string, data: any) => {
  const key = getCacheKey(userId);
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

interface HomePageData {
  userName: string;
  crewName: string | null;
  noticeText: string | null;
}

const HomePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pageData, setPageData] = useState<HomePageData>({
    userName: "",
    crewName: null,
    noticeText: null,
  });
  // console.log("pageData", pageData);

  // ⚡ Supabase 클라이언트 (한 번만 생성)
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // ⚡ 최적화된 데이터 로딩 (Database Function 사용)
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        // 1. 사용자 인증 확인
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/auth/login");
          return;
        }

        // 2. 캐시된 데이터 확인
        const cachedData = getCachedData(user.id);
        if (cachedData) {
          setPageData(cachedData);
          setIsLoading(false);
          return;
        }

        // 3. ⚡ Database Function으로 모든 데이터를 한 번에 조회
        const { data: functionResult, error: functionError } = await supabase
          .schema("attendance")
          .rpc("get_home_page_data", {
            p_user_id: user.id,
          });

        if (functionError) {
          console.error("Database function 오류:", functionError);
          throw functionError;
        }

        // 4. 함수 결과 처리
        if (!functionResult.success) {
          if (functionResult.error === "crew_not_verified") {
            router.push("/auth/verify-crew");
            return;
          }

          // 오류가 있어도 기본 데이터는 표시
          const fallbackData = functionResult.data || {
            userName: user.user_metadata?.full_name || user.email || "사용자",
            crewName: null,
            noticeText: null,
          };

          setPageData(fallbackData);
          setCachedData(user.id, fallbackData);
          setIsLoading(false);
          return;
        }

        // 5. 성공적으로 데이터를 가져온 경우
        const finalData = functionResult.data;
        // console.log("finalData", finalData);
        setPageData(finalData);
        setCachedData(user.id, finalData);
      } catch (error) {
        console.error("홈 데이터 로딩 오류:", error);
        haptic.error();

        // 오류 발생 시 기본 데이터 설정
        const fallbackData = {
          userName: "사용자",
          crewName: null,
          noticeText: null,
        };
        setPageData(fallbackData);
      } finally {
        // 최소 1초는 스플래시 화면을 보여줌 (너무 빠르게 사라지는 것 방지)
        setTimeout(() => {
          setIsLoading(false);
        }, Math.max(1000 - (Date.now() % 1000), 500));
      }
    };

    loadHomeData();
  }, [supabase, router]);

  // ⚡ 스플래시 화면 표시
  if (isLoading) {
    return <SplashScreen isVisible={true} />;
  }

  return (
    <EnhancedHomeTemplate
      username={pageData.userName}
      crewName={pageData.crewName}
      rankName='Beginer' // 기본값으로 고정
      noticeText={pageData.noticeText}
    />
  );
};

export default HomePage;
