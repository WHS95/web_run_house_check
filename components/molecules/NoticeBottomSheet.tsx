"use client";

import React, { memo, useEffect, useState, useCallback } from "react";
import DragSheet from "@/components/ui/DragSheet";
import { X, BellOff } from "lucide-react";
import { getCrewNoticesAction } from "@/app/admin2/notice/actions";

interface Notice {
  id: string;
  title?: string | null;
  content: string;
  created_at: string;
  is_active: boolean;
  author?: { first_name: string } | null;
}

interface NoticeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  crewId: string | null;
}

function formatNoticeDate(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}

const NoticeBottomSheet = memo<NoticeBottomSheetProps>(
  ({ isOpen, onClose, crewId }) => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!isOpen || !crewId) return;
      setLoading(true);
      getCrewNoticesAction({ crewId })
        .then((result) => {
          if (result.success) {
            setNotices((result.data ?? []) as unknown as Notice[]);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [isOpen, crewId]);

    return (
      <DragSheet
        open={isOpen}
        onClose={onClose}
        label='알림 내역'
        maxHeightClassName='max-h-[75%]'
      >
              <div
                className='flex items-center
                                justify-between px-5 pb-3'
              >
                <h2
                  className='text-lg font-semibold
                                    text-white'
                >
                  알림 내역
                </h2>
                <button
                  onClick={onClose}
                  className='flex h-8 w-8
                                        items-center justify-center
                                        rounded-full bg-rh-bg-muted'
                >
                  <X
                    className='h-4 w-4
                                        text-rh-text-secondary'
                  />
                </button>
              </div>

              <div
                className='border-t
                                border-rh-border'
              />

              <div
                className='overflow-y-auto px-5
                                py-4 max-h-[calc(75vh-80px)]
                                space-y-3'
              >
                {loading ? (
                  <div
                    className='flex items-center
                                        justify-center py-16'
                  >
                    <div
                      className='h-6 w-6
                                            animate-spin rounded-full
                                            border-2 border-rh-accent
                                            border-t-transparent'
                    />
                  </div>
                ) : notices.length > 0 ? (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      className='rounded-rh-lg
                                                bg-rh-bg-primary
                                                p-4 space-y-1.5'
                    >
                      <div
                        className='flex
                                                items-center
                                                justify-between'
                      >
                        <span
                          className='text-xs
                                                    font-medium
                                                    text-rh-accent'
                        >
                          {notice.author?.first_name ?? "관리자"}
                        </span>
                        <span
                          className='text-xs
                                                    text-rh-text-tertiary'
                        >
                          {formatNoticeDate(notice.created_at)}
                        </span>
                      </div>
                      <p
                        className='text-sm
                                                leading-relaxed
                                                text-white'
                      >
                        {notice.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div
                    className='flex flex-col
                                        items-center justify-center
                                        py-16 gap-3'
                  >
                    <BellOff
                      className='h-10 w-10
                                            text-rh-text-muted'
                    />
                    <p
                      className='text-sm
                                            text-rh-text-tertiary'
                    >
                      알림 내역이 없습니다
                    </p>
                  </div>
                )}
              </div>
      </DragSheet>
    );
  },
);

NoticeBottomSheet.displayName = "NoticeBottomSheet";

export default NoticeBottomSheet;
