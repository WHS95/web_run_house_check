"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { validateUserLocation } from '@/lib/utils/distance';

interface LocationStatusIndicatorProps {
  isLocationBasedAttendance: boolean;
  crewLocations: Array<{
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    allowed_radius?: number;
  }>;
  selectedLocationId?: string;
  allowedRadius?: number;
  onStatusChange?: (canAttend: boolean, message: string) => void;
}

type LocationStatus = 'checking' | 'allowed' | 'out_of_range' | 'no_permission' | 'error' | 'disabled';

const LocationStatusIndicator: React.FC<LocationStatusIndicatorProps> = ({
  isLocationBasedAttendance,
  crewLocations,
  selectedLocationId,
  allowedRadius = 50,
  onStatusChange,
}) => {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('disabled');
  const [statusMessage, setStatusMessage] = useState('');
  const { getCurrentLocation, clearError } = useGeolocation();

  // onStatusChange를 ref로 저장하여 의존성 루프 방지
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // 초기 로드 여부 추적
  const hasCheckedRef = useRef(false);

  const checkLocationStatus = useCallback(async (forceRefresh = false) => {
    if (!isLocationBasedAttendance) {
      setLocationStatus('disabled');
      setStatusMessage('');
      onStatusChangeRef.current?.(true, '');
      return;
    }

    setLocationStatus('checking');
    setStatusMessage('위치 확인 중...');

    try {
      if (crewLocations.length === 0) {
        setLocationStatus('allowed');
        setStatusMessage('위치 확인됨 · GPS 기반 출석 활성');
        onStatusChangeRef.current?.(true, '활동장소가 설정되지 않아 어디서든 출석 가능합니다.');
        return;
      }

      // 선택된 장소가 있으면 해당 장소만 체크, 없으면 전체 체크
      const targetLocations = selectedLocationId
        ? crewLocations.filter(loc => loc.id === Number(selectedLocationId))
        : crewLocations;

      // 허용 반경은 크루 전역 설정(accuracy_range)을 사용한다.
      // 장소별 allowed_radius는 admin UI에 노출되지 않아 항상 DB 기본값(50)
      // 으로 남아 있어 전역 설정을 가리는 버그를 일으킨다.
      const validLocations = targetLocations
        .filter(loc => loc.latitude !== null && loc.longitude !== null)
        .map(loc => ({
          name: loc.name,
          latitude: loc.latitude!,
          longitude: loc.longitude!,
          allowedRadius,
        }));

      if (validLocations.length === 0) {
        setLocationStatus('allowed');
        setStatusMessage('위치 확인됨 · GPS 기반 출석 활성');
        onStatusChangeRef.current?.(true, '');
        return;
      }

      const userLocation = await getCurrentLocation(forceRefresh);
      const validation = validateUserLocation(userLocation, validLocations, allowedRadius);

      if (validation.isValid) {
        setLocationStatus('allowed');
        setStatusMessage('위치 확인됨 · GPS 기반 출석 활성');
        onStatusChangeRef.current?.(true, validation.message);
      } else {
        setLocationStatus('out_of_range');
        setStatusMessage(validation.message);
        onStatusChangeRef.current?.(false, validation.message);
      }
    } catch (error: any) {
      if (error.code === 1) {
        setLocationStatus('no_permission');
        setStatusMessage('위치 권한이 필요합니다');
        onStatusChangeRef.current?.(false, '위치 권한이 필요합니다.');
      } else {
        setLocationStatus('error');
        setStatusMessage(error.message || '위치 확인 실패');
        onStatusChangeRef.current?.(false, error.message || '위치 확인 실패');
      }
    }
  }, [isLocationBasedAttendance, crewLocations, selectedLocationId, allowedRadius, getCurrentLocation]);

  // 초기 1회 실행
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    checkLocationStatus();
  }, [checkLocationStatus]);

  // 선택된 장소가 변경되면 다시 체크
  const prevSelectedLocationRef = useRef(selectedLocationId);
  useEffect(() => {
    if (prevSelectedLocationRef.current === selectedLocationId) return;
    prevSelectedLocationRef.current = selectedLocationId;
    checkLocationStatus();
  }, [selectedLocationId, checkLocationStatus]);

  // 위치 비활성 시 렌더링 없음
  if (!isLocationBasedAttendance) return null;

  const getStatusColor = () => {
    switch (locationStatus) {
      case 'allowed': return 'text-[#8BB5F5]';
      case 'checking': return 'text-rh-text-secondary';
      case 'out_of_range':
      case 'error': return 'text-rh-status-error';
      case 'no_permission': return 'text-rh-status-warning';
      default: return 'text-rh-text-secondary';
    }
  };

  const color = getStatusColor();

  return (
    <div className="flex items-center gap-2 py-3">
      <MapPin className={`w-4 h-4 flex-shrink-0 ${color}`} />
      <span className={`text-xs ${color}`}>
        {statusMessage}
      </span>
      {(locationStatus === 'error' || locationStatus === 'out_of_range' || locationStatus === 'no_permission') && (
        <button
          onClick={() => {
            clearError();
            hasCheckedRef.current = false;
            checkLocationStatus(true);
          }}
          className="text-xs text-rh-text-secondary underline ml-auto"
        >
          다시 확인
        </button>
      )}
    </div>
  );
};

export default LocationStatusIndicator;
