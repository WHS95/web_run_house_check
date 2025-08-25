/**
 * 두 GPS 좌표 간의 거리를 계산하는 유틸리티 함수들
 * Haversine 공식을 사용하여 지구 곡률을 고려한 정확한 거리 계산
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * 두 좌표 간의 거리를 미터 단위로 계산 (Haversine 공식)
 * @param coord1 첫 번째 좌표 (위도, 경도)
 * @param coord2 두 번째 좌표 (위도, 경도)
 * @returns 거리 (미터)
 */
export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371000; // 지구 반지름 (미터)
  
  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);
  const deltaLatRad = toRadians(coord2.latitude - coord1.latitude);
  const deltaLonRad = toRadians(coord2.longitude - coord1.longitude);

  const a = 
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * 도 단위를 라디안으로 변환
 * @param degrees 도 단위 각도
 * @returns 라디안 단위 각도
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * 사용자 위치가 허용 반경 내에 있는지 확인
 * @param userLocation 사용자 현재 위치
 * @param targetLocation 대상 위치 (활동장소)
 * @param allowedRadius 허용 반경 (미터, 기본값: 50m)
 * @returns 허용 범위 내 여부
 */
export const isWithinAllowedRadius = (
  userLocation: Coordinates,
  targetLocation: Coordinates,
  allowedRadius: number = 50
): boolean => {
  const distance = calculateDistance(userLocation, targetLocation);
  return distance <= allowedRadius;
};

/**
 * 거리를 사람이 읽기 쉬운 형태로 포맷
 * @param meters 거리 (미터)
 * @returns 포맷된 거리 문자열
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

/**
 * 여러 활동장소 중 가장 가까운 곳을 찾기
 * @param userLocation 사용자 현재 위치
 * @param locations 활동장소 목록
 * @returns 가장 가까운 장소의 인덱스와 거리
 */
export const findClosestLocation = (
  userLocation: Coordinates,
  locations: Coordinates[]
): { index: number; distance: number } | null => {
  if (locations.length === 0) return null;

  let closestIndex = 0;
  let closestDistance = calculateDistance(userLocation, locations[0]);

  for (let i = 1; i < locations.length; i++) {
    const distance = calculateDistance(userLocation, locations[i]);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return { index: closestIndex, distance: closestDistance };
};

/**
 * 사용자가 활동장소 근처에 있는지 확인하고 상세 정보 반환
 * @param userLocation 사용자 현재 위치
 * @param activityLocations 활동장소 목록
 * @param allowedRadius 허용 반경 (미터)
 * @returns 위치 검증 결과
 */
export interface LocationValidationResult {
  isValid: boolean;
  closestLocation?: {
    index: number;
    name?: string;
    distance: number;
    isWithinRadius: boolean;
  };
  message: string;
}

export const validateUserLocation = (
  userLocation: Coordinates,
  activityLocations: (Coordinates & { name?: string })[],
  allowedRadius: number = 50
): LocationValidationResult => {
  if (activityLocations.length === 0) {
    return {
      isValid: true, // 활동장소가 설정되지 않은 경우 허용
      message: '활동장소가 설정되지 않아 어디서든 출석 가능합니다.',
    };
  }

  const closest = findClosestLocation(userLocation, activityLocations);
  
  if (!closest) {
    return {
      isValid: false,
      message: '활동장소를 확인할 수 없습니다.',
    };
  }

  const closestLocation = activityLocations[closest.index];
  const isWithinRadius = closest.distance <= allowedRadius;

  return {
    isValid: isWithinRadius,
    closestLocation: {
      index: closest.index,
      name: closestLocation.name,
      distance: closest.distance,
      isWithinRadius,
    },
    message: isWithinRadius
      ? `${closestLocation.name || '활동장소'}에서 출석 가능합니다. (${formatDistance(closest.distance)})`
      : `가장 가까운 ${closestLocation.name || '활동장소'}까지 ${formatDistance(closest.distance)}입니다. ${allowedRadius}m 이내로 이동해주세요.`,
  };
};