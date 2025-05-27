"use client";

import React, { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation"; // 리다이렉션용
import { createClient } from "@/lib/supabase/client";
import {
  signupSchema,
  type SignupFormData,
} from "@/lib/validators/signupSchema"; // Zod 스키마
import { IoArrowBack } from "react-icons/io5"; // 새로운 아이콘 추가
import PopupNotification, {
  type NotificationType,
} from "@/components/molecules/common/PopupNotification"; // 경로 수정 및 타입 임포트

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
      birthYear: undefined,
      crewCode: "",
      verifiedCrewId: "",
    },
  });

  const crewCodeInputValue = watch("crewCode");

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

  // 새로운 스타일 정의
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const inputFieldStyle =
    "block w-full px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm placeholder-gray-400";
  const errorTextStyle = "mt-1 text-sm text-red-500"; // 기존 errorTextStyle 유지 또는 통합
  const primaryButtonStyle =
    "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-300";
  const secondaryButtonStyle =
    "ml-2 px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-200 disabled:text-gray-400";

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <PopupNotification
        isVisible={isNotificationVisible}
        message={notificationMessage}
        duration={3000} // 3초로 설정
        onClose={handleNotificationClose}
        type={notificationType}
      />
      {/* 헤더 시작 */}
      <header className='sticky top-0 z-10 w-full bg-white shadow-sm'>
        <div className='max-w-md px-4 mx-auto'>
          <div className='flex items-center justify-between h-16'>
            <button
              onClick={() => router.back()}
              className='p-2 text-gray-600 hover:text-gray-800'
              aria-label='뒤로 가기'
            >
              <IoArrowBack className='w-6 h-6' />
            </button>
            <h1 className='text-lg font-semibold text-gray-900'>회원가입</h1>
            <div className='w-6 h-6'></div> {/* 오른쪽 정렬용 빈 div */}
          </div>
        </div>
      </header>
      {/* 헤더 끝 */}

      {/* 폼 영역 시작 */}
      <main className='flex flex-col items-center justify-center flex-grow px-4 py-8 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-6'>
          {/* 폼 내용은 다음 단계에서 스타일 적용 예정 */}
          <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-5'>
            <div>
              <label htmlFor='firstName' className={labelStyle}>
                이름
              </label>
              <input
                type='text'
                id='firstName'
                {...register("firstName")}
                className={inputFieldStyle}
                placeholder='김연수'
              />
              {errors.firstName && (
                <p className={errorTextStyle}>{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor='email' className={labelStyle}>
                이메일
              </label>
              <input
                type='email'
                id='email'
                {...register("email")}
                className={inputFieldStyle}
                placeholder='runday@example.com'
                readOnly
              />
              {errors.email && (
                <p className={errorTextStyle}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor='birthYear' className={labelStyle}>
                생년
              </label>
              <input
                type='number'
                id='birthYear'
                {...register("birthYear")}
                className={inputFieldStyle}
                placeholder='1993 (YYYY)'
              />
              {errors.birthYear && (
                <p className={errorTextStyle}>{errors.birthYear.message}</p>
              )}
            </div>

            <hr className='my-6' />

            <div>
              <label htmlFor='crewCode' className={labelStyle}>
                크루 초대 코드
              </label>
              <div className='flex items-center'>
                <input
                  type='text'
                  id='crewCode'
                  {...register("crewCode", {
                    onChange: () => {
                      setCrewCodeVerified(false);
                      setValue("verifiedCrewId", "");
                      setCrewCodeError(null);
                      clearFormErrors("crewCode");
                      clearFormErrors("verifiedCrewId");
                    },
                  })}
                  className={`${inputFieldStyle} flex-grow`}
                  placeholder='크루 코드를 입력하세요'
                  disabled={isCrewCodeVerifying || crewCodeVerified}
                />
                <button
                  type='button'
                  onClick={handleVerifyCrewCode}
                  disabled={
                    isCrewCodeVerifying ||
                    crewCodeVerified ||
                    !crewCodeInputValue
                  }
                  className={secondaryButtonStyle}
                >
                  {isCrewCodeVerifying
                    ? "확인중"
                    : crewCodeVerified
                    ? "인증됨"
                    : "확인"}
                </button>
              </div>
              {(errors.crewCode && (
                <p className={errorTextStyle}>{errors.crewCode.message}</p>
              )) ||
                (crewCodeError && (
                  <p className={errorTextStyle}>{crewCodeError}</p>
                ))}
              {crewCodeVerified && !crewCodeError && !errors.crewCode && (
                <p className='mt-2 text-sm text-green-600'>
                  크루 코드가 인증되었습니다.
                </p>
              )}

              <input type='hidden' {...register("verifiedCrewId")} />
              {errors.verifiedCrewId && (
                <p className={errorTextStyle}>
                  {errors.verifiedCrewId.message}
                </p>
              )}
            </div>

            <div className='pt-4'>
              <button
                type='submit'
                disabled={
                  isSubmitting || isCrewCodeVerifying || !crewCodeVerified
                }
                className={primaryButtonStyle}
              >
                {isSubmitting ? "가입 처리 중..." : "회원가입"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
