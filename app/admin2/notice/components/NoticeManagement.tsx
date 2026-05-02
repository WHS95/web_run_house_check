"use client";

import { useState, useCallback, useMemo, useEffect, useRef, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SWRConfig } from "swr";
import { AnimatedList, AnimatedItem } from "@/components/atoms/AnimatedList";
import FadeIn from "@/components/atoms/FadeIn";
import {
  AdminSmallButton,
  AdminAlertDialog,
  AdminSearchBar,
  NoticeCard,
} from "@/app/admin2/components/ui";
import {
  useAdminNotices,
  type NoticeType,
} from "@/lib/admin2/hooks/useAdminNotices";

type BadgeVariant = "accent" | "outline" | "muted";

const typeToBadgeVariant: Record<NoticeType, BadgeVariant> = {
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

interface Props {
  fallback: Record<string, unknown>;
}

function NoticeManagementInner() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    noticeId: string;
  }>({ open: false, noticeId: "" });
  const [deleting, setDeleting] = useState(false);

  // 검색어 debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const { notices, isLoading, deleteNotice } = useAdminNotices(
    searchQuery || undefined,
  );

  const totalCount = useMemo(() => notices.length, [notices]);

  const handleCardClick = useCallback(
    (id: string) => {
      router.push(`/admin2/notice/${id}`);
    },
    [router],
  );

  const handleDelete = useCallback(async () => {
    const noticeId = deleteDialog.noticeId;
    if (!noticeId) return;
    setDeleting(true);
    try {
      await deleteNotice(noticeId);
    } catch (e) {
      console.error("[notice delete] failed:", e);
      alert(e instanceof Error ? e.message : "공지 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, noticeId: "" });
    }
  }, [deleteDialog.noticeId, deleteNotice]);

  return (
    <FadeIn>
      <div className='flex-1 px-4 pt-4 pb-4 space-y-4'>
        {/* 검색바 */}
        <AdminSearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder='제목 또는 내용 검색'
        />

        {/* 헤더: 전체 N건 + 새 공지 */}
        <div className='flex items-center justify-between'>
          <span className='text-[13px] text-rh-text-secondary'>
            전체 <span className='text-white font-medium'>{totalCount}건</span>
          </span>
          <Link href='/admin2/notice/write'>
            <AdminSmallButton>+ 새 공지</AdminSmallButton>
          </Link>
        </div>

        {/* 공지 리스트 */}
        {isLoading && notices.length === 0 ? (
          <div className='space-y-3'>
            <div className='h-[108px] rounded-xl bg-rh-bg-surface' />
            <div className='h-[108px] rounded-xl bg-rh-bg-surface' />
          </div>
        ) : notices.length > 0 ? (
          <AnimatedList className='space-y-3'>
            {notices.map((notice) => (
              <AnimatedItem key={notice.id}>
                <div className='relative'>
                  <NoticeCard
                    badge={notice.type}
                    badgeVariant={typeToBadgeVariant[notice.type]}
                    date={formatDate(notice.created_at)}
                    title={notice.title || notice.content.slice(0, 30)}
                    description={notice.content}
                    onClick={() => handleCardClick(notice.id)}
                  />
                  <button
                    type='button'
                    aria-label='삭제'
                    className='absolute top-2 right-2 h-8 w-8 flex items-center justify-center text-rh-text-tertiary hover:text-rh-status-error'
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialog({
                        open: true,
                        noticeId: notice.id,
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              </AnimatedItem>
            ))}
          </AnimatedList>
        ) : (
          <div className='py-12 text-center'>
            <p className='text-rh-text-secondary text-sm'>
              {searchQuery
                ? "검색 결과가 없습니다."
                : "등록된 공지사항이 없습니다."}
            </p>
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AdminAlertDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, noticeId: "" })}
        onConfirm={handleDelete}
        title='공지사항을 삭제하시겠습니까?'
        description='이 작업은 되돌릴 수 없습니다.'
        cancelLabel='취소'
        confirmLabel={deleting ? "삭제 중..." : "삭제"}
        confirmVariant='danger'
      />
    </FadeIn>
  );
}

const NoticeManagement = memo(function NoticeManagement({ fallback }: Props) {
  return (
    <SWRConfig value={{ fallback }}>
      <NoticeManagementInner />
    </SWRConfig>
  );
});

export default NoticeManagement;
