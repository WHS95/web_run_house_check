import { notFound } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import { createClient } from "@/lib/supabase/server";
import { getAdminAuth } from "@/lib/admin2/auth";
import AdminBadge from "@/app/admin2/components/ui/AdminBadge";

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

const typeToBadgeVariant: Record<NoticeType, "accent" | "outline" | "muted"> = {
  공지: "accent",
  일반: "muted",
  중요: "outline",
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}.${String(d.getDate()).padStart(2, "0")}`;
};

export default async function AdminNoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { crewId } = await getAdminAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .schema("attendance")
    .from("notices")
    .select(
      "id, crew_id, title, type, content, is_active, created_at, author:author_id(first_name)",
    )
    .eq("id", id)
    .eq("crew_id", crewId)
    .maybeSingle<NoticeDetail>();

  if (error) {
    console.error("[admin2 notice detail] query failed:", error);
  }
  if (!data) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title='공지 상세'
        backLink='/admin2/notice'
        iconColor='white'
        backgroundColor='bg-rh-bg-surface'
      />
      <FadeIn>
        <div className='flex-1 px-4 pt-4 pb-8 space-y-4'>
          <div className='rounded-xl bg-rh-bg-surface p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <AdminBadge variant={typeToBadgeVariant[data.type]}>
                {data.type}
              </AdminBadge>
              <span className='text-[11px] text-rh-text-tertiary'>
                {formatDate(data.created_at)}
              </span>
            </div>
            <h1 className='text-[17px] font-semibold text-white leading-snug'>
              {data.title || data.content.slice(0, 30)}
            </h1>
            <div className='flex items-center gap-1.5 text-[12px] text-rh-text-tertiary'>
              <span>{data.author?.first_name ?? "관리자"}</span>
              {data.is_active && (
                <>
                  <span>·</span>
                  <span className='text-rh-accent'>현재 공지</span>
                </>
              )}
            </div>
          </div>

          <div className='rounded-xl bg-rh-bg-surface p-4'>
            <p className='text-[14px] leading-relaxed text-white whitespace-pre-wrap'>
              {data.content}
            </p>
          </div>
        </div>
      </FadeIn>
    </>
  );
}
