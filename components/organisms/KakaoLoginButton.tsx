"use client";

import React from "react";
import { signInWithKakao } from "@/lib/auth";
import Image from "next/image";

const KakaoLoginButton: React.FC = () => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithKakao();
    } catch (err) {
      console.error("로그인 중 오류 발생:", err);
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className='flex items-center justify-center w-full py-3 px-4 bg-[#FEE500] text-[#3C1E1E] font-medium rounded-md hover:bg-[#FFDD00] transition-colors disabled:opacity-70 disabled:cursor-not-allowed'
    >
      {loading ? (
        <span>로그인 중...</span>
      ) : (
        <>
          <div className='mr-2'>
            <svg width='18' height='18' viewBox='0 0 18 18'>
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M9 0.818C4.236 0.818 0.273 3.909 0.273 7.728C0.273 10.097 1.779 12.187 4.048 13.437L3.073 16.746C3.039 16.838 3.034 16.939 3.057 17.034C3.08 17.129 3.131 17.215 3.203 17.278C3.302 17.364 3.428 17.409 3.557 17.404C3.685 17.4 3.808 17.346 3.9 17.255L7.687 14.187C8.118 14.246 8.557 14.273 9 14.273C13.764 14.273 17.727 11.182 17.727 7.364C17.727 3.546 13.764 0.818 9 0.818Z'
                fill='#3C1E1E'
              />
            </svg>
          </div>
          카카오톡으로 로그인
        </>
      )}
      {error && <div className='mt-2 text-red-500'>{error}</div>}
    </button>
  );
};

export default KakaoLoginButton;
