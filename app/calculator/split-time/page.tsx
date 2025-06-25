"use client";

import { useState } from "react";
import { FormLayout } from "@/components/layout/FormLayout";
import {
  calculateSplitTimes,
  timeToSeconds,
  validateTimeInputs,
} from "@/lib/utils/calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function SplitTimeCalculatorPage() {
  const { toast } = useToast();
  const [distance, setDistance] = useState<string>("");
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [seconds, setSeconds] = useState<string>("");
  const [results, setResults] = useState<{ distance: number; time: string }[]>(
    []
  );

  const handleCalculate = () => {
    // 입력값 검증
    const targetDistance = parseFloat(distance);
    const targetHours = parseInt(hours || "0");
    const targetMinutes = parseInt(minutes || "0");
    const targetSeconds = parseInt(seconds || "0");

    if (!targetDistance || targetDistance <= 0) {
      toast({
        description: "올바른 거리를 입력해주세요.",
        duration: 2000,
      });
      return;
    }

    if (!validateTimeInputs(targetHours, targetMinutes, targetSeconds)) {
      toast({
        description: "올바른 시간을 입력해주세요.",
        duration: 2000,
      });
      return;
    }

    // 계산
    const totalSeconds = timeToSeconds(
      targetHours,
      targetMinutes,
      targetSeconds
    );
    const splitTimes = calculateSplitTimes(targetDistance, totalSeconds);
    setResults(splitTimes);
  };

  return (
    <FormLayout title='스플릿 타임 계산기'>
      <div className='space-y-6'>
        {/* 입력 폼 */}
        <div className='space-y-4 text-white'>
          <div>
            <label className='block mb-2 text-sm font-bold'>
              목표 거리 (km)
            </label>
            <Input
              type='number'
              step='0.1'
              min='0'
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder='42.195'
            />
          </div>

          <div className='text-white'>
            <label className='block mb-2 text-sm font-bold'>목표 시간</label>
            <div className='flex relative gap-1 items-center'>
              <div className='flex-1'>
                <Input
                  type='number'
                  min='0'
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder='0'
                  className='text-center'
                />
                <span className='block mt-1 text-xs text-center text-muted-foreground'>
                  시
                </span>
              </div>
              <span className='text-xl text-muted-foreground'>:</span>
              <div className='flex-1'>
                <Input
                  type='number'
                  min='0'
                  max='59'
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder='0'
                  className='text-center'
                />
                <span className='block mt-1 text-xs text-center text-muted-foreground'>
                  분
                </span>
              </div>
              <span className='text-xl text-muted-foreground'>:</span>
              <div className='flex-1'>
                <Input
                  type='number'
                  min='0'
                  max='59'
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  placeholder='0'
                  className='text-center'
                />
                <span className='block mt-1 text-xs text-center text-muted-foreground'>
                  초
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            className='w-full text-white bg-basic-blue hover:bg-basic-blue/80'
          >
            계산하기
          </Button>
        </div>

        {/* 결과 테이블 */}
        {results.length > 0 && (
          <div className='mt-6 text-white'>
            {/* <h2 className='mb-4 text-lg font-medium'>예상 구간 기록</h2> */}
            <div className='overflow-hidden rounded-lg border'>
              <table className='w-full'>
                <thead className='text-black bg-muted'>
                  <tr>
                    <th className='px-2 py-2 text-left'>거리</th>
                    <th className='px-2 py-2 text-left'>예상 시간</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {results.map((result) => (
                    <tr key={result.distance}>
                      <td className='px-2 py-2'>
                        {result.distance === 21.1
                          ? "하프 (21.1km)"
                          : `${result.distance}km`}
                      </td>
                      <td className='px-2 py-2'>{result.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </FormLayout>
  );
}
