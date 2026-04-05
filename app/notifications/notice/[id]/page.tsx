import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NoticeType = "공지" | "일반" | "중요";

interface NoticeDetail {
    id: string;
    crew_id: string;
    title: string | null;
    type: NoticeType;
    content: string;
    is_active: boolean;
    created_at: string;
    author: { first_name: string } | null;
}

const typeToStyle: Record<
    NoticeType,
    { bg: string; text: string; border: string }
> = {
    공지: {
        bg: "bg-rh-accent",
        text: "text-white",
        border: "",
    },
    중요: {
        bg: "",
        text: "text-rh-accent",
        border: "border border-rh-accent",
    },
    일반: {
        bg: "bg-rh-bg-muted",
        text: "text-rh-text-secondary",
        border: "",
    },
};

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(
        d.getMonth() + 1,
    ).padStart(2, "0")}.${String(d.getDate()).padStart(
        2,
        "0",
    )}`;
};

export default async function UserNoticeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    // 사용자의 활성 크루 확인 (다른 크루 공지 열람 차단)
    const { data: userCrew } = await supabase
        .schema("attendance")
        .from("user_crews")
        .select("crew_id")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE")
        .maybeSingle();
    if (!userCrew) {
        notFound();
    }

    const { data, error } = await supabase
        .schema("attendance")
        .from("notices")
        .select(
            "id, crew_id, title, type, content, is_active, created_at, author:author_id(first_name)",
        )
        .eq("id", id)
        .eq("crew_id", userCrew.crew_id)
        .maybeSingle<NoticeDetail>();

    if (error) {
        console.error(
            "[user notice detail] query failed:",
            error,
        );
    }
    if (!data) {
        notFound();
    }

    const style = typeToStyle[data.type];

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="공지 상세"
                backLink="/notifications"
            />
            <FadeIn>
                <div className="flex-1 px-4 pt-4 pb-8 space-y-4">
                    <div className="rounded-rh-lg bg-rh-bg-surface p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span
                                className={`inline-flex items-center justify-center h-[22px] px-2 rounded-full text-[10px] font-semibold ${style.bg} ${style.text} ${style.border}`}
                            >
                                {data.type}
                            </span>
                            <span className="text-[11px] text-rh-text-tertiary">
                                {formatDate(
                                    data.created_at,
                                )}
                            </span>
                        </div>
                        <h1 className="text-[17px] font-semibold text-white leading-snug">
                            {data.title ||
                                data.content.slice(0, 30)}
                        </h1>
                        <div className="flex items-center gap-1.5 text-[12px] text-rh-text-tertiary">
                            <span>
                                {data.author?.first_name ??
                                    "관리자"}
                            </span>
                            {data.is_active && (
                                <>
                                    <span>·</span>
                                    <span className="text-rh-accent">
                                        현재 공지
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="rounded-rh-lg bg-rh-bg-surface p-4">
                        <p className="text-[14px] leading-relaxed text-white whitespace-pre-wrap">
                            {data.content}
                        </p>
                    </div>
                </div>
            </FadeIn>
        </div>
    );
}
