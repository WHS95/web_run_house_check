"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation"; // 리다이렉션용
import { createClient } from "@/lib/supabase/client";
import {
  signupSchema,
  type SignupFormData,
  formatPhoneNumber,
} from "@/lib/validators/signupSchema"; // Zod 스키마
import PageHeader from "@/components/organisms/common/PageHeader";
import PopupNotification, {
  type NotificationType,
} from "@/components/molecules/common/PopupNotification"; // 경로 수정 및 타입 임포트
import ConsentAgreement from "@/components/molecules/auth/ConsentAgreement";

// TODO: 실제 카카오 사용자 정보 타입 정의 또는 import
interface KakaoUser {
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    email?: string;
  };
}

// ⚡ 개별 입력 필드 컴포넌트들 (메모이제이션)
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
    <div className='mb-4'>
      <label className='block mb-2 text-sm font-semibold text-white'>
        {label}
      </label>
      <input
        type={type}
        {...register}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full p-3 border-0 rounded-md text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-basic-blue ${
          readOnly
            ? "text-gray-300 opacity-60 cursor-not-allowed bg-basic-gray"
            : "bg-basic-black-gray"
        }`}
      />
      {error && <p className='mt-1 text-xs text-red-500'>{error}</p>}
    </div>
  )
);
InputField.displayName = "InputField";

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

    const inputClassName = useMemo(() => {
      const baseClass =
        "flex-1 p-3 border-0 rounded-md bg-basic-black-gray text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-basic-blue";
      const disabledClass =
        "opacity-60 cursor-not-allowed bg-basic-gray text-gray-300";
      return `${baseClass} ${
        isCrewCodeVerifying || crewCodeVerified ? disabledClass : ""
      }`;
    }, [isCrewCodeVerifying, crewCodeVerified]);

    return (
      <div className='mb-4'>
        <label className='block mb-2 text-sm font-semibold text-white'>
          크루 초대 코드
        </label>
        <div className='flex items-center space-x-2'>
          <input
            type='text'
            {...register("crewCode")}
            onChange={(e) => {
              register("crewCode").onChange(e);
              onCrewCodeChange();
            }}
            placeholder='크루 코드를 입력하세요'
            disabled={isCrewCodeVerifying || crewCodeVerified}
            className={inputClassName}
          />
          <button
            type='button'
            onClick={onVerifyCrewCode}
            disabled={isButtonDisabled}
            className='px-4 py-3 text-sm font-medium text-white rounded-md border-0 bg-basic-blue hover:bg-basic-blue/80 focus:outline-none focus:ring-2 focus:ring-basic-blue disabled:bg-basic-gray disabled:text-gray-400 disabled:cursor-not-allowed'
          >
            {buttonText}
          </button>
        </div>

        {/* 에러 및 성공 메시지 */}
        {(errors.crewCode && (
          <p className='mt-1 text-xs text-red-500'>{errors.crewCode.message}</p>
        )) ||
          (crewCodeError && (
            <p className='mt-1 text-xs text-red-500'>{crewCodeError}</p>
          ))}

        {crewCodeVerified && !crewCodeError && !errors.crewCode && (
          <p className='mt-1 text-xs text-green-600'>
            크루 코드가 인증되었습니다.
          </p>
        )}

        <input type='hidden' {...register("verifiedCrewId")} />
        {errors.verifiedCrewId && (
          <p className='mt-1 text-xs text-red-500'>
            {errors.verifiedCrewId.message}
          </p>
        )}
      </div>
    );
  }
);
CrewCodeVerification.displayName = "CrewCodeVerification";

// ⚡ 제출 버튼 컴포넌트
interface SubmitButtonProps {
  isSubmitting: boolean;
  isCrewCodeVerifying: boolean;
  crewCodeVerified: boolean;
  privacyConsentValue: boolean;
  termsOfServiceValue: boolean;
  onSubmit: () => void;
}

const SubmitButton = memo<SubmitButtonProps>(
  ({
    isSubmitting,
    isCrewCodeVerifying,
    crewCodeVerified,
    privacyConsentValue,
    termsOfServiceValue,
    onSubmit,
  }) => {
    const isDisabled = useMemo(() => {
      return (
        isSubmitting ||
        isCrewCodeVerifying ||
        !crewCodeVerified ||
        !privacyConsentValue ||
        !termsOfServiceValue
      );
    }, [
      isSubmitting,
      isCrewCodeVerifying,
      crewCodeVerified,
      privacyConsentValue,
      termsOfServiceValue,
    ]);

    const buttonText = useMemo(() => {
      if (isSubmitting) return "가입 처리 중...";
      if (isDisabled) return "회원가입 내용 작성중";
      return "회원가입";
    }, [isSubmitting, isDisabled]);

    return (
      <div className='flex-shrink-0 p-4 border-t bg-basic-black border-basic-gray'>
        <button
          type='submit'
          onClick={onSubmit}
          disabled={isDisabled}
          className='px-4 py-3 w-full text-sm font-medium text-white rounded-md bg-basic-blue hover:bg-basic-blue/80 focus:outline-none focus:ring-2 focus:ring-basic-blue disabled:bg-basic-gray disabled:text-gray-400 disabled:cursor-not-allowed'
        >
          {buttonText}
        </button>
      </div>
    );
  }
);
SubmitButton.displayName = "SubmitButton";

// ⚡ 메인 SignupPage 컴포넌트
export default function SignupPage() {
  // ⚡ Supabase 클라이언트 메모이제이션
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

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

  // ⚡ Watch 값들 - useMemo 제거하여 실시간 반응성 개선
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
      //console.error("Crew code verification error:", error);
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

  const handlePhoneNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setValue("phoneNumber", formatted);
    },
    [setValue]
  );

  const handlePrivacyConsentChange = useCallback(
    (checked: boolean) => {
      setValue("privacyConsent", checked, { shouldValidate: true });
    },
    [setValue]
  );

  const handleTermsOfServiceChange = useCallback(
    (checked: boolean) => {
      setValue("termsOfService", checked, { shouldValidate: true });
    },
    [setValue]
  );

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
        //console.error("Signup error:", error);
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

  return (
    <div className='flex flex-col h-screen bg-basic-black'>
      <PopupNotification
        isVisible={isNotificationVisible}
        message={notificationMessage}
        duration={1500}
        onClose={handleNotificationClose}
        type={notificationType}
      />

      {/* ⚡ 헤더 - 메모이제이션됨 */}
      <div className='flex-shrink-0 border-b bg-basic-black-gray border-basic-gray'>
        <PageHeader
          title='회원가입'
          backLink='/auth/login'
          iconColor='white'
          borderColor='border-basic-gray'
          backgroundColor='bg-basic-black-gray'
        />
      </div>

      {/* ⚡ 폼 영역 - 스크롤 가능 */}
      <div className='overflow-y-auto flex-1 bg-basic-black'>
        <div className='px-4 py-6'>
          <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-4'>
            {/* ⚡ 개별 입력 필드들 */}
            <InputField
              label='이름'
              placeholder='홍길동'
              register={register("firstName")}
              error={errors.firstName?.message}
            />

            <InputField
              label='이메일'
              placeholder='temp@example.com'
              register={register("email")}
              error={errors.email?.message}
              readOnly={true}
              type='email'
            />

            <InputField
              label='휴대폰 번호'
              placeholder='010-1234-5678'
              register={register("phoneNumber")}
              error={errors.phoneNumber?.message}
              onChange={handlePhoneNumberChange}
            />

            <InputField
              label='생년'
              placeholder='1991(YYYY)'
              register={register("birthYear")}
              error={errors.birthYear?.message}
              type='number'
            />

            {/* 구분선 */}
            <div className='my-6 border-t border-basic-gray'></div>

            {/* ⚡ 크루 코드 검증 */}
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

            {/* 구분선 */}
            <div className='my-6 border-t border-basic-gray'></div>

            {/* ⚡ 동의 항목들 */}
            <ConsentAgreement
              termsOfService={termsOfServiceValue}
              privacyConsent={privacyConsentValue}
              onTermsOfServiceChange={handleTermsOfServiceChange}
              onPrivacyConsentChange={handlePrivacyConsentChange}
              errors={{
                termsOfService: errors.termsOfService?.message,
                privacyConsent: errors.privacyConsent?.message,
              }}
            />

            {/* 하단 여백 추가 (고정 버튼과의 간격) */}
            <div className='h-20'></div>
          </form>
        </div>
      </div>

      {/* ⚡ 하단 고정 버튼 */}
      <SubmitButton
        isSubmitting={isSubmitting}
        isCrewCodeVerifying={isCrewCodeVerifying}
        crewCodeVerified={crewCodeVerified}
        privacyConsentValue={privacyConsentValue}
        termsOfServiceValue={termsOfServiceValue}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
