"use client";

import React, { useState, useEffect } from "react";
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

export default function SignupPage() {
  const supabase = createClient();
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

  const crewCodeInputValue = watch("crewCode");
  const privacyConsentValue = watch("privacyConsent");
  const termsOfServiceValue = watch("termsOfService");

  const [isCrewCodeVerifying, setIsCrewCodeVerifying] = useState(false);
  const [crewCodeVerified, setCrewCodeVerified] = useState(false);
  const [crewCodeError, setCrewCodeError] = useState<string | null>(null);

  // 알림 상태 변수 수정 및 추가
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("success"); // 초기값은 success이나, 사용 전 항상 설정됨

  useEffect(() => {
    const fetchUserSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setValue("email", session.user.email || "", { shouldValidate: true });
        if (session.user.user_metadata) {
          const meta = session.user.user_metadata;
          setValue("firstName", meta.full_name || meta.name || "", {
            shouldValidate: true,
          });
        }
      }
    };
    fetchUserSession();
  }, [supabase, setValue]);

  const handleVerifyCrewCode = async () => {
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
      console.error("Crew code verification error:", error);
      setFormError("crewCode", {
        type: "manual",
        message: "크루 코드 인증 중 오류가 발생했습니다.",
      });
    } finally {
      setIsCrewCodeVerifying(false);
    }
  };

  const handlePrivacyConsentChange = (checked: boolean) => {
    setValue("privacyConsent", checked, { shouldValidate: true });
  };

  const handleTermsOfServiceChange = (checked: boolean) => {
    setValue("termsOfService", checked, { shouldValidate: true });
  };

  const onFormSubmit: SubmitHandler<SignupFormData> = async (formData) => {
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
      console.error("Signup error:", error);
      setNotificationMessage("회원가입 중 오류가 발생했습니다.");
      setNotificationType("error");
      setIsNotificationVisible(true);
    }
  };

  const handleNotificationClose = () => {
    setIsNotificationVisible(false);
    // 메시지나 타입 초기화는 필수는 아님. isVisible로 제어.
    if (notificationType === "success") {
      router.push("/");
    }
  };

  return (
    <div className='flex flex-col h-screen bg-white'>
      <PopupNotification
        isVisible={isNotificationVisible}
        message={notificationMessage}
        duration={1500}
        onClose={handleNotificationClose}
        type={notificationType}
      />

      {/* 헤더 - 고정 */}
      <div className='flex-shrink-0 bg-white border-b border-[#EAEAF3]'>
        <PageHeader
          title='회원가입'
          backLink='/auth/login'
          iconColor='black'
          borderColor='border-[#EAEAF3]'
        />
      </div>

      {/* 폼 영역 - 스크롤 가능 */}
      <div className='flex-1 overflow-y-auto'>
        <div className='px-4 py-6'>
          <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-4'>
            {/* 이름 입력 */}
            <div className='mb-4'>
              <label className='block mb-2 text-sm font-semibold'>이름</label>
              <input
                type='text'
                {...register("firstName")}
                placeholder='홍길동'
                className='w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm placeholder-black/40 focus:outline-none focus:ring-1 focus:ring-primary-blue'
              />
              {errors.firstName && (
                <p className='mt-1 text-xs text-red-500'>
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* 이메일 입력 */}
            <div className='mb-4'>
              <label className='block mb-2 text-sm font-semibold'>이메일</label>
              <input
                type='email'
                {...register("email")}
                placeholder='temp@example.com'
                readOnly
                className='w-full p-3 border border-[#EAEAF3] rounded-md bg-gray-200 text-sm placeholder-black/40 opacity-60 cursor-not-allowed text-gray-700 border-gray-300'
              />
              {errors.email && (
                <p className='mt-1 text-xs text-red-500'>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 휴대폰 번호 입력 */}
            <div className='mb-4'>
              <label className='block mb-2 text-sm font-semibold'>
                휴대폰 번호
              </label>
              <input
                type='text'
                {...register("phoneNumber", {
                  onChange: (e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setValue("phoneNumber", formatted);
                  },
                })}
                placeholder='010-1234-5678'
                className='w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm placeholder-black/20 focus:outline-none focus:ring-1 focus:ring-primary-blue'
              />
              {errors.phoneNumber && (
                <p className='mt-1 text-xs text-red-500'>
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* 생년 입력 */}
            <div className='mb-4'>
              <label className='block mb-2 text-sm font-semibold'>생년</label>
              <input
                type='number'
                {...register("birthYear")}
                placeholder='1995(YYYY)'
                className='w-full p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm placeholder-black/20 focus:outline-none focus:ring-1 focus:ring-primary-blue'
              />
              {errors.birthYear && (
                <p className='mt-1 text-xs text-red-500'>
                  {errors.birthYear.message}
                </p>
              )}
            </div>

            {/* 구분선 */}
            <div className='my-6 border-t border-[#EAEAF3]'></div>

            {/* 크루 초대 코드 */}
            <div className='mb-4'>
              <label className='block mb-2 text-sm font-semibold'>
                크루 초대 코드
              </label>
              <div className='flex items-center space-x-2'>
                <input
                  type='text'
                  {...register("crewCode", {
                    onChange: () => {
                      setCrewCodeVerified(false);
                      setValue("verifiedCrewId", "");
                      setCrewCodeError(null);
                      clearFormErrors("crewCode");
                      clearFormErrors("verifiedCrewId");
                    },
                  })}
                  placeholder='크루 코드를 입력하세요'
                  disabled={isCrewCodeVerifying || crewCodeVerified}
                  className={`flex-1 p-3 border border-[#EAEAF3] rounded-md bg-[#F8F8FD] text-sm placeholder-black/20 focus:outline-none focus:ring-1 focus:ring-primary-blue ${
                    isCrewCodeVerifying || crewCodeVerified
                      ? "opacity-60 cursor-not-allowed bg-gray-200 text-gray-700 border-gray-300"
                      : ""
                  }`}
                />
                <button
                  type='button'
                  onClick={handleVerifyCrewCode}
                  disabled={
                    isCrewCodeVerifying ||
                    crewCodeVerified ||
                    !crewCodeInputValue
                  }
                  className='px-4 py-3 border border-[#EAEAF3] rounded-md text-sm text-black font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-blue disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed'
                >
                  {isCrewCodeVerifying
                    ? "확인중"
                    : crewCodeVerified
                    ? "인증됨"
                    : "확인"}
                </button>
              </div>
              {(errors.crewCode && (
                <p className='mt-1 text-xs text-red-500'>
                  {errors.crewCode.message}
                </p>
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

            {/* 구분선 */}
            <div className='my-6 border-t border-[#EAEAF3]'></div>

            {/* 동의 항목들 */}
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

      {/* 하단 고정 버튼 */}
      <div className='flex-shrink-0 p-4 shadow-lg'>
        <button
          type='submit'
          onClick={handleSubmit(onFormSubmit)}
          disabled={
            isSubmitting ||
            isCrewCodeVerifying ||
            !crewCodeVerified ||
            !privacyConsentValue ||
            !termsOfServiceValue
          }
          className='w-full px-4 py-3 text-sm font-medium text-white rounded-md bg-basic-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue disabled:bg-basic-black disabled:cursor-not-allowed'
        >
          {isSubmitting
            ? "가입 처리 중..."
            : isSubmitting ||
              isCrewCodeVerifying ||
              !crewCodeVerified ||
              !privacyConsentValue ||
              !termsOfServiceValue
            ? "회원가입 내용 작성중"
            : "회원가입"}
        </button>
      </div>
    </div>
  );
}
