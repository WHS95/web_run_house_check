// 시간 관련 유틸리티
export function timeToSeconds(
  hours: number,
  minutes: number,
  seconds: number
): number {
  return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToTimeString(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

export function validateTimeInputs(
  hours: number,
  minutes: number,
  seconds: number
): boolean {
  return (
    hours >= 0 &&
    minutes >= 0 &&
    minutes < 60 &&
    seconds >= 0 &&
    seconds < 60 &&
    hours + minutes + seconds > 0
  );
}

// 페이스 계산 관련
export function calculatePacePerKm(
  distance: number,
  totalSeconds: number
): string {
  const paceSeconds = totalSeconds / distance;
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function calculatePace(distance: number, totalSeconds: number): string {
  const paceSeconds = totalSeconds / distance;
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

// 완주 시간 예측 (Riegel 공식 사용)
export function predictFinishTime(
  recordedDistance: number,
  recordedSeconds: number,
  targetDistance: number
): number {
  // Riegel 공식: T2 = T1 * (D2/D1)^1.06
  const ratio = Math.pow(targetDistance / recordedDistance, 1.06);
  return recordedSeconds * ratio;
}

// 심박수 관련
export function calculateMaxHeartRate(age: number): number {
  return 220 - age;
}

export interface HeartRateZone {
  zone: number;
  name: string;
  min: number;
  max: number;
  percentage: string;
  description: string;
}

export function calculateHeartRateZones(age: number): HeartRateZone[] {
  const maxHR = calculateMaxHeartRate(age);

  return [
    {
      zone: 1,
      name: "활성 회복",
      min: Math.round(maxHR * 0.5),
      max: Math.round(maxHR * 0.6),
      percentage: "50-60%",
      description: "매우 가벼운 운동, 워밍업과 쿨다운에 적합",
    },
    {
      zone: 2,
      name: "유산소 기초",
      min: Math.round(maxHR * 0.6),
      max: Math.round(maxHR * 0.7),
      percentage: "60-70%",
      description: "지방 연소에 효과적, 대화하면서 달릴 수 있는 강도",
    },
    {
      zone: 3,
      name: "유산소 능력",
      min: Math.round(maxHR * 0.7),
      max: Math.round(maxHR * 0.8),
      percentage: "70-80%",
      description: "심폐 기능 향상, 중간 강도 운동",
    },
    {
      zone: 4,
      name: "젖산 역치",
      min: Math.round(maxHR * 0.8),
      max: Math.round(maxHR * 0.9),
      percentage: "80-90%",
      description: "고강도 운동, 스피드와 파워 향상",
    },
    {
      zone: 5,
      name: "최대 강도",
      min: Math.round(maxHR * 0.9),
      max: maxHR,
      percentage: "90-100%",
      description: "최대 강도, 매우 짧은 시간만 유지 가능",
    },
  ];
}

// 스플릿 타임 계산
export function calculateSplitTimes(
  targetDistance: number,
  totalSeconds: number
): { distance: number; time: string }[] {
  const pacePerKm = totalSeconds / targetDistance;
  const splits = [];

  // 일반적인 중간 지점들
  const splitDistances = [5, 10, 15, 20, 21.1]; // 21.1km = 하프마라톤

  for (const distance of splitDistances) {
    if (distance < targetDistance) {
      const splitSeconds = pacePerKm * distance;
      splits.push({
        distance,
        time: secondsToTimeString(splitSeconds),
      });
    }
  }

  return splits;
}

// 일반적인 거리 상수
export const COMMON_DISTANCES = [
  { label: "1km", value: 1 },
  { label: "3km", value: 3 },
  { label: "5km", value: 5 },
  { label: "10km", value: 10 },
  { label: "15km", value: 15 },
  { label: "하프마라톤 (21.1km)", value: 21.1 },
  { label: "25km", value: 25 },
  { label: "30km", value: 30 },
  { label: "풀마라톤 (42.195km)", value: 42.195 },
] as const;
