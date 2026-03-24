"use client";

import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";

interface ProfileForm {
    firstName: string;
    phone: string;
    birthYear: string;
    email: string;
}

const EditProfileSkeleton = React.memo(() => (
    <div className="flex flex-col min-h-screen bg-rh-bg-primary">
        <div className="sticky top-0 z-50 shrink-0 bg-rh-bg-surface">
            <div className="h-14" />
        </div>
        <div className="flex-1 px-4 pt-6 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 w-16 rounded bg-rh-bg-surface" />
                    <div className="h-12 rounded-rh-md bg-rh-bg-surface" />
                </div>
            ))}
        </div>
    </div>
));
EditProfileSkeleton.displayName = "EditProfileSkeleton";

export default function EditProfilePage() {
    const router = useRouter();
    const [form, setForm] = useState<ProfileForm>({
        firstName: "",
        phone: "",
        birthYear: "",
        email: "",
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();
                if (authError || !user) {
                    router.push("/auth/login");
                    return;
                }
                setUserId(user.id);

                const { data, error } = await supabase
                    .schema("attendance")
                    .from("users")
                    .select(
                        "first_name, phone, birth_year, email"
                    )
                    .eq("id", user.id)
                    .single();

                if (error) throw error;

                setForm({
                    firstName: data.first_name ?? "",
                    phone: data.phone ?? "",
                    birthYear: data.birth_year
                        ? String(data.birth_year)
                        : "",
                    email: data.email ?? "",
                });
            } catch {
                alert("프로필 정보를 불러올 수 없습니다.");
                router.back();
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, [supabase, router]);

    const handleChange = useCallback(
        (field: keyof ProfileForm) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                }));
            },
        []
    );

    const handleSave = useCallback(async () => {
        if (!userId) return;
        if (!form.firstName.trim()) {
            alert("이름을 입력해주세요.");
            return;
        }

        setIsSaving(true);
        try {
            const updateData: Record<string, unknown> = {
                first_name: form.firstName.trim(),
                phone: form.phone.trim() || null,
            };

            if (form.birthYear.trim()) {
                const year = parseInt(form.birthYear.trim(), 10);
                if (
                    isNaN(year) ||
                    year < 1900 ||
                    year > new Date().getFullYear()
                ) {
                    alert("올바른 출생연도를 입력해주세요.");
                    setIsSaving(false);
                    return;
                }
                updateData.birth_year = year;
            } else {
                updateData.birth_year = null;
            }

            const { error } = await supabase
                .schema("attendance")
                .from("users")
                .update(updateData)
                .eq("id", userId);

            if (error) throw error;

            alert("저장되었습니다.");
            router.back();
        } catch {
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    }, [userId, form, supabase, router]);

    if (isLoading) {
        return <EditProfileSkeleton />;
    }

    return (
        <FadeIn>
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                <div className="sticky top-0 z-50 shrink-0">
                    <PageHeader
                        title="내정보 변경"
                        backLink="/mypage"
                        iconColor="white"
                        borderColor="rh-border"
                        backgroundColor="bg-rh-bg-surface"
                    />
                </div>

                <div className="flex-1 px-4 pt-6 pb-4 flex flex-col gap-6">
                    {/* 이름 */}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-rh-text-secondary">
                            이름
                        </span>
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={handleChange("firstName")}
                            placeholder="이름을 입력하세요"
                            className="h-12 rounded-rh-md bg-rh-bg-surface px-4 text-sm text-white placeholder:text-rh-text-muted border border-rh-border focus:border-rh-accent focus:outline-none transition-colors"
                        />
                    </label>

                    {/* 연락처 */}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-rh-text-secondary">
                            연락처
                        </span>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={handleChange("phone")}
                            placeholder="010-1234-5678"
                            className="h-12 rounded-rh-md bg-rh-bg-surface px-4 text-sm text-white placeholder:text-rh-text-muted border border-rh-border focus:border-rh-accent focus:outline-none transition-colors"
                        />
                    </label>

                    {/* 이메일 (읽기 전용) */}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-rh-text-secondary">
                            이메일
                        </span>
                        <input
                            type="email"
                            value={form.email}
                            disabled
                            className="h-12 rounded-rh-md bg-rh-bg-surface px-4 text-sm text-rh-text-tertiary border border-rh-border opacity-60 cursor-not-allowed"
                        />
                        <span className="text-[11px] text-rh-text-tertiary">
                            이메일은 변경할 수 없습니다
                        </span>
                    </label>

                    {/* 출생연도 */}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-rh-text-secondary">
                            출생연도
                        </span>
                        <input
                            type="number"
                            value={form.birthYear}
                            onChange={handleChange("birthYear")}
                            placeholder="1990"
                            className="h-12 rounded-rh-md bg-rh-bg-surface px-4 text-sm text-white placeholder:text-rh-text-muted border border-rh-border focus:border-rh-accent focus:outline-none transition-colors"
                        />
                    </label>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* 저장 버튼 */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-11 w-full rounded-rh-lg bg-rh-accent text-sm font-semibold text-white disabled:opacity-50 transition-opacity active:opacity-80"
                    >
                        {isSaving ? "저장 중..." : "저장하기"}
                    </button>
                </div>
            </div>
        </FadeIn>
    );
}
