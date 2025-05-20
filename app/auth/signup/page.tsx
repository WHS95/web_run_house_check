import React from "react";
import SignupForm from "@/components/organisms/auth/SignupForm";
// import PageHeader from '@/components/organisms/common/PageHeader'; // 필요시 주석 해제하여 사용

export default function SignupPage() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          {/* <PageHeader title="회원가입" /> */}
          {/* PageHeader 대신 간단한 텍스트 제목 사용 */}
          <h1 className='text-4xl font-bold tracking-tight text-gray-900'>
            TCRC 회원가입
          </h1>
          <p className='mt-2 text-sm text-gray-500'>
            런하우스 서비스 이용을 위해 회원 정보를 입력해주세요.
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
