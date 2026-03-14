"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    signupSchema,
    type SignupFormData,
    formatPhoneNumber,
} from "@/lib/validators/signupSchema";
import PageHeader from "@/components/organisms/common/PageHeader";
import PopupNotification, {
    type NotificationType,
} from "@/components/molecules/common/PopupNotification";

// ⚡ 개별 입력 필드 컴포넌트 (메모이제이션)
interface InputFieldProps {
    label: string;
    placeholder: string;
    register: any;
    error?: string;
    readOnly?: boolean;
    type?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField = memo<InputFieldProps>(
    ({
        label,
        placeholder,
        register,
        error,
        readOnly = false,
        type = "text",
        onChange,
    }) => (
        <div>
            <label className='block mb-1.5 text-xs font-medium text-rh-text-secondary'>
                {label}
            </label>
            <input
                type={type}
                {...register}
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
                className={`w-full bg-rh-bg-surface border border-rh-border rounded-lg h-12 px-4 text-white text-sm placeholder:text-rh-text-tertiary focus:outline-none focus:ring-2 focus:ring-rh-accent ${
                    readOnly
                        ? "text-rh-text-secondary opacity-60 cursor-not-allowed"
                        : ""
                }`}
            />
            {error && <p className='mt-1 text-xs text-rh-status-error'>{error}</p>}
        </div>
    )
);
InputField.displayName = "InputField";

// ⚡ 성별 선택 컴포넌트
interface GenderSelectProps {
    value: string;
    onChange: (value: string) => void;
}

const GenderSelect = memo<GenderSelectProps>(({ value, onChange }) => (
    <div>
        <label className='block mb-1.5 text-xs font-medium text-rh-text-secondary'>
            성별
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className='w-full bg-rh-bg-surface border border-rh-border rounded-lg h-12 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rh-accent appearance-none'
        >
            <option value='' className='bg-rh-bg-surface text-rh-text-tertiary'>선택해주세요</option>
            <option value='남성' className='bg-rh-bg-surface'>남성</option>
            <option value='여성' className='bg-rh-bg-surface'>여성</option>
            <option value='기타' className='bg-rh-bg-surface'>기타</option>
        </select>
    </div>
));
GenderSelect.displayName = "GenderSelect";

// ⚡ 크루 코드 검증 컴포넌트
interface CrewCodeVerificationProps {
    register: any;
    crewCodeInputValue: string;
    isCrewCodeVerifying: boolean;
    crewCodeVerified: boolean;
    crewCodeError: string | null;
    errors: any;
    onVerifyCrewCode: () => void;
    onCrewCodeChange: () => void;
}

const CrewCodeVerification = memo<CrewCodeVerificationProps>(
    ({
        register,
        crewCodeInputValue,
        isCrewCodeVerifying,
        crewCodeVerified,
        crewCodeError,
        errors,
        onVerifyCrewCode,
        onCrewCodeChange,
    }) => {
        const buttonText = useMemo(() => {
            if (isCrewCodeVerifying) return "확인중";
            if (crewCodeVerified) return "인증됨";
            return "확인";
        }, [isCrewCodeVerifying, crewCodeVerified]);

        const isButtonDisabled = useMemo(() => {
            return isCrewCodeVerifying || crewCodeVerified || !crewCodeInputValue;
        }, [isCrewCodeVerifying, crewCodeVerified, crewCodeInputValue]);

        return (
            <div>
                <label className='block mb-1.5 text-xs font-medium text-rh-text-secondary'>
                    크루 초대코드
                </label>
                <div className='flex items-center gap-2'>
                    <input
                        type='text'
                        {...register("crewCode")}
                        onChange={(e) => {
                            register("crewCode").onChange(e);
                            onCrewCodeChange();
                        }}
                        placeholder='크루 코드를 입력하세요'
                        disabled={isCrewCodeVerifying || crewCodeVerified}
                        className={`flex-1 bg-rh-bg-surface border border-rh-border rounded-lg h-12 px-4 text-white text-sm placeholder:text-rh-text-tertiary focus:outline-none focus:ring-2 focus:ring-rh-accent ${
                            isCrewCodeVerifying || crewCodeVerified
                                ? "opacity-60 cursor-not-allowed"
                                : ""
                        }`}
                    />
                    <button
                        type='button'
                        onClick={onVerifyCrewCode}
                        disabled={isButtonDisabled}
                        className='h-12 px-5 text-sm font-medium text-white rounded-lg bg-rh-accent hover:bg-rh-accent-hover focus:outline-none focus:ring-2 focus:ring-rh-accent disabled:bg-rh-bg-muted disabled:text-rh-text-secondary disabled:cursor-not-allowed'
                    >
                        {buttonText}
                    </button>
                </div>

                {(errors.crewCode && (
                    <p className='mt-1 text-xs text-rh-status-error'>{errors.crewCode.message}</p>
                )) ||
                    (crewCodeError && (
                        <p className='mt-1 text-xs text-rh-status-error'>{crewCodeError}</p>
                    ))}

                {crewCodeVerified && !crewCodeError && !errors.crewCode && (
                    <p className='mt-1 text-xs text-rh-status-success'>
                        크루 코드가 인증되었습니다.
                    </p>
                )}

                <input type='hidden' {...register("verifiedCrewId")} />
                {errors.verifiedCrewId && (
                    <p className='mt-1 text-xs text-rh-status-error'>
                        {errors.verifiedCrewId.message}
                    </p>
                )}
            </div>
        );
    }
);
CrewCodeVerification.displayName = "CrewCodeVerification";

// ⚡ 메인 SignupPage 컴포넌트
export default function SignupPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    // 성별 상태 (UI 전용, 폼 제출 시 별도 전달)
    const [gender, setGender] = useState("");
    // 닉네임 상태
    const [nickname, setNickname] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors: clearFormErrors,
        getValues,
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: "",
            email: "",
            phoneNumber: "",
            birthYear: undefined,
            crewCode: "",
            verifiedCrewId: "",
            privacyConsent: false,
            termsOfService: false,
        },
    });

    const crewCodeValue = watch("crewCode");
    const privacyConsentValue = watch("privacyConsent");
    const termsOfServiceValue = watch("termsOfService");

    const [isCrewCodeVerifying, setIsCrewCodeVerifying] = useState(false);
    const [crewCodeVerified, setCrewCodeVerified] = useState(false);
    const [crewCodeError, setCrewCodeError] = useState<string | null>(null);
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] =
        useState<NotificationType>("success");

    // ⚡ 초기 세션 로딩 최적화
    useEffect(() => {
        let isMounted = true;

        const fetchUserSession = async () => {
            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (!isMounted) return;

                if (user && !authError) {
                    setValue("email", user.email || "", { shouldValidate: true });
                    // 자동으로 consent 설정 (UI에서 숨기므로)
                    setValue("privacyConsent", true, { shouldValidate: true });
                    setValue("termsOfService", true, { shouldValidate: true });
                    // 기본 전화번호 설정 (validation 통과용)
                    setValue("phoneNumber", "010-0000-0000", { shouldValidate: true });
                    if (user.user_metadata) {
                        const meta = user.user_metadata;
                        setValue("firstName", meta.full_name || meta.name || "", {
                            shouldValidate: true,
                        });
                    }
                }
            } catch (error) {
                //console.error("Session fetch error:", error);
            }
        };

        fetchUserSession();

        return () => {
            isMounted = false;
        };
    }, [supabase, setValue]);

    // ⚡ 핸들러 함수들 메모이제이션
    const handleVerifyCrewCode = useCallback(async () => {
        const currentCrewCode = getValues("crewCode");
        if (!currentCrewCode) {
            setFormError("crewCode", {
                type: "manual",
                message: "크루 코드를 입력해주세요.",
            });
            return;
        }

        clearFormErrors("crewCode");
        setIsCrewCodeVerifying(true);
        setCrewCodeError(null);
        setCrewCodeVerified(false);
        setValue("verifiedCrewId", "");

        try {
            const response = await fetch("/api/auth/verify-crew-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crewCode: currentCrewCode }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setCrewCodeVerified(true);
                setValue("verifiedCrewId", data.crewId, { shouldValidate: true });
                clearFormErrors("verifiedCrewId");
            } else {
                setFormError("crewCode", {
                    type: "manual",
                    message: data.message || "크루 코드 인증에 실패했습니다.",
                });
            }
        } catch (error) {
            setFormError("crewCode", {
                type: "manual",
                message: "크루 코드 인증 중 오류가 발생했습니다.",
            });
        } finally {
            setIsCrewCodeVerifying(false);
        }
    }, [getValues, setFormError, clearFormErrors, setValue]);

    const handleCrewCodeChange = useCallback(() => {
        setCrewCodeVerified(false);
        setValue("verifiedCrewId", "");
        setCrewCodeError(null);
        clearFormErrors("crewCode");
        clearFormErrors("verifiedCrewId");
    }, [setValue, clearFormErrors]);

    const onFormSubmit: SubmitHandler<SignupFormData> = useCallback(
        async (formData) => {
            if (!crewCodeVerified || !formData.verifiedCrewId) {
                setFormError("root.serverError", {
                    type: "manual",
                    message: "크루 코드 인증을 먼저 완료해주세요.",
                });
                return;
            }
            clearFormErrors("root.serverError");

            try {
                const response = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    setNotificationMessage("회원가입에 성공했습니다.");
                    setNotificationType("success");
                    setIsNotificationVisible(true);
                } else {
                    setNotificationMessage(result.message || "회원가입에 실패했습니다.");
                    setNotificationType("error");
                    setIsNotificationVisible(true);
                }
            } catch (error) {
                setNotificationMessage("회원가입 중 오류가 발생했습니다.");
                setNotificationType("error");
                setIsNotificationVisible(true);
            }
        },
        [crewCodeVerified, setFormError, clearFormErrors]
    );

    const handleNotificationClose = useCallback(() => {
        setIsNotificationVisible(false);
        if (notificationType === "success") {
            router.push("/");
        }
    }, [notificationType, router]);

    const handleFormSubmit = useCallback(() => {
        handleSubmit(onFormSubmit)();
    }, [handleSubmit, onFormSubmit]);

    const isSubmitDisabled = useMemo(() => {
        return isSubmitting || isCrewCodeVerifying || !crewCodeVerified;
    }, [isSubmitting, isCrewCodeVerifying, crewCodeVerified]);

    return (
        <div className='flex flex-col h-screen bg-rh-bg-primary'>
            <PopupNotification
                isVisible={isNotificationVisible}
                message={notificationMessage}
                duration={1500}
                onClose={handleNotificationClose}
                type={notificationType}
            />

            {/* 헤더 */}
            <div className='flex-shrink-0 bg-rh-bg-surface border-b border-rh-border'>
                <PageHeader
                    title='회원가입'
                    backLink='/auth/login'
                    iconColor='white'
                    borderColor='border-rh-border'
                    backgroundColor='bg-rh-bg-surface'
                />
            </div>

            {/* 폼 영역 */}
            <div className='overflow-y-auto flex-1 bg-rh-bg-primary'>
                <div className='px-4 py-6'>
                    <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-5'>
                        {/* 이름 */}
                        <InputField
                            label='이름'
                            placeholder='홍길동'
                            register={register("firstName")}
                            error={errors.firstName?.message}
                        />

                        {/* 닉네임 */}
                        <div>
                            <label className='block mb-1.5 text-xs font-medium text-rh-text-secondary'>
                                닉네임
                            </label>
                            <input
                                type='text'
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder='닉네임을 입력하세요'
                                className='w-full bg-rh-bg-surface border border-rh-border rounded-lg h-12 px-4 text-white text-sm placeholder:text-rh-text-tertiary focus:outline-none focus:ring-2 focus:ring-rh-accent'
                            />
                        </div>

                        {/* 성별 */}
                        <GenderSelect value={gender} onChange={setGender} />

                        {/* 크루 초대코드 */}
                        <CrewCodeVerification
                            register={register}
                            crewCodeInputValue={crewCodeValue}
                            isCrewCodeVerifying={isCrewCodeVerifying}
                            crewCodeVerified={crewCodeVerified}
                            crewCodeError={crewCodeError}
                            errors={errors}
                            onVerifyCrewCode={handleVerifyCrewCode}
                            onCrewCodeChange={handleCrewCodeChange}
                        />

                        {/* 숨겨진 필드들 (폼 제출에 필요) */}
                        <input type='hidden' {...register("email")} />
                        <input type='hidden' {...register("phoneNumber")} />
                        <input type='hidden' {...register("privacyConsent")} />
                        <input type='hidden' {...register("termsOfService")} />

                        {/* 하단 여백 */}
                        <div className='h-20'></div>
                    </form>
                </div>
            </div>

            {/* 하단 고정 버튼 */}
            <div className='flex-shrink-0 p-4 border-t bg-rh-bg-primary border-rh-border'>
                <button
                    type='submit'
                    onClick={handleFormSubmit}
                    disabled={isSubmitDisabled}
                    className='w-full bg-rh-accent rounded-rh-lg h-[52px] text-base font-semibold text-white hover:bg-rh-accent-hover focus:outline-none focus:ring-2 focus:ring-rh-accent disabled:bg-rh-bg-muted disabled:text-rh-text-secondary disabled:cursor-not-allowed'
                >
                    {isSubmitting ? "가입 처리 중..." : "가입하기"}
                </button>
            </div>
        </div>
    );
}
