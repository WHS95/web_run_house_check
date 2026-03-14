"use client";

import React from 'react';
import KakaoLoginButton from '../organisms/KakaoLoginButton';
import { useSearchParams } from 'next/navigation';

const LoginTemplate: React.FC = () => {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className='min-h-screen flex flex-col items-center justify-between bg-rh-bg-primary'>
            {/* 상단 여백 */}
            <div className='flex-1' />

            {/* 로고 및 텍스트 블록 - 중앙 배치 */}
            <div className='text-center text-white'>
                <h1 className='text-5xl font-bold tracking-tight leading-tight'>
                    RUN
                </h1>
                <h1 className='text-5xl font-bold tracking-tight leading-tight'>
                    HOUSE
                </h1>
            </div>

            {/* 하단 여백 */}
            <div className='flex-1' />

            {/* 버튼 및 하단 텍스트 블록 */}
            <div className="w-full px-6 pb-12">
                <KakaoLoginButton />

                {error && (
                    <div className="mt-4 text-sm text-rh-status-error text-center">
                        {error}
                    </div>
                )}

                <p className="mt-4 text-center text-xs text-rh-text-tertiary">
                    로그인 시 이용약관에 동의합니다
                </p>
            </div>
        </div>
    );
};

export default LoginTemplate;
