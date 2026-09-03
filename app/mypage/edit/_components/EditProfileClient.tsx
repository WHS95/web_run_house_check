"use client";

import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Camera, X } from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfileForm {
    firstName: string;
    phone: string;
    birthYear: string;
    email: string;
    profileImageUrl: string | null;
}

const EditProfileSkeleton = React.memo(() => (
    <div className="flex flex-col min-h-screen bg-rh-bg-primary">
        <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
            <div className="h-14 bg-rh-bg-surface" />
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

export default function EditProfileClient() {
    const router = useRouter();
    const [form, setForm] = useState<ProfileForm>({
        firstName: "",
        phone: "",
        birthYear: "",
        email: "",
        profileImageUrl: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dialog, setDialog] = useState<{
        kind: "success" | "error" | "validation";
        title: string;
        description: string;
    } | null>(null);

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
                        "first_name, phone, birth_year, email, profile_image_url"
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
                    profileImageUrl:
                        data.profile_image_url ?? null,
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

    const handleImageUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !userId) return;

            // 5MB 제한
            if (file.size > 5 * 1024 * 1024) {
                alert("이미지는 5MB 이하만 업로드 가능합니다.");
                return;
            }

            // 이미지 타입 확인
            if (!file.type.startsWith("image/")) {
                alert("이미지 파일만 업로드 가능합니다.");
                return;
            }

            setIsUploading(true);
            try {
                const ext = file.name.split(".").pop()
                    ?? "jpg";
                const filePath =
                    `profiles/${userId}.${ext}`;

                // 기존 이미지 삭제 (에러 무시)
                await supabase.storage
                    .from("image")
                    .remove([filePath])
                    .catch(() => {});

                // 새 이미지 업로드
                const { error: uploadError } =
                    await supabase.storage
                        .from("image")
                        .upload(filePath, file, {
                            upsert: true,
                            cacheControl: "0",
                        });

                if (uploadError) throw uploadError;

                // public URL 가져오기
                const { data: urlData } =
                    supabase.storage
                        .from("image")
                        .getPublicUrl(filePath);

                const publicUrl =
                    `${urlData.publicUrl}?t=${Date.now()}`;

                // DB 업데이트
                const { error: dbError } = await supabase
                    .schema("attendance")
                    .from("users")
                    .update({
                        profile_image_url: publicUrl,
                    })
                    .eq("id", userId);

                if (dbError) throw dbError;

                setForm((prev) => ({
                    ...prev,
                    profileImageUrl: publicUrl,
                }));
            } catch {
                alert(
                    "이미지 업로드 중 오류가 발생했습니다."
                );
            } finally {
                setIsUploading(false);
                // input 초기화 (같은 파일 재선택 가능)
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        },
        [userId, supabase]
    );

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
            setDialog({
                kind: "validation",
                title: "이름을 입력해주세요",
                description: "이름은 필수 항목이에요.",
            });
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
                    setDialog({
                        kind: "validation",
                        title: "출생연도를 확인해주세요",
                        description:
                            "1900년부터 올해 사이의 값을 입력해주세요.",
                    });
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

            setDialog({
                kind: "success",
                title: "저장되었습니다",
                description: "변경 내용이 반영되었어요.",
            });
        } catch {
            setDialog({
                kind: "error",
                title: "저장에 실패했어요",
                description: "잠시 후 다시 시도해주세요.",
            });
        } finally {
            setIsSaving(false);
        }
    }, [userId, form, supabase]);

    const handleDialogClose = useCallback(() => {
        const wasSuccess = dialog?.kind === "success";
        setDialog(null);
        if (wasSuccess) {
            router.back();
        }
    }, [dialog, router]);

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    if (isLoading) {
        return <EditProfileSkeleton />;
    }

    return (
        <FadeIn>
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                <PageHeader
                    title="내정보 변경"
                    backLink="/mypage"
                    iconColor="white"
                    borderColor="rh-border"
                    backgroundColor="bg-rh-bg-surface"
                    rightAction={
                        <button
                            type="button"
                            onClick={handleBack}
                            aria-label="닫기"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-rh-bg-muted/60 text-white hover:bg-rh-bg-muted active:opacity-70 transition-colors"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    }
                />

                <div className="flex-1 px-4 pt-6 pb-4 flex flex-col gap-6">
                    {/* 프로필 사진 */}
                    <div className="flex flex-col items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={isUploading}
                            className="relative group"
                        >
                            {form.profileImageUrl ? (
                                <img
                                    src={
                                        form.profileImageUrl
                                    }
                                    alt="프로필"
                                    className="h-20 w-20 rounded-full object-cover border-2 border-rh-border"
                                />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rh-accent border-2 border-rh-border">
                                    <span className="text-3xl font-bold text-white">
                                        {form.firstName
                                            ?.charAt(0) ??
                                            "?"}
                                    </span>
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-rh-bg-surface border border-rh-border">
                                <Camera
                                    size={14}
                                    className="text-rh-text-secondary"
                                />
                            </div>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        {isUploading && (
                            <span className="text-xs text-rh-text-tertiary">
                                업로드 중...
                            </span>
                        )}
                    </div>

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

            <AlertDialog
                open={dialog !== null}
                onOpenChange={(open) => {
                    if (!open) handleDialogClose();
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dialog?.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialog?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={handleDialogClose}
                            className="w-full"
                        >
                            확인
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </FadeIn>
    );
}
