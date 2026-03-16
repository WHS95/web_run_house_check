"use client";

import { useState } from "react";
import {
  calculateSplitTimes,
  timeToSeconds,
  validateTimeInputs,
} from "@/lib/utils/calculator";
import { useToast } from "@/components/ui/use-toast";

export default function SplitTimeCalculatorClient() {
  const { toast } = useToast();
  const [distance, setDistance] = useState<string>("");
  const [hours, setHours] = useState<string>("0");
  const [minutes, setMinutes] = useState<string>("0");
  const [seconds, setSeconds] = useState<string>("0");
  const [results, setResults] = useState<{ distance: number; time: string }[]>([]);

  const handleCalculate = () => {
    const targetDistance = parseFloat(distance);
    const targetHours = parseInt(hours || "0");
    const targetMinutes = parseInt(minutes || "0");
    const targetSeconds = parseInt(seconds || "0");

    if (!targetDistance || targetDistance <= 0) {
      toast({ description: "올바른 거리를 입력해주세요.", duration: 2000 });
      return;
    }
    if (!validateTimeInputs(targetHours, targetMinutes, targetSeconds)) {
      toast({ description: "올바른 시간을 입력해주세요.", duration: 2000 });
      return;
    }

    const totalSeconds = timeToSeconds(targetHours, targetMinutes, targetSeconds);
    const splitTimes = calculateSplitTimes(targetDistance, totalSeconds);
    setResults(splitTimes);
  };

  return (
    <div className='space-y-4'>
      {/* 입력 폼 */}
      <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-4'>
        <h3 className='text-[15px] font-semibold text-white'>목표 설정</h3>

        <div>
          <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
            목표 거리 (km)
          </label>
          <input
            type='number'
            step='0.1'
            min='0'
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder='42.195'
            className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none placeholder:text-rh-text-muted focus:ring-1 focus:ring-rh-accent'
          />
        </div>

        <div>
          <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
            목표 시간
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

        <button
          onClick={handleCalculate}
          className='w-full py-3 text-sm font-semibold text-white bg-rh-accent rounded-rh-md transition-colors active:bg-rh-accent-hover'
        >
          계산하기
        </button>
      </div>

      {/* 결과 테이블 */}
      {results.length > 0 && (
        <div className='p-4 bg-rh-bg-surface rounded-rh-lg'>
          <h3 className='text-[15px] font-semibold text-white mb-3'>스플릿 타임</h3>
          <div className='space-y-2'>
            {results.map((result, index) => {
              const isHalf = result.distance === 21.1;
              return (
                <div
                  key={result.distance}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-rh-md ${
                    isHalf
                      ? "bg-rh-accent/20 border border-rh-accent/30"
                      : "bg-rh-bg-muted"
                  }`}
                >
                  <span className={`text-sm ${isHalf ? "text-rh-accent font-semibold" : "text-rh-text-secondary"}`}>
                    {isHalf ? "하프 (21.1km)" : `${result.distance}km`}
                  </span>
                  <span className={`text-sm font-bold ${isHalf ? "text-rh-accent" : "text-white"}`}>
                    {result.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
