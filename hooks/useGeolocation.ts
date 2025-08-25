import { useState, useEffect, useCallback } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationResult {
  location: GeolocationCoordinates | null;
  error: GeolocationError | null;
  loading: boolean;
  getCurrentLocation: () => Promise<GeolocationCoordinates>;
  clearError: () => void;
}

const GEOLOCATION_ERRORS = {
  1: 'GPS 위치 서비스에 대한 권한이 거부되었습니다.',
  2: '위치를 확인할 수 없습니다. 네트워크 연결을 확인해주세요.',
  3: '위치 확인 요청이 시간 초과되었습니다.',
  default: '위치 확인 중 오류가 발생했습니다.',
};

export const useGeolocation = (options?: PositionOptions): UseGeolocationResult => {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // 5분
    ...options,
  };

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    setLocation({ latitude, longitude, accuracy });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    const errorMessage = GEOLOCATION_ERRORS[error.code as keyof typeof GEOLOCATION_ERRORS] 
      || GEOLOCATION_ERRORS.default;
    
    setError({
      code: error.code,
      message: errorMessage,
    });
    setLocation(null);
    setLoading(false);
  }, []);

  const getCurrentLocation = useCallback((): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = {
          code: 0,
          message: '이 브라우저는 GPS 위치 서비스를 지원하지 않습니다.',
        };
        setError(error);
        reject(error);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const coordinates = { latitude, longitude, accuracy };
          handleSuccess(position);
          resolve(coordinates);
        },
        (error) => {
          handleError(error);
          reject({
            code: error.code,
            message: GEOLOCATION_ERRORS[error.code as keyof typeof GEOLOCATION_ERRORS] 
              || GEOLOCATION_ERRORS.default,
          });
        },
        defaultOptions
      );
    });
  }, [defaultOptions, handleSuccess, handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 컴포넌트 마운트 시 자동으로 위치 확인하지 않음 (명시적 호출만)
  useEffect(() => {
    // 자동 위치 확인이 필요한 경우 여기에 구현
  }, []);

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    clearError,
  };
};

export default useGeolocation;