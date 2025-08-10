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
    <div className='flex fixed inset-0 z-50 justify-center items-center'>
      {/* 배경 오버레이 */}
      <div
        className='absolute inset-0 backdrop-blur-sm bg-basic-black/50'
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className='relative p-8 mx-4 w-full max-w-md bg-white rounded-3xl shadow-2xl'>
        <div className='text-center'>
          {/* 제목 */}
          <h2 className='mb-6 text-xl font-bold text-gray-900'>
            사용자 정보 수정
          </h2>

          {/* 폼 */}
          <div className='space-y-4 text-left'>
            {/* 이름 */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                이름
              </label>
              <input
                type='text'
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className='p-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-basic-blue'
                placeholder='이름을 입력하세요'
              />
            </div>

            {/* 연락처 */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                연락처
              </label>
              <input
                type='tel'
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className='p-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-basic-blue'
                placeholder='010-0000-0000'
              />
            </div>

            {/* 출생년도 */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
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
                className='p-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-basic-blue'
                placeholder='1990'
                min='1950'
                max={new Date().getFullYear()}
              />
            </div>

            {/* 가입일 (읽기 전용) */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                가입일
              </label>
              <input
                type='text'
                value={new Date(user.created_at).toLocaleDateString("ko-KR")}
                disabled
                className='p-3 w-full text-gray-500 bg-gray-100 rounded-lg border border-gray-300'
              />
            </div>
          </div>

          {/* 버튼들 */}
          <div className='flex gap-3 mt-8'>
            <Button
              onClick={onClose}
              variant='outline'
              className='flex-1 py-3 text-gray-600 border-gray-300 hover:bg-gray-50'
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              className='flex-1 py-3 text-white bg-basic-blue hover:bg-blue-600'
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
