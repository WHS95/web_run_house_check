"use client";

import React from 'react';
import KakaoLoginButton from '../organisms/KakaoLoginButton';
import { useSearchParams } from 'next/navigation';

const LoginTemplate: React.FC = () => {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                        TCRC
                    </h1>
                    <h2 className="mt-2 text-xl text-gray-600">
                        Tan-Cheon Running Crew
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        We Run Together
                    </p>
                </div>

                <div className="mt-12 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        <div>
                            <p className="text-center text-sm text-gray-600 mb-4">
                                계정에 로그인하세요
                            </p>
                            <KakaoLoginButton />
                            
                            {error && (
                                <div className="mt-4 text-sm text-red-600 text-center">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginTemplate; 