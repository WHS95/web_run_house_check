"use client";

import React from 'react';
import KakaoLoginButton from '../organisms/KakaoLoginButton';
import { useSearchParams } from 'next/navigation';

const LoginTemplate: React.FC = () => {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className='min-h-screen flex flex-col items-center justify-around px-4 py-8 bg-basic-black'>
            {/* 로고 및 텍스트 블록 */}
            <div className='text-center text-white'>
                <img src="/logo.png" alt="로고" className="w-32 h-auto mx-auto mb-6 sm:w-36" /> 
                <p className='text-lg font-semibold sm:text-xl'>러닝 크루의 모든것</p>
                <p className='text-lg font-semibold mt-1 sm:text-xl'>런 하우스</p>
            </div>

            {/* 버튼 블록 */}
            <div className="w-full max-w-xs">
                <KakaoLoginButton />
                
                {error && (
                    <div className="mt-4 text-sm text-red-600 text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginTemplate; 