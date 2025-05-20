"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CrewVerificationFormProps {
  onSuccess?: (crew: { id: string; name: string }) => void;
  onCancel?: () => void;
}

export default function CrewVerificationForm({
  onSuccess,
  onCancel,
}: CrewVerificationFormProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode || inviteCode.length !== 7) {
      setError("크루 코드는 7자리여야 합니다.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/crew-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "크루 인증에 실패했습니다.");
      }

      setIsSuccess(true);

      if (onSuccess && data.crew) {
        onSuccess(data.crew);
      } else {
        // 3초 후 홈페이지로 리다이렉트
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "크루 인증 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto p-6 bg-white rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-6 text-center'>크루 인증</h2>

      {isSuccess ? (
        <div className='text-center'>
          <div className='mb-4 text-green-600 text-xl'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-12 w-12 mx-auto mb-2'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
            크루 인증이 완료되었습니다!
          </div>
          <p className='mb-4 text-gray-600'>
            런하우스 서비스를 이용하실 수 있습니다.
          </p>
          <p className='text-sm text-gray-500'>
            잠시 후 메인 페이지로 이동합니다...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className='mb-6'>
            <label
              htmlFor='inviteCode'
              className='block mb-2 text-sm font-medium text-gray-700'
            >
              크루 초대 코드
            </label>
            <input
              type='text'
              id='inviteCode'
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='7자리 코드 입력'
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(e.target.value.slice(0, 7).toUpperCase())
              }
              maxLength={7}
              disabled={isLoading}
              autoComplete='off'
              required
            />
            <p className='mt-1 text-sm text-gray-500'>
              크루 관리자에게 받은 7자리 초대 코드를 입력하세요.
            </p>
          </div>

          {error && (
            <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md'>
              {error}
            </div>
          )}

          <div className='flex justify-between space-x-4'>
            {onCancel && (
              <button
                type='button'
                onClick={onCancel}
                className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500'
                disabled={isLoading}
              >
                취소
              </button>
            )}
            <button
              type='submit'
              className='flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={isLoading}
            >
              {isLoading ? "인증 중..." : "인증하기"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
