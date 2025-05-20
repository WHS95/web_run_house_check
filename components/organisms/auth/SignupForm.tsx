"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormValues } from "@/lib/validators/signupSchema";
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
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      email: "",
      password: "",
      confirmPassword: "",
      birthYear: undefined,
      phone: undefined,
    } as SignupFormValues,
  });

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setIsLoading(true);
    setNotificationMessage("");
    setNotificationType(null);
    setShowNotification(false);

    const birthYearForSupabase =
      data.birthYear === undefined ? null : data.birthYear;
    const phoneForSupabase = data.phone === undefined ? null : data.phone;

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          birth_year: birthYearForSupabase,
          phone: phoneForSupabase,
        },
      },
    });

    if (error) {
      console.error("회원가입 오류:", error);
      setNotificationMessage(
        error.message || "회원가입 중 오류가 발생했습니다."
      );
      setNotificationType("error");
    } else {
      // 회원가입 성공 시, users 테이블에 추가 정보 저장 (선택적)
      // Supabase auth.signUp에서 options.data로 전달하면 자동으로 users 테이블의 메타데이터로 들어가지 않음.
      // 별도의 함수를 호출하거나, Supabase function (Edge function)을 트리거로 연결하여 users 테이블에 저장 필요.
      // 현재는 이메일 확인을 위해 다음 단계로 안내하는 메시지를 표시합니다.
      setNotificationMessage(
        "회원가입이 거의 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요."
      );
      setNotificationType("success");
      // router.push('/auth/verify-email'); // 이메일 확인 안내 페이지로 이동 (필요시 생성)
    }
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
              htmlFor='password'
              className='block text-sm font-medium text-gray-700'
            >
              비밀번호
            </label>
            <input
              id='password'
              type='password'
              {...register("password")}
              className={inputStyle}
            />
            {errors.password && (
              <p className={errorTextStyle}>{errors.password.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700'
            >
              비밀번호 확인
            </label>
            <input
              id='confirmPassword'
              type='password'
              {...register("confirmPassword")}
              className={inputStyle}
            />
            {errors.confirmPassword && (
              <p className={errorTextStyle}>{errors.confirmPassword.message}</p>
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
              {...register("phone")}
              className={inputStyle}
              placeholder='010-1234-5678'
            />
            {errors.phone && (
              <p className={errorTextStyle}>{errors.phone.message}</p>
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
