"use client";

import React, { useState, useCallback, memo, useMemo } from "react";
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

// ⚡ SVG 아이콘 컴포넌트 메모이제이션
const ChevronRightIcon = memo(() => (
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
));
ChevronRightIcon.displayName = "ChevronRightIcon";

// ⚡ 메인 컴포넌트 메모이제이션
const ConsentAgreement = memo<ConsentAgreementProps>(
  ({
    termsOfService,
    privacyConsent,
    onTermsOfServiceChange,
    onPrivacyConsentChange,
    errors,
  }) => {
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

    // ⚡ 전체 동의 상태 계산 메모이제이션
    const allAgreed = useMemo(
      () => termsOfService && privacyConsent,
      [termsOfService, privacyConsent]
    );

    // ⚡ 핸들러 함수들 메모이제이션
    const handleAllAgreementChange = useCallback(
      (checked: boolean) => {
        onTermsOfServiceChange(checked);
        onPrivacyConsentChange(checked);
      },
      [onTermsOfServiceChange, onPrivacyConsentChange]
    );

    const handleTermsOfServiceChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onTermsOfServiceChange(e.target.checked);
      },
      [onTermsOfServiceChange]
    );

    const handlePrivacyConsentChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onPrivacyConsentChange(e.target.checked);
      },
      [onPrivacyConsentChange]
    );

    const handleAllAgreementClick = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        handleAllAgreementChange(e.target.checked);
      },
      [handleAllAgreementChange]
    );

    // ⚡ 모달 핸들러들 메모이제이션
    const openTermsModal = useCallback(() => setIsTermsModalOpen(true), []);
    const closeTermsModal = useCallback(() => setIsTermsModalOpen(false), []);
    const openPrivacyModal = useCallback(() => setIsPrivacyModalOpen(true), []);
    const closePrivacyModal = useCallback(
      () => setIsPrivacyModalOpen(false),
      []
    );

    // ⚡ 에러 메시지 렌더링 메모이제이션
    const errorMessages = useMemo(() => {
      if (!errors?.termsOfService && !errors?.privacyConsent) return null;

      return (
        <div className='mt-2 space-y-1'>
          {errors?.termsOfService && (
            <p className='text-xs text-red-500'>{errors.termsOfService}</p>
          )}
          {errors?.privacyConsent && (
            <p className='text-xs text-red-500'>{errors.privacyConsent}</p>
          )}
        </div>
      );
    }, [errors?.termsOfService, errors?.privacyConsent]);

    return (
      <>
        <div className='mb-4'>
          {/* 전체 동의 */}
          <div className='pb-4 mb-4 border-b border-basic-gray'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={allAgreed}
                onChange={handleAllAgreementClick}
                className='w-5 h-5 text-basic-blue bg-basic-black-gray border-basic-gray rounded focus:ring-basic-blue focus:ring-2'
              />
              <span className='ml-3 text-base font-semibold text-white'>
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
                  onChange={handleTermsOfServiceChange}
                  className='w-4 h-4 text-basic-blue bg-basic-black-gray border-basic-gray rounded focus:ring-basic-blue focus:ring-2'
                />
                <div className='ml-3'>
                  <span className='text-sm font-medium text-basic-blue'>
                    필수
                  </span>
                  <span className='ml-2 text-sm text-white'>
                    서비스 이용약관
                  </span>
                </div>
              </label>
              <button
                type='button'
                onClick={openTermsModal}
                className='text-gray-400 hover:text-gray-300'
              >
                <ChevronRightIcon />
              </button>
            </div>

            {/* 개인정보 수집 및 이용동의 */}
            <div className='flex items-center justify-between'>
              <label className='flex items-center flex-1 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={privacyConsent}
                  onChange={handlePrivacyConsentChange}
                  className='w-4 h-4 text-basic-blue bg-basic-black-gray border-basic-gray rounded focus:ring-basic-blue focus:ring-2'
                />
                <div className='ml-3'>
                  <span className='text-sm font-medium text-basic-blue'>
                    필수
                  </span>
                  <span className='ml-2 text-sm text-white'>
                    개인정보 수집 및 이용동의
                  </span>
                </div>
              </label>
              <button
                type='button'
                onClick={openPrivacyModal}
                className='text-gray-400 hover:text-gray-300'
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>

        {/* ⚡ 에러 메시지 메모이제이션 */}
        {errorMessages}

        {/* 모달들 */}
        <TermsOfServiceModal
          isOpen={isTermsModalOpen}
          onClose={closeTermsModal}
        />
        <PrivacyConsentModal
          isOpen={isPrivacyModalOpen}
          onClose={closePrivacyModal}
        />
      </>
    );
  }
);

ConsentAgreement.displayName = "ConsentAgreement";

export default ConsentAgreement;
