"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "삭제 확인",
  description = "이 작업은 되돌릴 수 없습니다.",
  itemName,
  loading = false,
}: DeleteConfirmDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error("삭제 오류:", error);
    }
  };

  if (!open) return null;

  /* iOS Action Sheet 스타일 컨텐츠 */
  const content = (
    <div className='space-y-4 text-center'>
      <div className='flex justify-center items-center mx-auto w-12 h-12 bg-rh-status-error/20 rounded-full'>
        <Trash2 className='w-6 h-6 text-rh-accent-dim' />
      </div>
      <div className='space-y-2'>
        <h3 className='text-rh-title3 font-semibold text-rh-text-primary'>{title}</h3>
        {itemName && (
          <p className='text-rh-body text-rh-text-secondary'>
            &ldquo;{itemName}&rdquo;을(를) 삭제하시겠습니까?
          </p>
        )}
        <p className='text-rh-body text-rh-accent-dim font-medium'>
          {description}
        </p>
      </div>
    </div>
  );

  /* iOS 스타일 액션 버튼 */
  const actions = (
    <div className='flex flex-col space-y-2'>
      <Button
        onClick={handleConfirm}
        disabled={loading}
        className='w-full bg-rh-status-error text-white hover:bg-rh-status-error/80'
      >
        {loading ? "삭제 중..." : "삭제"}
      </Button>
      <Button
        variant='ghost'
        onClick={() => onOpenChange(false)}
        disabled={loading}
        className='w-full text-rh-accent font-semibold'
      >
        취소
      </Button>
    </div>
  );

  /* 데스크톱: iOS Alert 스타일 */
  if (isDesktop) {
    return (
      <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
        <div
          className='fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in'
          onClick={() => onOpenChange(false)}
        />
        <div className='relative z-[10000] w-[270px] bg-rh-bg-surface rounded-lg backdrop-blur-[40px] animate-ios-alert-in'>
          <div className='sr-only'>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className='p-6'>
            {content}
            <div className='mt-6'>{actions}</div>
          </div>
        </div>
      </div>
    );
  }

  /* 모바일: iOS Action Sheet 스타일 */
  return (
    <div className='fixed inset-0 z-[9999]'>
      <div
        className='fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in'
        onClick={() => onOpenChange(false)}
      />
      <div className='fixed inset-x-0 bottom-0 z-[10000] flex h-auto flex-col rounded-t-xl bg-rh-bg-surface border-t border-rh-border animate-ios-sheet-up'>
        {/* iOS 드래그 핸들 */}
        <div className='mx-auto mt-2 h-[5px] w-9 rounded-full bg-rh-bg-muted' />
        <div className='sr-only'>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className='p-6 pb-2'>{content}</div>
        <div className='flex flex-col gap-2 p-4 pb-safe'>{actions}</div>
      </div>
    </div>
  );
}
