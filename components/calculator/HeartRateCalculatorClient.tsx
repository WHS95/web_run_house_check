"use client";

import { useState } from "react";
import {
  calculateMaxHeartRate,
  calculateHeartRateZones,
  type HeartRateZone,
} from "@/lib/utils/calculator";
import { useToast } from "@/components/ui/use-toast";

const zoneColors: Record<number, { bg: string; accent: string }> = {
  1: { bg: "bg-blue-500/15", accent: "text-blue-400" },
  2: { bg: "bg-green-500/15", accent: "text-green-400" },
  3: { bg: "bg-yellow-500/15", accent: "text-yellow-400" },
  4: { bg: "bg-orange-500/15", accent: "text-orange-400" },
  5: { bg: "bg-red-500/15", accent: "text-red-400" },
};

export default function HeartRateCalculatorClient() {
  const { toast } = useToast();
  const [age, setAge] = useState<string>("");
  const [results, setResults] = useState<HeartRateZone[]>([]);
  const [maxHR, setMaxHR] = useState<number | null>(null);

  const handleCalculate = () => {
    const ageNum = parseInt(age);
    if (!ageNum || ageNum <= 0 || ageNum > 120) {
      toast({ description: "올바른 나이를 입력해주세요 (1-120).", duration: 2000 });
      return;
    }
    const calculatedMaxHR = calculateMaxHeartRate(ageNum);
    const zones = calculateHeartRateZones(ageNum);
    setMaxHR(calculatedMaxHR);
    setResults(zones);
  };

  return (
    <div className='space-y-4'>
      {/* 입력 폼 */}
      <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-4'>
        <h3 className='text-[15px] font-semibold text-white'>기본 정보</h3>
        <div>
          <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
            나이 (세)
          </label>
          <input
            type='number'
            min='1'
            max='120'
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder='30'
            className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none placeholder:text-rh-text-muted focus:ring-1 focus:ring-rh-accent'
          />
          <p className='mt-1.5 text-[11px] text-rh-text-muted'>
            최대 심박수 = 220 - 나이
          </p>
        </div>

        <button
          onClick={handleCalculate}
          className='w-full py-3 text-sm font-semibold text-white bg-rh-accent rounded-rh-md transition-colors active:bg-rh-accent-hover'
        >
          계산하기
        </button>
      </div>

      {/* 결과 */}
      {results.length > 0 && maxHR && (
        <>
          {/* 최대 심박수 카드 */}
          <div className='p-4 bg-rh-bg-surface rounded-rh-lg'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-rh-text-secondary'>예상 최대 심박수</span>
              <span className='text-xl font-bold text-rh-accent'>
                {maxHR} <span className='text-xs font-normal text-rh-text-muted'>bpm</span>
              </span>
            </div>
          </div>

          {/* 존 목록 */}
          <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-2'>
            <h3 className='text-[15px] font-semibold text-white mb-3'>트레이닝 존</h3>
            {results.map((zone) => {
              const colors = zoneColors[zone.zone] || { bg: "bg-rh-bg-muted", accent: "text-white" };
              return (
                <div
                  key={zone.zone}
                  className={`p-3 rounded-rh-md ${colors.bg}`}
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex items-center justify-center w-7 h-7 text-xs font-bold text-white bg-white/10 rounded-full'>
                      {zone.zone}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-semibold text-white'>{zone.name}</span>
                        <span className={`text-sm font-mono font-bold ${colors.accent}`}>
                          {zone.min}-{zone.max}
                          <span className='ml-1 text-[10px] font-normal text-rh-text-muted'>bpm</span>
                        </span>
                      </div>
                      <p className='mt-0.5 text-[11px] text-rh-text-tertiary'>{zone.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
