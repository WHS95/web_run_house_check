"use client";

import { useState } from "react";
import {
  timeToSeconds,
  validateTimeInputs,
  predictFinishTime,
  calculatePace,
} from "@/lib/utils/calculator";
import { useToast } from "@/components/ui/use-toast";

export default function PredictionCalculatorClient() {
  const { toast } = useToast();
  const [recordedDistance, setRecordedDistance] = useState<string>("");
  const [hours, setHours] = useState<string>("0");
  const [minutes, setMinutes] = useState<string>("0");
  const [seconds, setSeconds] = useState<string>("0");
  const [targetDistance, setTargetDistance] = useState<string>("");
  const [result, setResult] = useState<{
    time: string;
    pace: string;
  } | null>(null);

  const isFormValid = () => {
    const distance = parseFloat(recordedDistance);
    const targetDist = parseFloat(targetDistance);
    const inputHours = parseInt(hours || "0");
    const inputMinutes = parseInt(minutes || "0");
    const inputSeconds = parseInt(seconds || "0");
    return (
      distance > 0 && distance <= 300 &&
      targetDist > 0 && targetDist <= 300 &&
      (inputHours > 0 || inputMinutes > 0 || inputSeconds > 0)
    );
  };

  const formatTimeToHHMMSS = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCalculate = () => {
    const distance = parseFloat(recordedDistance);
    const targetDist = parseFloat(targetDistance);
    const inputHours = parseInt(hours || "0");
    const inputMinutes = parseInt(minutes || "0");
    const inputSeconds = parseInt(seconds || "0");

    if (!targetDist || targetDist <= 0 || targetDist > 300) {
      toast({ description: "목표 거리를 올바르게 입력해주세요. (1~300km)", duration: 2000 });
      return;
    }
    if (!distance || distance <= 0 || distance > 300) {
      toast({ description: "기록 거리를 올바르게 입력해주세요. (1~300km)", duration: 2000 });
      return;
    }
    if (!validateTimeInputs(inputHours, inputMinutes, inputSeconds)) {
      toast({ description: "기록 시간을 입력해주세요.", duration: 2000 });
      return;
    }

    const totalSeconds = timeToSeconds(inputHours, inputMinutes, inputSeconds);
    const predictedSeconds = predictFinishTime(distance, totalSeconds, targetDist);
    const pace = calculatePace(targetDist, predictedSeconds);
    setResult({ time: formatTimeToHHMMSS(predictedSeconds), pace });
  };

  return (
    <div className='space-y-4'>
      {/* 설명 */}
      <div className='p-4 bg-rh-bg-surface rounded-rh-lg'>
        <p className='text-xs text-rh-text-secondary leading-relaxed'>
          이전에 달린 기록을 바탕으로 다른 거리의 예상 완주 시간을 계산합니다.
          <br />
          <span className='text-rh-text-muted'>Riegel의 레이스 타임 공식 (T2 = T1 x (D2/D1)^1.06)</span>
        </p>
      </div>

      {/* 입력 폼 */}
      <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-4'>
        <h3 className='text-[15px] font-semibold text-white'>나의 기록</h3>

        <div>
          <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
            기록 거리 (km)
          </label>
          <input
            type='number'
            min='1'
            max='300'
            step='0.1'
            value={recordedDistance}
            onChange={(e) => setRecordedDistance(e.target.value)}
            placeholder='예: 10'
            className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none placeholder:text-rh-text-muted focus:ring-1 focus:ring-rh-accent'
          />
        </div>

        <div>
          <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
            기록 시간
          </label>
          <div className='flex gap-2 items-center'>
            <div className='flex-1'>
              <select
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
              >
                {Array.from({ length: 25 }, (_, i) => (
                  <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}시</option>
                ))}
              </select>
            </div>
            <span className='text-rh-text-muted'>:</span>
            <div className='flex-1'>
              <select
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}분</option>
                ))}
              </select>
            </div>
            <span className='text-rh-text-muted'>:</span>
            <div className='flex-1'>
              <select
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}초</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
            목표 거리 (km)
          </label>
          <input
            type='number'
            min='1'
            max='300'
            step='0.1'
            value={targetDistance}
            onChange={(e) => setTargetDistance(e.target.value)}
            placeholder='예: 42.195'
            className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none placeholder:text-rh-text-muted focus:ring-1 focus:ring-rh-accent'
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={!isFormValid()}
          className='w-full py-3 text-sm font-semibold text-white bg-rh-accent rounded-rh-md transition-colors active:bg-rh-accent-hover disabled:opacity-40 disabled:cursor-not-allowed'
        >
          계산하기
        </button>

        {!isFormValid() && (
          <p className='text-xs text-rh-status-error'>
            기록 거리, 목표 거리, 기록 시간을 모두 입력해주세요.
          </p>
        )}
      </div>

      {/* 결과 */}
      {result && (
        <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-3'>
          <h3 className='text-[15px] font-semibold text-white'>
            {targetDistance}km 예상 완주
          </h3>
          <div className='flex items-center justify-between px-4 py-3 bg-rh-bg-muted rounded-rh-md'>
            <span className='text-sm text-rh-text-secondary'>예상 시간</span>
            <span className='text-base font-bold text-rh-accent'>{result.time}</span>
          </div>
          <div className='flex items-center justify-between px-4 py-3 bg-rh-bg-muted rounded-rh-md'>
            <span className='text-sm text-rh-text-secondary'>평균 페이스</span>
            <span className='text-base font-bold text-rh-accent'>{result.pace}</span>
          </div>
        </div>
      )}
    </div>
  );
}
