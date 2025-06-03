"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormData } from "@/lib/validators/signupSchema";
import { createClient } from "@/lib/supabase/client"; // 클라이언트 Supabase 사용
import { useRouter } from "next/navigation";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";

// TODO: Input, Button 등 atom 컴포넌트 경로 확인 및 필요시 생성/수정
// import Input from '@/components/atoms/Input';
// import Button from '@/components/atoms/Button';

const SignupForm: React.FC = () => {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] =
    useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      email: "",
      phoneNumber: "",
      birthYear: undefined,
      verifiedCrewId: "",
      crewCode: "",
      privacyConsent: false,
      termsOfService: false,
    } as SignupFormData,
  });

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setIsLoading(true);
    setNotificationMessage("");
    setNotificationType(null);
    setShowNotification(false);

    setShowNotification(true);
    setIsLoading(false);
  };

  // 임시 Input 및 Button 스타일. 추후 atom 컴포넌트로 대체
  const inputStyle =
    "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const buttonStyle =
    "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400";
  const errorTextStyle = "mt-1 text-xs text-red-600";

  return (
    <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
      <div className='px-4 py-8 bg-white shadow sm:rounded-lg sm:px-10'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div>
            <label
              htmlFor='firstName'
              className='block text-sm font-medium text-gray-700'
            >
              이름
            </label>
            <input
              id='firstName'
              type='text'
              {...register("firstName")}
              className={inputStyle}
            />
            {errors.firstName && (
              <p className={errorTextStyle}>{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700'
            >
              이메일 주소
            </label>
            <input
              id='email'
              type='email'
              {...register("email")}
              className={inputStyle}
            />
            {errors.email && (
              <p className={errorTextStyle}>{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='birthYear'
              className='block text-sm font-medium text-gray-700'
            >
              출생 연도 (선택)
            </label>
            <input
              id='birthYear'
              type='number'
              {...register("birthYear")}
              className={inputStyle}
              placeholder='YYYY'
            />
            {errors.birthYear && (
              <p className={errorTextStyle}>{errors.birthYear.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='phone'
              className='block text-sm font-medium text-gray-700'
            >
              연락처 (선택)
            </label>
            <input
              id='phone'
              type='tel'
              {...register("phoneNumber")}
              className={inputStyle}
              placeholder='010-1234-5678'
            />
            {errors.phoneNumber && (
              <p className={errorTextStyle}>{errors.phoneNumber.message}</p>
            )}
          </div>

          <div>
            <button type='submit' disabled={isLoading} className={buttonStyle}>
              {isLoading ? "가입 처리 중..." : "회원가입"}
            </button>
          </div>
        </form>
      </div>
      {notificationType && (
        <PopupNotification
          isVisible={showNotification}
          message={notificationMessage}
          type={notificationType}
          duration={5000} // 성공/오류 메시지 표시 시간 증가
          onClose={() => {
            setShowNotification(false);
            if (notificationType === "success") {
              // 성공 시 이메일 확인 페이지 또는 로그인 페이지로 리디렉션 할 수 있습니다.
              // router.push('/auth/login');
            }
          }}
        />
      )}
    </div>
  );
};

export default SignupForm;
