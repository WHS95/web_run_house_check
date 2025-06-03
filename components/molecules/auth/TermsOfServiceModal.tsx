"use client";

import React from "react";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({
  isOpen,
  onClose,
}: TermsOfServiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-basic-black bg-opacity-50'>
      <div className='bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-hidden'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            런하우스 이용약관
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
              본 약관은 러닝 크루 연결 플랫폼 '런하우스(RunHouse)'(이하
              "서비스")의 이용과 관련하여 이용자(이하 "회원")와 운영자(이하
              "운영자") 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을
              목적으로 합니다.
            </p>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>제1조 (정의)</h3>
              <ul className='ml-2 space-y-1 text-xs list-disc list-inside'>
                <li>
                  <strong>서비스:</strong> '런하우스' 웹사이트 및 관련 도메인,
                  모바일 환경에서 제공되는 모든 기능과 정보
                </li>
                <li>
                  <strong>회원:</strong> 본 약관에 따라 서비스에 접속하여 소셜
                  로그인(카카오)을 통해 회원가입한 자
                </li>
                <li>
                  <strong>크루:</strong> 러닝 활동을 목적으로 형성된 그룹
                </li>
                <li>
                  <strong>운영자:</strong> 서비스를 개발, 관리, 운영하는 개인
                  또는 조직
                </li>
              </ul>
            </div>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>
                제2조 (약관의 효력 및 변경)
              </h3>
              <div className='space-y-1 text-xs'>
                <p>
                  1. 본 약관은 회원이 서비스에 최초 로그인하거나 회원가입 시
                  동의함으로써 효력이 발생합니다.
                </p>
                <p>
                  2. 운영자는 관련 법령을 위반하지 않는 범위에서 약관을 개정할
                  수 있으며, 변경 시 서비스 내 공지합니다.
                </p>
                <p>
                  3. 변경된 약관에 동의하지 않을 경우 회원 탈퇴가 가능하며, 변경
                  이후 서비스를 계속 이용할 경우 동의한 것으로 간주됩니다.
                </p>
              </div>
            </div>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>
                제3조 (회원가입)
              </h3>
              <div className='space-y-1 text-xs'>
                <p>
                  1. 회원가입은 카카오 계정을 통한 소셜 로그인 방식으로
                  진행됩니다.
                </p>
                <p>
                  2. 운영자는 기술적/운영상 사유로 회원가입 승인을 제한할 수
                  있습니다.
                </p>
                <p>
                  3. 회원은 이름, 이메일, 휴대폰번호, 생년 등의 정보를 정확히
                  입력해야 하며, 허위 정보 제공 시 서비스 이용이 제한될 수
                  있습니다.
                </p>
              </div>
            </div>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>
                제4조 (회원의 의무)
              </h3>
              <div className='space-y-1 text-xs'>
                <p>
                  1. 회원은 관련 법령 및 본 약관을 준수해야 하며, 다음 행위를
                  해서는 안 됩니다:
                </p>
                <ul className='ml-4 space-y-1 list-disc list-inside'>
                  <li>허위 정보 입력 또는 타인의 정보 도용</li>
                  <li>
                    타 회원 또는 제3자의 명예 훼손, 비방, 협박 등 불법 행위
                  </li>
                  <li>광고, 홍보, 스팸성 내용 게시</li>
                  <li>크루 활동 외 서비스 목적에 반하는 이용 행위</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>
                제5조 (서비스의 제공 및 변경)
              </h3>
              <div className='space-y-1 text-xs'>
                <p>1. 운영자는 다음 기능을 포함한 서비스를 제공합니다:</p>
                <ul className='ml-4 space-y-1 list-disc list-inside'>
                  <li>러닝 크루 정보 열람 및 검색</li>
                  <li>크루 초대코드 입력 기능</li>
                  <li>크루 관련 도구(예: 페이스 계산기, 거리 측정기 등)</li>
                </ul>
                <p>
                  2. 운영자는 서비스의 기능을 예고 없이 추가, 변경, 중단할 수
                  있으며, 이로 인해 발생하는 손해에 대해 책임지지 않습니다.
                </p>
              </div>
            </div>

            <div>
              <h3 className='mb-2 font-semibold text-gray-900'>
                제10조 (책임의 제한)
              </h3>
              <div className='space-y-1 text-xs'>
                <p>
                  1. 운영자는 크루 활동 중 발생한 사고나 손해에 대해 책임을 지지
                  않습니다.
                </p>
                <p>
                  2. 회원 간의 분쟁, 정보의 정확성·신뢰성에 대해서는 개입하지
                  않으며, 이에 따른 손해도 책임지지 않습니다.
                </p>
              </div>
            </div>

            <div className='pt-4 text-center border-t border-gray-200'>
              <p className='text-xs text-gray-500'>
                <strong>부칙:</strong> 본 약관은 2025년 6월 3일부터 적용됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className='p-4 border-t border-gray-200'>
          <button
            onClick={onClose}
            className='w-full px-4 py-2 text-white rounded-md bg-primary-blue bg-basic-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary-blue'
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
