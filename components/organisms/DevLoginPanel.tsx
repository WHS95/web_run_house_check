"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const QUICK_ACCOUNTS = [
    { label: "관리자", email: "admin@test.com", role: "CREW_MANAGER" },
    { label: "크루원1", email: "member1@test.com", role: "MEMBER" },
    { label: "크루원2", email: "member2@test.com", role: "MEMBER" },
    { label: "크루원3", email: "member3@test.com", role: "MEMBER" },
    { label: "크루원4", email: "member4@test.com", role: "MEMBER" },
    { label: "크루원5", email: "member5@test.com", role: "MEMBER" },
];

const DEFAULT_PASSWORD = "Test1234!";

const DevLoginPanel: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customEmail, setCustomEmail] = useState("");
    const [customPassword, setCustomPassword] = useState(DEFAULT_PASSWORD);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { error: signInError } =
            await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
            setError(signInError.message);
            setLoading(false);
            return;
        }
        router.push("/");
        router.refresh();
    };

    return (
        <div className="mt-6 rounded-2xl border border-rh-border bg-rh-bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                    [DEV] 테스트 계정 로그인
                </span>
                <span className="text-xs text-rh-text-tertiary">
                    프로덕션에선 노출되지 않음
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {QUICK_ACCOUNTS.map((acc) => (
                    <button
                        key={acc.email}
                        type="button"
                        disabled={loading}
                        onClick={() => signIn(acc.email, DEFAULT_PASSWORD)}
                        className="rounded-xl bg-rh-accent px-3 py-2 text-xs font-medium text-white hover:bg-rh-accent-hover disabled:opacity-50"
                    >
                        {acc.label}
                    </button>
                ))}
            </div>

            <div className="mt-4 space-y-2">
                <input
                    type="email"
                    placeholder="custom@test.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full rounded-lg bg-rh-bg-inset px-3 py-2 text-sm text-white placeholder:text-rh-text-tertiary"
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full rounded-lg bg-rh-bg-inset px-3 py-2 text-sm text-white placeholder:text-rh-text-tertiary"
                />
                <button
                    type="button"
                    disabled={loading || !customEmail}
                    onClick={() => signIn(customEmail, customPassword)}
                    className="w-full rounded-xl bg-rh-bg-muted px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                    직접 입력 로그인
                </button>
            </div>

            {error && (
                <p className="mt-3 text-xs text-rh-status-error">{error}</p>
            )}
        </div>
    );
};

export default DevLoginPanel;
