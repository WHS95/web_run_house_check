"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  buttonText?: string;
}

const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  buttonText = "완료",
}) => {
  if (!isOpen) return null;

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
          {/* 제목 */}
          <h2 className='mb-6 text-xl font-bold text-gray-900'>{title}</h2>

          {/* 내용 */}
          <p className='mb-8 leading-relaxed text-gray-600 whitespace-pre-line'>
            {content}
          </p>

          {/* 완료 버튼 */}
          <Button
            onClick={onClose}
            className='w-full py-4 text-lg font-medium text-white transition-colors bg-basic-black rounded-2xl hover:bg-gray-800'
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoticeModal;
