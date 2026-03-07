"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, CheckCircle, AlertCircle, XCircle, RefreshCw, Shield } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { validateUserLocation } from '@/lib/utils/distance';
import { haptic } from '@/lib/haptic';

interface LocationStatusIndicatorProps {
  isLocationBasedAttendance: boolean;
  crewLocations: Array<{
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    allowed_radius?: number;
  }>;
  allowedRadius?: number;
  onStatusChange?: (canAttend: boolean, message: string) => void;
}

type LocationStatus = 'checking' | 'allowed' | 'denied' | 'out_of_range' | 'no_permission' | 'error' | 'disabled';

const LocationStatusIndicator: React.FC<LocationStatusIndicatorProps> = ({
  isLocationBasedAttendance,
  crewLocations,
  allowedRadius = 50,
  onStatusChange,
}) => {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('disabled');
  const [statusMessage, setStatusMessage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [isChecking, setIsChecking] = useState(false);
  
  const { getCurrentLocation, loading, error, clearError } = useGeolocation();

  // 위치 권한 상태 확인
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermissionStatus('denied');
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state);
      return permission.state === 'granted';
    } catch {
      // 권한 API를 지원하지 않는 브라우저에서는 실제 위치 요청으로 확인
      try {
        await getCurrentLocation();
        setPermissionStatus('granted');
        return true;
      } catch {
        setPermissionStatus('denied');
        return false;
      }
    }
  }, [getCurrentLocation]);

  // 위치 상태 확인
  const checkLocationStatus = useCallback(async () => {
    if (!isLocationBasedAttendance) {
      setLocationStatus('disabled');
      setStatusMessage('위치 기반 출석이 비활성화되어 있습니다.');
      onStatusChange?.(true, '어디서든 출석 가능합니다.');
      return;
    }

    setIsChecking(true);
    setLocationStatus('checking');
    setStatusMessage('위치 정보 확인 중...');

    try {
      // 1. 위치 권한 확인
      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        setLocationStatus('no_permission');
        setStatusMessage('위치 권한이 필요합니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
        onStatusChange?.(false, '위치 권한이 필요합니다.');
        return;
      }

      // 2. 활동장소 설정 확인
      if (crewLocations.length === 0) {
        setLocationStatus('allowed');
        setStatusMessage('활동장소가 설정되지 않아 어디서든 출석 가능합니다.');
        onStatusChange?.(true, '활동장소가 설정되지 않아 어디서든 출석 가능합니다.');
        return;
      }

      // 유효한 활동장소 필터링
      const validLocations = crewLocations
        .filter(loc => loc.latitude !== null && loc.longitude !== null)
        .map(loc => ({
          name: loc.name,
          latitude: loc.latitude!,
          longitude: loc.longitude!,
          allowedRadius: loc.allowed_radius || allowedRadius,
        }));

      if (validLocations.length === 0) {
        setLocationStatus('allowed');
        setStatusMessage('GPS 좌표가 설정된 활동장소가 없어 어디서든 출석 가능합니다.');
        onStatusChange?.(true, 'GPS 좌표가 설정된 활동장소가 없어 어디서든 출석 가능합니다.');
        return;
      }

      // 3. 현재 위치 확인
      const userLocation = await getCurrentLocation();
      
      // 4. 위치 검증
      const validation = validateUserLocation(
        userLocation,
        validLocations,
        allowedRadius
      );

      if (validation.isValid) {
        setLocationStatus('allowed');
        setStatusMessage(validation.message);
        onStatusChange?.(true, validation.message);
        haptic.light();
      } else {
        setLocationStatus('out_of_range');
        setStatusMessage(validation.message);
        onStatusChange?.(false, validation.message);
      }
    } catch (error: any) {
      setLocationStatus('error');
      setStatusMessage(error.message || '위치 확인 중 오류가 발생했습니다.');
      onStatusChange?.(false, error.message || '위치 확인 중 오류가 발생했습니다.');
    } finally {
      setIsChecking(false);
    }
  }, [isLocationBasedAttendance, crewLocations, allowedRadius, getCurrentLocation, checkLocationPermission, onStatusChange]);

  // 페이지 로드 시 위치 상태 확인
  useEffect(() => {
    checkLocationStatus();
  }, [checkLocationStatus]);

  // 권한 상태 변경 감지
  useEffect(() => {
    if (!navigator.permissions) return;

    let permissionWatcher: PermissionStatus;

    const watchPermission = async () => {
      try {
        permissionWatcher = await navigator.permissions.query({ name: 'geolocation' });
        permissionWatcher.addEventListener('change', () => {
          setPermissionStatus(permissionWatcher.state);
          // 권한 상태가 변경되면 다시 체크
          setTimeout(checkLocationStatus, 500);
        });
      } catch {
        // 권한 API를 지원하지 않는 경우 무시
      }
    };

    watchPermission();

    return () => {
      if (permissionWatcher) {
        permissionWatcher.removeEventListener('change', checkLocationStatus);
      }
    };
  }, [checkLocationStatus]);

  const getStatusConfig = () => {
    switch (locationStatus) {
      case 'disabled':
        return {
          icon: Shield,
          color: 'text-rh-text-secondary',
          bgColor: 'bg-rh-bg-muted/10',
          borderColor: 'border-rh-border/30',
          title: '일반 출석',
        };
      case 'checking':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          title: '위치 확인 중',
          animate: 'animate-spin',
        };
      case 'allowed':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          title: '출석 가능',
        };
      case 'no_permission':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          title: '위치 권한 필요',
        };
      case 'out_of_range':
        return {
          icon: MapPin,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          title: '활동장소 밖',
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          title: '위치 확인 오류',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-rh-text-secondary',
          bgColor: 'bg-rh-bg-muted/10',
          borderColor: 'border-rh-border/30',
          title: '상태 확인',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handleRefresh = async () => {
    haptic.light();
    clearError();
    await checkLocationStatus();
  };

  const handleRequestPermission = async () => {
    haptic.medium();
    try {
      await getCurrentLocation();
      // 권한이 승인되면 자동으로 상태가 업데이트됨
    } catch (error) {
      // 사용자가 권한을 거부했거나 오류 발생
      haptic.error();
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon className={`w-5 h-5 ${config.color} ${config.animate || ''}`} />
          </div>
          <div>
            <h3 className={`font-medium ${config.color}`}>
              {config.title}
            </h3>
            <p className="mt-1 text-sm text-rh-text-secondary">
              {statusMessage}
            </p>
            
            {/* 권한 상태 상세 정보 */}
            {isLocationBasedAttendance && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-xs text-rh-text-secondary">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    permissionStatus === 'granted' ? 'bg-green-500' :
                    permissionStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  위치 권한: {
                    permissionStatus === 'granted' ? '허용됨' :
                    permissionStatus === 'denied' ? '거부됨' : '확인 중'
                  }
                </div>
                {crewLocations.length > 0 && (
                  <div className="flex items-center text-xs text-rh-text-secondary">
                    <MapPin className="w-3 h-3 mr-1" />
                    등록된 활동장소: {crewLocations.length}개
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center space-x-2">
          {(locationStatus === 'error' || locationStatus === 'out_of_range') && (
            <button
              onClick={handleRefresh}
              disabled={isChecking}
              className="p-2 text-rh-text-secondary hover:text-white rounded-lg hover:bg-rh-bg-muted/20 disabled:opacity-50"
              title="다시 확인"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {locationStatus === 'no_permission' && (
            <button
              onClick={handleRequestPermission}
              disabled={isChecking}
              className="px-3 py-1 text-xs font-medium text-white bg-rh-accent rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              권한 허용
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationStatusIndicator;