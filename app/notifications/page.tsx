import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

const NotificationsTemplate = nextDynamic(
    () =>
        import(
            "@/components/templates/NotificationsTemplate"
        ),
    {
        loading: () => (
            <div
                className="flex justify-center
                    items-center min-h-screen
                    bg-rh-bg-primary"
            >
                <LoadingSpinner
                    size="sm"
                    color="white"
                />
            </div>
        ),
        ssr: true,
    }
);

export const dynamic = "force-dynamic";

export const metadata = {
    title: "공지 | RUNHOUSE",
    description:
        "RUNHOUSE 공지사항을 확인하세요",
};

async function getNoticesData() {
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

        // 공지사항 조회
        const { data: noticesRaw } = await supabase
            .schema("attendance")
            .from("notices")
            .select(
                "id, title, type, content, is_active, created_at, author:author_id(first_name)"
            )
            .eq("crew_id", crewId)
            .order("created_at", { ascending: false })
            .limit(30);

        // Supabase FK 조인은 author를 배열로 반환
        // → 단일 객체로 정규화
        const notices = (noticesRaw ?? []).map(
            (n: any) => ({
                ...n,
                author: Array.isArray(n.author)
                    ? (n.author[0] ?? null)
                    : (n.author ?? null),
            })
        );

        return { crewId, notices };
    } catch {
        return { needsAuth: true };
    }
}

export default async function NotificationsPage() {
    const data = await getNoticesData();

    if (data.needsAuth) {
        redirect("/auth/login");
    }

    return (
        <Suspense
            fallback={
                <div
                    className="flex justify-center
                        items-center min-h-screen
                        bg-rh-bg-primary"
                >
                    <LoadingSpinner
                        size="sm"
                        color="white"
                    />
                </div>
            }
        >
            <NotificationsTemplate
                crewId={data.crewId!}
                initialNotices={data.notices!}
            />
        </Suspense>
    );
}
