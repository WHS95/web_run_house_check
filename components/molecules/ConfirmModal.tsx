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
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* 배경 오버레이 */}
      <div
        className='absolute inset-0 bg-basic-black/50 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className='relative w-full max-w-sm p-8 mx-4 bg-white shadow-2xl rounded-3xl'>
        <div className='text-center'>
          {/* 아이콘 */}
          {variant === "destructive" && (
            <div className='flex justify-center mb-4'>
              <div className='p-3 bg-red-100 rounded-full'>
                <AlertTriangle className='w-6 h-6 text-red-600' />
              </div>
            </div>
          )}

          {/* 제목 */}
          <h2 className='mb-6 text-xl font-bold text-gray-900'>{title}</h2>

          {/* 내용 */}
          <p className='mb-8 leading-relaxed text-gray-600 whitespace-pre-line'>
            {content}
          </p>

          {/* 버튼들 */}
          <div className='flex space-x-3'>
            <Button
              onClick={onClose}
              variant='outline'
              className='flex-1 py-4 text-base font-medium border-gray-300 rounded-2xl hover:bg-gray-50'
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              className={`flex-1 py-4 text-base font-medium rounded-2xl ${
                variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-basic-black hover:bg-gray-800 text-white"
              }`}
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