"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  content,
  confirmText = "확인",
  cancelText = "취소",
  variant = "default",
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center'>
      {/* 배경 오버레이 */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* 모달 컨텐츠 — 다크 테마 */}
      <div className='relative w-full max-w-sm p-6 mx-4 bg-rh-bg-surface rounded-2xl'>
        <div className='text-center'>
          {/* 아이콘 */}
          {variant === "destructive" && (
            <div className='flex justify-center mb-4'>
              <div className='w-12 h-12 rounded-full flex items-center justify-center'
                style={{ backgroundColor: '#3E649633' }}
              >
                <AlertTriangle className='w-6 h-6 text-rh-status-error' />
              </div>
            </div>
          )}

          {/* 제목 */}
          <h2 className='mb-3 text-lg font-bold text-white'>{title}</h2>

          {/* 내용 */}
          <p className='mb-6 text-sm leading-relaxed text-rh-text-secondary whitespace-pre-line'>
            {content}
          </p>

          {/* 버튼들 */}
          <div className='flex gap-3'>
            <Button
              onClick={onClose}
              variant='secondary'
              className='flex-1'
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              variant={variant === "destructive" ? "destructive" : "default"}
              className='flex-1'
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;