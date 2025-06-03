"use client";

import React, { useState } from "react";
import TermsOfServiceModal from "./TermsOfServiceModal";
import PrivacyConsentModal from "./PrivacyConsentModal";

interface ConsentAgreementProps {
  termsOfService: boolean;
  privacyConsent: boolean;
  onTermsOfServiceChange: (checked: boolean) => void;
  onPrivacyConsentChange: (checked: boolean) => void;
  errors?: {
    termsOfService?: string;
    privacyConsent?: string;
  };
}

export default function ConsentAgreement({
  termsOfService,
  privacyConsent,
  onTermsOfServiceChange,
  onPrivacyConsentChange,
  errors,
}: ConsentAgreementProps) {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // 전체 동의 상태 계산
  const allAgreed = termsOfService && privacyConsent;

  // 전체 동의 토글 핸들러
  const handleAllAgreementChange = (checked: boolean) => {
    onTermsOfServiceChange(checked);
    onPrivacyConsentChange(checked);
  };

  return (
    <>
      <div className='mb-4'>
        {/* 전체 동의 */}
        <div className='pb-4 mb-4 border-b border-gray-200'>
          <label className='flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={allAgreed}
              onChange={(e) => handleAllAgreementChange(e.target.checked)}
              className='w-5 h-5 bg-gray-100 border-gray-300 rounded text-primary-blue focus:ring-primary-blue focus:ring-2'
            />
            <span className='ml-3 text-base font-semibold text-gray-900'>
              전체동의
            </span>
          </label>
        </div>

        {/* 개별 동의 항목들 */}
        <div className='space-y-4'>
          {/* 서비스 이용약관 */}
          <div className='flex items-center justify-between'>
            <label className='flex items-center flex-1 cursor-pointer'>
              <input
                type='checkbox'
                checked={termsOfService}
                onChange={(e) => onTermsOfServiceChange(e.target.checked)}
                className='w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-blue focus:ring-primary-blue focus:ring-2'
              />
              <div className='ml-3'>
                <span className='text-sm font-medium text-primary-blue'>
                  필수
                </span>
                <span className='ml-2 text-sm text-gray-900'>
                  서비스 이용약관
                </span>
              </div>
            </label>
            <button
              type='button'
              onClick={() => setIsTermsModalOpen(true)}
              className='text-gray-400 hover:text-gray-600'
            >
              <svg
                width='8'
                height='14'
                viewBox='0 0 8 14'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M1 1L7 7L1 13'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          </div>

          {/* 개인정보 수집 및 이용동의 */}
          <div className='flex items-center justify-between'>
            <label className='flex items-center flex-1 cursor-pointer'>
              <input
                type='checkbox'
                checked={privacyConsent}
                onChange={(e) => onPrivacyConsentChange(e.target.checked)}
                className='w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-blue focus:ring-primary-blue focus:ring-2'
              />
              <div className='ml-3'>
                <span className='text-sm font-medium text-primary-blue'>
                  필수
                </span>
                <span className='ml-2 text-sm text-gray-900'>
                  개인정보 수집 및 이용동의
                </span>
              </div>
            </label>
            <button
              type='button'
              onClick={() => setIsPrivacyModalOpen(true)}
              className='text-gray-400 hover:text-gray-600'
            >
              <svg
                width='8'
                height='14'
                viewBox='0 0 8 14'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M1 1L7 7L1 13'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {(errors?.termsOfService || errors?.privacyConsent) && (
        <div className='mt-2 space-y-1'>
          {errors?.termsOfService && (
            <p className='text-xs text-red-500'>{errors.termsOfService}</p>
          )}
          {errors?.privacyConsent && (
            <p className='text-xs text-red-500'>{errors.privacyConsent}</p>
          )}
        </div>
      )}

      {/* 모달들 */}
      <TermsOfServiceModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
      <PrivacyConsentModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </>
  );
}
