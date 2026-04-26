"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { validateUserLocation, formatDistance } from '@/lib/utils/distance';
import { haptic } from '@/lib/haptic';
import SectionLabel from '@/components/atoms/SectionLabel';

interface LocationVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (isVerified: boolean, message: string) => void;
  crewLocations: Array<{
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    allowed_radius?: number;
  }>;
  allowedRadius?: number;
}

const LocationVerificationModal: React.FC<LocationVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  crewLocations,
  allowedRadius = 50,
}) => {
  const [verificationStatus, setVerificationStatus] = useState<
    'checking' | 'success' | 'failed' | 'error'
  >('checking');
  const [verificationMessage, setVerificationMessage] = useState('');
  const { getCurrentLocation, loading, error } = useGeolocation();

  const handleLocationCheck = async () => {
    try {
      setVerificationStatus('checking');
      setVerificationMessage('위치 확인 중...');

      // GPS 위치 가져오기
      const userLocation = await getCurrentLocation();

      // 활동장소가 설정되지 않은 경우
      if (crewLocations.length === 0) {
        setVerificationStatus('success');
        setVerificationMessage('활동장소가 설정되지 않아 어디서든 출석 가능합니다.');
        onVerified(true, '활동장소가 설정되지 않아 어디서든 출석 가능합니다.');
        return;
      }

      // 좌표가 없는 활동장소는 필터링
      const validLocations = crewLocations
        .filter(loc => loc.latitude !== null && loc.longitude !== null)
        .map(loc => ({
          name: loc.name,
          latitude: loc.latitude!,
          longitude: loc.longitude!,
          allowedRadius: loc.allowed_radius || allowedRadius,
        }));

      // 유효한 활동장소가 없는 경우
      if (validLocations.length === 0) {
        setVerificationStatus('success');
        setVerificationMessage('GPS 좌표가 설정된 활동장소가 없어 어디서든 출석 가능합니다.');
        onVerified(true, 'GPS 좌표가 설정된 활동장소가 없어 어디서든 출석 가능합니다.');
        return;
      }

      // 위치 검증
      const validation = validateUserLocation(
        userLocation,
        validLocations,
        allowedRadius
      );

      if (validation.isValid) {
        setVerificationStatus('success');
        setVerificationMessage(validation.message);
        haptic.success();
        onVerified(true, validation.message);
      } else {
        setVerificationStatus('failed');
        setVerificationMessage(validation.message);
        haptic.error();
        onVerified(false, validation.message);
      }
    } catch (error: any) {
      setVerificationStatus('error');
      // code 1 = 권한 거부. 일반 메시지로는 사용자가 어떻게 복구해야
      // 할지 알 수 없으므로 OS별 활성화 절차를 안내한다.
      const denied = error?.code === 1;
      const msg = denied
        ? '위치 권한이 거부되어 있어 출석할 수 없습니다.\n\n'
          + 'iOS: 설정 > 개인정보 보호 및 보안 > 위치 서비스 > Safari/런하우스 > "사용 중인 동안" 선택\n'
          + 'Android: 브라우저 주소창 좌측 자물쇠 아이콘 > 권한 > 위치 허용\n\n'
          + '권한 활성화 후 "다시 시도"를 눌러주세요.'
        : (error?.message || '위치 확인 중 오류가 발생했습니다.');
      setVerificationMessage(msg);
      haptic.error();
      onVerified(false, msg);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleLocationCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'checking':
        return <Loader2 className="w-8 h-8 text-rh-accent animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-rh-status-success" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-rh-status-error" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-rh-status-error" />;
      default:
        return <MapPin className="w-8 h-8 text-rh-text-tertiary" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'checking':
        return 'border-rh-accent/30';
      case 'success':
        return 'border-rh-status-success/30';
      case 'failed':
      case 'error':
        return 'border-rh-status-error/30';
      default:
        return 'border-rh-border';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`mx-4 p-6 max-w-sm text-center bg-rh-bg-surface rounded-2xl border shadow-sm ${getStatusColor()}`}>
        {/* 아이콘 */}
        <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-rh-bg-muted/20 rounded-full">
          {getStatusIcon()}
        </div>

        {/* 제목 */}
        <h3 className="mb-2 text-lg font-semibold text-white">위치 확인</h3>

        {/* 메시지 */}
        <p className="mb-4 text-sm text-rh-text-secondary whitespace-pre-line">
          {verificationMessage}
        </p>

        {/* 활동장소 목록 (실패한 경우에만 표시) */}
        {verificationStatus === 'failed' && crewLocations.length > 0 && (
          <div className="mb-4 p-3 text-left bg-rh-bg-primary/50 rounded-lg">
            <SectionLabel className="mb-2">등록된 활동장소</SectionLabel>
            <div className="space-y-1">
              {crewLocations.map((location) => (
                <div key={location.id} className="flex items-center text-sm text-white">
                  <MapPin className="mr-2 w-3 h-3 text-rh-text-secondary" />
                  {location.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex space-x-3">
          {verificationStatus === 'checking' ? (
            <button
              disabled
              className="flex-1 py-3 font-medium text-rh-text-secondary rounded-lg cursor-not-allowed bg-rh-bg-muted/50"
            >
              확인 중...
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 font-medium text-rh-text-secondary rounded-lg border border-rh-border hover:bg-rh-bg-muted/20"
              >
                닫기
              </button>
              {(verificationStatus === 'failed' || verificationStatus === 'error') && (
                <button
                  onClick={handleLocationCheck}
                  className="flex-1 py-3 font-medium text-white rounded-lg bg-rh-accent hover:bg-blue-600"
                >
                  다시 시도
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationVerificationModal;