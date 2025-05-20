"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface UnverifiedUserModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function UnverifiedUserModal({
  isOpen,
  onClose,
}: UnverifiedUserModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleVerifyClick = () => {
    router.push("/auth/verify-crew");
    if (onClose) onClose();
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-500 mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-gray-900'>
            크루 인증이 필요합니다
          </h3>
          <p className='mt-2 text-sm text-gray-500'>
            런하우스 서비스를 이용하기 위해서는 크루 인증이 필요합니다. 크루
            관리자에게 초대 코드를 받아 인증을 완료해주세요.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row sm:justify-end gap-3 mt-5'>
          <button
            type='button'
            onClick={handleClose}
            className='py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            나중에 하기
          </button>
          <button
            type='button'
            onClick={handleVerifyClick}
            className='py-2 px-4 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            지금 인증하기
          </button>
        </div>
      </div>
    </div>
  );
}
