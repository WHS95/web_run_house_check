import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientHomePage from "@/components/pages/ClientHomePage";

/** 홈 페이지 스켈레톤 — 실제 레이아웃과 동일한 구조 */
function HomePageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-rh-bg-primary">
      {/* 헤더 스켈레톤 */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 pt-safe bg-rh-bg-primary">
        <div className="flex flex-col gap-1">
          <div className="h-3 w-24 rounded bg-rh-bg-surface" />
          <div className="h-5 w-36 rounded bg-rh-bg-surface" />
        </div>
        <div className="h-10 w-10 rounded-rh-md bg-rh-bg-surface" />
      </header>

      <div className="flex-1 px-4 pt-4 pb-6 space-y-5">
        {/* 공지 카드 스켈레톤 */}
        <div className="h-12 rounded-rh-lg bg-rh-bg-surface" />

        {/* 빠른 액션 3개 */}
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[72px] rounded-rh-lg bg-rh-bg-surface"
            />
          ))}
        </div>

        {/* 러닝 장소 카드 */}
        <div className="h-[62px] rounded-rh-lg bg-rh-bg-surface" />

        {/* 나의 최근 활동 섹션 */}
        <div className="h-4 w-28 rounded bg-rh-bg-surface" />
        <div className="h-[100px] rounded-rh-lg bg-rh-bg-surface" />

        {/* 최근 크루 활동 섹션 */}
        <div className="h-4 w-28 rounded bg-rh-bg-surface" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center px-4 h-14 rounded-rh-lg bg-rh-bg-surface"
            >
              <div className="h-8 w-8 rounded-full bg-rh-bg-muted" />
              <div className="flex-1 ml-3 space-y-1">
                <div className="h-3.5 w-20 rounded bg-rh-bg-muted" />
                <div className="h-3 w-32 rounded bg-rh-bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 서버 컴포넌트로 초기 데이터 로딩 최적화
async function getInitialHomeData() {
  try {
    const supabase = await createClient();

    // 서버에서 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { needsAuth: true };
    }

    // 서버에서 홈페이지 데이터 조회
    const { data: functionResult, error: functionError } = await supabase
      .schema("attendance")
      .rpc("get_home_page_data", {
        p_user_id: user.id,
      });

    if (functionError) {
      throw functionError;
    }

    if (!functionResult.success) {
      if (functionResult.error === "crew_not_verified") {
        return { needsCrewVerification: true };
      }

      // 기본 데이터 반환
      return {
        pageData: {
          userName: user.user_metadata?.full_name || user.email || "사용자",
          crewId: null,
          crewName: null,
          noticeText: null,
        },
        recentActivities: [],
      };
    }

    // 최근 출석 기록 조회 (크루 내 최근 10건)
    const crewId = functionResult.data?.crewId;
    let recentActivities: Array<{
      id: string;
      userName: string;
      location: string;
      exerciseType: string;
      time: string;
    }> = [];
    let myAttendanceDays: Array<{
      date: string;
      count: number;
    }> = [];

    if (crewId) {
      // 크루 최근 활동 + 나의 히트맵을 병렬로 조회
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString();

      const [recentResult, heatmapResult] = await Promise.all([
        // 크루 최근 활동 10건
        supabase
          .schema("attendance")
          .from("attendance_records")
          .select(`
            id,
            location,
            attendance_timestamp,
            exercise_type_id,
            user:user_id ( first_name ),
            exercise_type:exercise_type_id ( name )
          `)
          .eq("crew_id", crewId)
          .is("deleted_at", null)
          .order("attendance_timestamp", { ascending: false })
          .limit(3),
        // 나의 최근 2주 출석 기록 (히트맵용)
        supabase
          .schema("attendance")
          .from("attendance_records")
          .select("attendance_timestamp")
          .eq("crew_id", crewId)
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .gte("attendance_timestamp", twoWeeksAgoStr)
          .order("attendance_timestamp", { ascending: true }),
      ]);

      if (recentResult.data) {
        recentActivities = recentResult.data.map(
          (r: Record<string, unknown>) => {
            const ts = new Date(r.attendance_timestamp as string);
            const month = ts.getMonth() + 1;
            const day = ts.getDate();
            const hours = ts.getHours().toString().padStart(2, "0");
            const minutes = ts.getMinutes().toString().padStart(2, "0");
            const userObj = r.user as Record<string, string> | null;
            const exerciseObj = r.exercise_type as Record<
              string,
              string
            > | null;
            return {
              id: r.id as string,
              userName: userObj?.first_name ?? "멤버",
              location: (r.location as string) ?? "",
              exerciseType: exerciseObj?.name ?? "",
              time: `${month}/${day} ${hours}:${minutes}`,
            };
          }
        );
      }

      if (heatmapResult.data) {
        const dayMap = new Map<string, number>();
        heatmapResult.data.forEach((r: Record<string, unknown>) => {
          const d = new Date(r.attendance_timestamp as string);
          const key =
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0");
          dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
        });
        myAttendanceDays = Array.from(dayMap, ([date, count]) => ({
          date,
          count,
        }));
      }
    }

    return {
      pageData: functionResult.data,
      recentActivities,
      myAttendanceDays,
    };
  } catch (error) {
    // 오류 발생 시 기본 데이터 반환
    return {
      pageData: {
        userName: "사용자",
        crewId: null,
        crewName: null,
        noticeText: null,
      },
      recentActivities: [],
      myAttendanceDays: [],
    };
  }
}

export default async function HomePage() {
  const initialData = await getInitialHomeData();

  // 인증이 필요한 경우
  if (initialData.needsAuth) {
    redirect("/auth/login");
  }

  // 크루 인증이 필요한 경우
  if (initialData.needsCrewVerification) {
    redirect("/auth/verify-crew");
  }

  // 클라이언트 컴포넌트에 초기 데이터 전달
  return (
    <Suspense
      fallback={<HomePageSkeleton />}
    >
      <ClientHomePage
        initialData={initialData.pageData!}
        recentActivities={initialData.recentActivities ?? []}
        myAttendanceDays={initialData.myAttendanceDays ?? []}
      />
    </Suspense>
  );
}
