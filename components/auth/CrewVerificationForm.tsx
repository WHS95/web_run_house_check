"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

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
        <div className='w-full max-w-sm mx-auto text-center'>
            {isSuccess ? (
                <div className='space-y-4'>
                    <CheckCircle2 className='h-16 w-16 text-rh-status-success mx-auto' />
                    <h2 className='text-xl font-bold text-white'>
                        크루 인증이 완료되었습니다!
                    </h2>
                    <p className='text-sm text-rh-text-secondary'>
                        런하우스 서비스를 이용하실 수 있습니다.
                    </p>
                    <p className='text-xs text-rh-text-tertiary'>
                        잠시 후 메인 페이지로 이동합니다...
                    </p>
                </div>
            ) : (
                <div className='space-y-6'>
                    {/* 아이콘 */}
                    <ShieldCheck className='h-16 w-16 text-rh-accent mx-auto' />

                    {/* 타이틀 */}
                    <div className='space-y-2'>
                        <h2 className='text-xl font-bold text-white'>
                            크루 인증이 필요합니다
                        </h2>
                        <p className='text-sm text-rh-text-secondary leading-relaxed'>
                            크루에 가입하려면 초대코드를 입력해주세요.
                            <br />
                            크루 운영자에게 코드를 요청하세요.
                        </p>
                    </div>

                    {/* 폼 */}
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <input
                            type='text'
                            id='inviteCode'
                            className='w-full bg-rh-bg-surface border border-rh-border rounded-lg h-12 px-4 text-white text-sm text-center placeholder:text-rh-text-tertiary focus:outline-none focus:ring-2 focus:ring-rh-accent'
                            placeholder='초대코드 입력'
                            value={inviteCode}
                            onChange={(e) =>
                                setInviteCode(e.target.value.slice(0, 7).toUpperCase())
                            }
                            maxLength={7}
                            disabled={isLoading}
                            autoComplete='off'
                            required
                        />

                        {error && (
                            <div className='p-3 bg-rh-status-error/10 text-rh-status-error text-sm rounded-lg'>
                                {error}
                            </div>
                        )}

                        <div className='flex gap-3'>
                            {onCancel && (
                                <button
                                    type='button'
                                    onClick={onCancel}
                                    className='flex-1 h-[52px] text-sm font-medium text-rh-text-secondary bg-rh-bg-surface border border-rh-border rounded-rh-lg hover:bg-rh-bg-muted focus:outline-none focus:ring-2 focus:ring-rh-accent'
                                    disabled={isLoading}
                                >
                                    취소
                                </button>
                            )}
                            <button
                                type='submit'
                                className='flex-1 h-[52px] text-base font-semibold text-white bg-rh-accent rounded-rh-lg hover:bg-rh-accent-hover focus:outline-none focus:ring-2 focus:ring-rh-accent disabled:bg-rh-bg-muted disabled:text-rh-text-secondary disabled:cursor-not-allowed'
                                disabled={isLoading}
                            >
                                {isLoading ? "인증 중..." : "인증하기"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
