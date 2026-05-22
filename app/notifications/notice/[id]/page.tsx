import Link from "next/link";
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

// 카테고리 chip 라벨/톤 매핑
function chipLabel(type: NoticeType): string {
    if (type === "공지") return "모임";
    if (type === "중요") return "중요";
    return "일반";
}

// 모임 CTA 노출 여부 — "공지" 타입을 모임으로 간주
function isMeetingNotice(type: NoticeType): boolean {
    return type === "공지";
}

// 상단 메타 (작성일 · 작성자) 포맷 — 05.15 · 박지원
function formatMeta(iso: string, author: string): string {
    const d = new Date(iso);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${m}.${day} · ${author}`;
}

// 본문 안전 렌더링: <b>...</b> 만 강조로 허용하고 나머지는 escape
function renderContent(raw: string): React.ReactNode {
    // 줄 단위 처리 (whitespace-pre-wrap 가 줄바꿈 보존)
    // <b>..</b> 만 단순 파싱 — 기타 HTML 은 텍스트로 노출
    const parts: React.ReactNode[] = [];
    const regex = /<b>([\s\S]*?)<\/b>/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(raw)) !== null) {
        if (match.index > lastIndex) {
            parts.push(raw.slice(lastIndex, match.index));
        }
        parts.push(
            <b
                key={`b-${key++}`}
                className="font-semibold text-rh-text-primary"
            >
                {match[1]}
            </b>,
        );
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < raw.length) {
        parts.push(raw.slice(lastIndex));
    }
    return parts;
}

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

    const authorName = data.author?.first_name ?? "관리자";
    const titleText =
        data.title && data.title.trim().length > 0
            ? data.title
            : data.content.slice(0, 30);
    const showMeetingCta = isMeetingNotice(data.type);

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="공지 상세"
                backLink="/notifications"
            />
            <FadeIn>
                <div className="flex flex-col flex-1 px-4 pt-4 pb-6">
                    {/* 상단 row: 카테고리 chip + 작성일·작성자 */}
                    <div className="flex items-center gap-6">
                        <span
                            className="rh-chip"
                            data-on={
                                data.is_active
                                    ? "true"
                                    : "false"
                            }
                        >
                            {chipLabel(data.type)}
                        </span>
                        <span className="ml-auto text-[12px] text-rh-text-tertiary">
                            {formatMeta(
                                data.created_at,
                                authorName,
                            )}
                        </span>
                    </div>

                    {/* 큰 제목 — disp lg */}
                    <h1 className="rh-display text-[22px] mt-6 whitespace-pre-line">
                        {titleText}
                    </h1>

                    {/* 점선 구분선 */}
                    <hr className="rh-sep-dash mt-5 mb-5" />

                    {/* 본문 — t3 / line-height 1.7 / 줄바꿈 보존 */}
                    <div className="text-rh-body text-rh-text-secondary leading-[1.7] whitespace-pre-wrap break-words">
                        {renderContent(data.content)}
                    </div>

                    {/* spacer: CTA 를 하단으로 밀어내기 */}
                    <div className="flex-1 min-h-6" />

                    {/* 모임 공지일 때만 출석 CTA */}
                    {showMeetingCta && (
                        <Link
                            href="/attendance"
                            className="mt-6 inline-flex items-center justify-center w-full h-12 rounded-rh-lg bg-rh-accent text-rh-text-inverted text-rh-body font-semibold active:scale-[0.98] active:opacity-80 transition-all"
                        >
                            출석 페이지로
                        </Link>
                    )}
                </div>
            </FadeIn>
        </div>
    );
}
