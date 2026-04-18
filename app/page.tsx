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
        <div className="h-[200px] rounded-rh-lg bg-rh-bg-surface" />
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

    // 홈페이지 RPC + 사용자 활성 상태를 병렬로 조회 (둘 다 user.id만 필요)
    const [
      { data: functionResult, error: functionError },
      { data: statusData },
    ] = await Promise.all([
      supabase
        .schema("attendance")
        .rpc("get_home_page_data", {
          p_user_id: user.id,
        }),
      supabase
        .schema("attendance")
        .from("users")
        .select(
          `
          status,
          suspension_reason,
          user_crews!inner (
            status,
            suspension_reason
          )
        `
        )
        .eq("id", user.id)
        .single(),
    ]);

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
        myAttendanceDays: [],
        activeNotice: null,
        myRanking: null,
        isDeactivated: false,
        deactivationMessage: "",
      };
    }

    // 사용자 활성 상태 확인
    let isDeactivated = false;
    let deactivationMessage = "";

    if (statusData) {
      const uStatus = statusData.status?.toLowerCase();
      const ucStatus = (
        statusData.user_crews as Array<{
          status: string | null;
          suspension_reason: string | null;
        }>
      )?.[0]?.status?.toLowerCase();

      if (
        uStatus === "suspended" ||
        uStatus === "inactive" ||
        ucStatus === "suspended" ||
        ucStatus === "inactive" ||
        ucStatus === "withdrawn"
      ) {
        isDeactivated = true;
        deactivationMessage =
          "비활성화 된 상태입니다. 운영진에게 문의바랍니다.";
      }
    }

    const crewId = functionResult.data?.crewId;
    let myAttendanceDays: Array<{
      date: string;
      count: number;
    }> = [];
    // 공지 데이터 (서버에서 미리 조회)
    let activeNotice: {
      id: string;
      title: string;
    } | null = null;
    // 나의 이번달 순위
    let myRanking: {
      attendanceRank: number | null;
      hostingRank: number | null;
    } | null = null;

    if (crewId) {
      // 4주 범위 (전후 2주)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(
          fourWeeksAgo.getDate() - 28
      );
      const fourWeeksAgoStr =
          fourWeeksAgo.toISOString();

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // 히트맵 + 공지 + 랭킹을 병렬로 조회
      const [
          heatmapResult,
          noticeResult,
          rankingResult,
      ] = await Promise.all([
        // 나의 최근 4주 출석 기록 (히트맵용)
        supabase
          .schema("attendance")
          .from("attendance_records")
          .select("attendance_timestamp")
          .eq("crew_id", crewId)
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .gte(
              "attendance_timestamp",
              fourWeeksAgoStr
          )
          .order("attendance_timestamp", {
              ascending: true,
          }),
        // 활성 공지 조회 (최신 1개)
        supabase
          .schema("attendance")
          .from("notices")
          .select("id, title")
          .eq("crew_id", crewId)
          .eq("is_active", true)
          .order("created_at", {
              ascending: false,
          })
          .limit(1)
          .maybeSingle(),
        // 이번달 랭킹 데이터
        supabase
          .schema("attendance")
          .rpc("get_ranking_data_unified", {
              p_user_id: user.id,
              target_year: currentYear,
              target_month: currentMonth,
          }),
      ]);

      if (heatmapResult.data) {
        const dayMap = new Map<string, number>();
        heatmapResult.data.forEach(
            (r: Record<string, unknown>) => {
          const d = new Date(
              r.attendance_timestamp as string
          );
          const key =
            d.getFullYear() +
            "-" +
            String(
                d.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                d.getDate()
            ).padStart(2, "0");
          dayMap.set(
              key,
              (dayMap.get(key) ?? 0) + 1
          );
        });
        myAttendanceDays = Array.from(
            dayMap,
            ([date, count]) => ({
                date,
                count,
            })
        );
      }

      // 활성 공지가 있으면 저장
      if (
          noticeResult.data?.id &&
          noticeResult.data?.title
      ) {
        activeNotice = {
          id: noticeResult.data.id,
          title: noticeResult.data.title,
        };
      }

      // 랭킹에서 현재 유저의 순위 추출
      if (rankingResult.data?.success) {
        const rd = rankingResult.data.data;
        const attItem =
            rd?.attendanceRanking?.find(
                (i: { is_current_user?: boolean }) =>
                    i.is_current_user
            );
        const hostItem =
            rd?.hostingRanking?.find(
                (i: { is_current_user?: boolean }) =>
                    i.is_current_user
            );
        myRanking = {
          attendanceRank:
              attItem?.rank ?? null,
          hostingRank:
              hostItem?.rank ?? null,
        };
      }
    }

    return {
      pageData: functionResult.data,
      myAttendanceDays,
      activeNotice,
      myRanking,
      isDeactivated,
      deactivationMessage,
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
      myAttendanceDays: [],
      activeNotice: null,
      myRanking: null,
      isDeactivated: false,
      deactivationMessage: "",
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
        myAttendanceDays={
            initialData.myAttendanceDays ?? []
        }
        activeNotice={
            initialData.activeNotice ?? null
        }
        myRanking={
            initialData.myRanking ?? null
        }
        isDeactivated={
            initialData.isDeactivated ?? false
        }
        deactivationMessage={
            initialData.deactivationMessage ?? ""
        }
      />
    </Suspense>
  );
}
