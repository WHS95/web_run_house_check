"use client";

import { useState } from "react";
import {
  calculateMaxHeartRate,
  calculateHeartRateZones,
  type HeartRateZone,
} from "@/lib/utils/calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// 존별 색상을 함수로 정의하여 정적 클래스 사용
const getZoneColor = (zone: number) => {
  switch (zone) {
    case 1:
      return "bg-gradient-to-r from-blue-500/20 to-blue-500/30 hover:from-blue-500/30 hover:to-blue-500/40 border border-blue-500/30";
    case 2:
      return "bg-gradient-to-r from-green-500/20 to-green-500/30 hover:from-green-500/30 hover:to-green-500/40 border border-green-500/30";
    case 3:
      return "bg-gradient-to-r from-yellow-500/20 to-yellow-500/30 hover:from-yellow-500/30 hover:to-yellow-500/40 border border-yellow-500/30";
    case 4:
      return "bg-gradient-to-r from-orange-500/20 to-orange-500/30 hover:from-orange-500/30 hover:to-orange-500/40 border border-orange-500/30";
    case 5:
      return "bg-gradient-to-r from-red-500/20 to-red-500/30 hover:from-red-500/30 hover:to-red-500/40 border border-red-500/30";
    default:
      return "bg-gradient-to-r from-gray-500/20 to-gray-500/30 hover:from-gray-500/30 hover:to-gray-500/40 border border-gray-500/30";
  }
};

export default function HeartRateCalculatorClient() {
  const { toast } = useToast();
  const [age, setAge] = useState<string>("");
  const [results, setResults] = useState<HeartRateZone[]>([]);
  const [maxHR, setMaxHR] = useState<number | null>(null);

  const handleCalculate = () => {
    const ageNum = parseInt(age);
    if (!ageNum || ageNum <= 0 || ageNum > 120) {
      toast({
        description: "올바른 나이를 입력해주세요 (1-120).",
        duration: 2000,
      });
      return;
    }

    const calculatedMaxHR = calculateMaxHeartRate(ageNum);
    const zones = calculateHeartRateZones(ageNum);

    setMaxHR(calculatedMaxHR);
    setResults(zones);
  };

  return (
    <div className='mx-auto space-y-6 max-w-md'>
      {/* 입력 폼 */}
      <div className='space-y-4 text-white'>
        <div>
          <label className='block mb-2 text-sm font-bold text-white'>
            나이
            <span className='ml-1 text-gray-400'>(세)</span>
          </label>
          <Input
            type='number'
            min='1'
            max='120'
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder='30'
            className='placeholder-gray-400 text-white bg-gray-800 border-gray-600'
          />
        </div>

        <Button
          onClick={handleCalculate}
          className='w-full text-white bg-basic-blue hover:bg-basic-blue/80'
        >
          계산하기
        </Button>
      </div>

      {/* 결과 */}
      {results.length > 0 && maxHR && (
        <div className='mt-6 text-white'>
          <div className='flex gap-2 items-center mb-4'>
            <h2 className='text-lg font-medium'>트레이닝 존</h2>
            <div className='relative group'>
              <div className='text-gray-400 cursor-help'>ⓘ</div>
              <div className='absolute bottom-full mb-2 p-3 text-sm bg-gray-800 text-white rounded-lg shadow-lg invisible group-hover:visible w-[280px] left-1/2 -translate-x-1/2 border border-gray-600'>
                <p>최대 심박수 계산 공식:</p>
                <p className='mt-1 font-mono text-xs'>220 - 나이</p>
                <p className='mt-2 text-xs text-gray-400'>
                  각 존은 최대 심박수의 비율로 계산됩니다.
                  <br />
                  이는 일반적인 추정치이며, 개인차가 있을 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className='p-3 mb-4 bg-gradient-to-r rounded-lg border from-blue-600/20 to-blue-600/30 border-blue-600/30'>
            <div className='font-medium'>예상 최대 심박수</div>
            <div className='mt-1 text-2xl'>
              {maxHR} <span className='text-sm text-gray-400'>bpm</span>
            </div>
          </div>

          <div className='grid gap-2'>
            {results.map((zone) => (
              <div
                key={zone.zone}
                className={cn(
                  "relative p-3 rounded-lg transition-all duration-200 group/zone",
                  getZoneColor(zone.zone)
                )}
              >
                <div className='flex gap-3 items-center'>
                  <div className='flex justify-center items-center w-6 h-6 text-sm font-medium text-white rounded-full bg-white/10'>
                    {zone.zone}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between items-center'>
                      <div className='font-medium text-white'>
                        {zone.name}
                      </div>
                      <div className='text-sm font-mono text-white'>
                        {zone.min}-{zone.max}
                        <span className='ml-1 text-gray-400'>bpm</span>
                      </div>
                    </div>
                    <p className='mt-0.5 text-xs text-gray-300 line-clamp-1 group-hover/zone:line-clamp-none'>
                      {zone.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}