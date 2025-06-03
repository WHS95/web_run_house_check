"use client";

import React from "react";

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyConsentModal({
  isOpen,
  onClose,
}: PrivacyConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-basic-black bg-opacity-50'>
      <div className='bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-hidden'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            개인정보 수집·이용 동의서
          </h2>
          <button
            onClick={onClose}
            className='text-xl font-bold text-gray-400 hover:text-gray-600'
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div className='p-4 overflow-y-auto max-h-[60vh]'>
          <div className='space-y-4 text-sm text-gray-700'>
            <p className='font-medium text-gray-900'>
              서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다. 동의를
              거부할 권리가 있으나, 동의하지 않을 경우 회원가입이 제한될 수
              있습니다.
            </p>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>1. 수집 항목</h3>
              <ul className='ml-2 space-y-1 list-disc list-inside'>
                <li>이름</li>
                <li>이메일</li>
                <li>휴대폰 번호</li>
                <li>생년(출생 연도)</li>
              </ul>
              <p className='mt-2 text-xs text-gray-600'>
                ※ 카카오 소셜 로그인 시, 제공되는 사용자 정보(예: 이메일, 프로필
                등)도 포함됩니다.
              </p>
            </div>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>
                2. 수집 및 이용 목적
              </h3>
              <ul className='ml-2 space-y-1 list-disc list-inside'>
                <li>회원 식별 및 가입 의사 확인</li>
                <li>서비스 제공 및 이용자 맞춤 정보 제공</li>
                <li>문의 또는 분쟁 대응 등 고객 지원</li>
              </ul>
            </div>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>
                3. 보유 및 이용 기간
              </h3>
              <ul className='ml-2 space-y-1 list-disc list-inside'>
                <li>회원 탈퇴 시까지 보관 후 즉시 파기</li>
                <li>
                  단, 관련 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간
                  동안 보관
                </li>
              </ul>
            </div>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>
                4. 동의 거부 권리 및 불이익 안내
              </h3>
              <p>
                귀하는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있으며,
                동의하지 않을 경우 회원가입이 제한될 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className='p-4 border-t border-gray-200'>
          <button
            onClick={onClose}
            className='w-full px-4 py-2 text-white rounded-md bg-basic-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary-blue'
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
