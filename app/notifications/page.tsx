import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

const NotificationsTemplate = nextDynamic(
    () => import("@/components/templates/NotificationsTemplate"),
    {
        loading: () => (
            <div className="flex justify-center items-center min-h-screen bg-rh-bg-primary">
                <LoadingSpinner size="sm" color="white" />
            </div>
        ),
        ssr: true,
    }
);

export const dynamic = "force-dynamic";

export const metadata = {
    title: "알림 | RUNHOUSE",
    description: "RUNHOUSE 알림 - 공지사항과 개인 알림을 확인하세요",
};

async function getNotificationsData() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { needsAuth: true };
        }

        // 크루 정보 조회
        const { data: userCrew } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_id")
            .eq("user_id", user.id)
            .eq("status", "ACTIVE")
            .single();

        if (!userCrew) {
            return { needsAuth: true };
        }

        const crewId = userCrew.crew_id;

        // 공지사항 + 개인 알림 병렬 조회
        const [noticesResult, notificationsResult] = await Promise.all([
            supabase
                .schema("attendance")
                .from("notices")
                .select("*, author:author_id(first_name)")
                .eq("crew_id", crewId)
                .order("created_at", { ascending: false })
                .limit(30),
            supabase
                .schema("attendance")
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .eq("crew_id", crewId)
                .order("created_at", { ascending: false })
                .limit(30),
        ]);

        // 읽지 않은 알림 수
        const { count: unreadCount } = await supabase
            .schema("attendance")
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .eq("is_read", false);

        return {
            crewId,
            notices: noticesResult.data ?? [],
            notifications: notificationsResult.data ?? [],
            unreadCount: unreadCount ?? 0,
        };
    } catch {
        return { needsAuth: true };
    }
}

export default async function NotificationsPage() {
    const data = await getNotificationsData();

    if (data.needsAuth) {
        redirect("/auth/login");
    }

    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen bg-rh-bg-primary">
                    <LoadingSpinner size="sm" color="white" />
                </div>
            }
        >
            <NotificationsTemplate
                crewId={data.crewId!}
                initialNotices={data.notices!}
                initialNotifications={data.notifications!}
                initialUnreadCount={data.unreadCount!}
            />
        </Suspense>
    );
}
