"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    first_name: string;
    phone: string | null;
    birth_year: number | null;
    created_at: string;
  };
  onSave: (userData: {
    first_name: string;
    phone: string;
    birth_year: number;
  }) => Promise<void>;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    phone: user.phone || "",
    birth_year: user.birth_year || new Date().getFullYear() - 30,
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      //console.error("사용자 정보 수정 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='absolute inset-0 z-50 flex justify-center items-center'>
      {/* 배경 오버레이 */}
      <div
        className='absolute inset-0 backdrop-blur-sm bg-black/50'
        onClick={onClose}
      />

      {/* 모달 컨텐츠 — 다크 테마 */}
      <div className='relative p-6 mx-4 w-full max-w-md bg-rh-bg-surface rounded-2xl'>
        {/* 제목 */}
        <h2 className='mb-5 text-lg font-bold text-white'>
          사용자 정보 수정
        </h2>

        {/* 폼 */}
        <div className='space-y-4'>
          {/* 이름 */}
          <div>
            <label className='block mb-2 text-sm font-medium text-rh-text-secondary'>
              이름
            </label>
            <input
              type='text'
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              className='p-3 w-full text-white bg-rh-bg-primary rounded-[12px] border border-rh-border focus:outline-none focus:ring-2 focus:ring-rh-accent placeholder:text-rh-text-tertiary'
              placeholder='이름을 입력하세요'
            />
          </div>

          {/* 연락처 */}
          <div>
            <label className='block mb-2 text-sm font-medium text-rh-text-secondary'>
              연락처
            </label>
            <input
              type='tel'
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className='p-3 w-full text-white bg-rh-bg-primary rounded-[12px] border border-rh-border focus:outline-none focus:ring-2 focus:ring-rh-accent placeholder:text-rh-text-tertiary'
              placeholder='010-0000-0000'
            />
          </div>

          {/* 출생년도 */}
          <div>
            <label className='block mb-2 text-sm font-medium text-rh-text-secondary'>
              출생년도
            </label>
            <input
              type='number'
              value={formData.birth_year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  birth_year: parseInt(e.target.value),
                })
              }
              className='p-3 w-full text-white bg-rh-bg-primary rounded-[12px] border border-rh-border focus:outline-none focus:ring-2 focus:ring-rh-accent placeholder:text-rh-text-tertiary'
              placeholder='1990'
              min='1950'
              max={new Date().getFullYear()}
            />
          </div>

          {/* 가입일 (읽기 전용) */}
          <div>
            <label className='block mb-2 text-sm font-medium text-rh-text-secondary'>
              가입일
            </label>
            <input
              type='text'
              value={new Date(user.created_at).toLocaleDateString("ko-KR")}
              disabled
              className='p-3 w-full text-rh-text-tertiary bg-rh-bg-muted/30 rounded-[12px] border border-rh-border'
            />
          </div>
        </div>

        {/* 버튼들 */}
        <div className='flex gap-3 mt-6'>
          <Button
            onClick={onClose}
            variant='secondary'
            className='flex-1'
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className='flex-1'
            disabled={isLoading}
          >
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
