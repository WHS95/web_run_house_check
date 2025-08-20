"use client";

import { useState } from "react";
import { FormLayout } from "@/components/layout/FormLayout";
import {
  timeToSeconds,
  secondsToTimeString,
  validateTimeInputs,
  predictFinishTime,
  calculatePace,
} from "@/lib/utils/calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useToast } from "@/components/ui/use-toast";

export default function PredictionCalculatorPage() {
  const { toast } = useToast();
  const [recordedDistance, setRecordedDistance] = useState<string>("");
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [seconds, setSeconds] = useState<string>("");
  const [targetDistance, setTargetDistance] = useState<string>("");
  const [result, setResult] = useState<{
    time: string;
    pace: string;
  } | null>(null);

  // 계산하기 버튼 활성화 조건 검사
  const isFormValid = () => {
    const distance = parseFloat(recordedDistance);
    const targetDist = parseFloat(targetDistance);
    const inputHours = parseInt(hours || "0");
    const inputMinutes = parseInt(minutes || "0");
    const inputSeconds = parseInt(seconds || "0");

    const hasValidDistance = distance && distance > 0 && distance <= 300;
    const hasValidTargetDistance =
      targetDist && targetDist > 0 && targetDist <= 300;
    const hasValidTime = inputHours > 0 || inputMinutes > 0 || inputSeconds > 0;

    return hasValidDistance && hasValidTargetDistance && hasValidTime;
  };

  const handleCalculate = () => {
    // 입력값 검증
    const distance = parseFloat(recordedDistance);
    const targetDist = parseFloat(targetDistance);
    const inputHours = parseInt(hours || "0");
    const inputMinutes = parseInt(minutes || "0");
    const inputSeconds = parseInt(seconds || "0");

    if (!targetDist || targetDist <= 0 || targetDist > 300) {
      toast({
        description: "목표 거리를 올바르게 입력해주세요. (1km ~ 300km)",
        duration: 2000,
      });
      return;
    }

    if (!distance || distance <= 0 || distance > 300) {
      toast({
        description: "기록한 거리를 올바르게 입력해주세요. (1km ~ 300km)",
        duration: 2000,
      });
      return;
    }

    if (!validateTimeInputs(inputHours, inputMinutes, inputSeconds)) {
      toast({
        description: "기록 시간을 입력해주세요. (시/분/초 중 하나 이상 필요)",
        duration: 2000,
      });
      return;
    }

    // 계산
    const totalSeconds = timeToSeconds(inputHours, inputMinutes, inputSeconds);
    const predictedSeconds = predictFinishTime(
      distance,
      totalSeconds,
      targetDist
    );
    const pace = calculatePace(targetDist, predictedSeconds);

    setResult({
      time: secondsToTimeString(predictedSeconds),
      pace: pace,
    });
  };

  return (
    <FormLayout title='완주 시간 예측기'>
      <div className='space-y-6'>
        {/* 설명 */}
        <div className='p-4 text-sm rounded-lg bg-accent/50'>
          <p className='text-white text-muted-foreground'>
            이전에 달린 나의 기록을 바탕으로
            <br />
            다른 거리의 예상 완주 시간을 계산합니다.
            <br />
            Riegel의 레이스 타임 공식을 사용
          </p>
        </div>

        {/* 입력 폼 */}
        <div className='space-y-4 text-white'>
          {/* 기록한 거리 입력 */}
          <div>
            <label className='block mb-2 text-sm font-medium'>
              나의 기록 거리 (km)
            </label>
            <Input
              type='number'
              min='1'
              max='300'
              step='1'
              value={recordedDistance}
              onChange={(e) => setRecordedDistance(e.target.value)}
              placeholder='예: 10.5'
              className='text-white bg-basic-black-gray border-basic-gray'
            />
            {/* <p className='mt-1 text-xs text-gray-400'>
              1km ~ 300km 사이의 거리를 입력하세요
            </p> */}
          </div>

          {/* 기록 시간 입력 */}
          <div>
            <label className='block mb-2 text-sm font-medium'>
              나의 기록 시간
            </label>
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

          {/* 목표 거리 입력 */}
          <div>
            <label className='block mb-2 text-sm font-medium text-white'>
              목표 거리 (km)
            </label>
            <Input
              type='number'
              min='1'
              max='300'
              step='1'
              value={targetDistance}
              onChange={(e) => setTargetDistance(e.target.value)}
              placeholder='예: 21.1'
              className='text-white bg-basic-black-gray border-basic-gray'
            />
            {/* <p className='mt-1 text-xs text-gray-400'>
              목표 거리를 입력하세요
            </p> */}
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!isFormValid()}
            className='w-full text-white bg-basic-blue hover:bg-basic-blue/80 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            계산하기
          </Button>

          {/* 필수 입력 안내 */}
          {!isFormValid() && (
            <div className='p-3 text-sm rounded-lg border bg-red-500/10 border-red-500/20'>
              <p className='text-red-400'>
                기록 거리, 목표 거리, 기록 시간을 모두 입력해주세요.
              </p>
            </div>
          )}
        </div>

        {/* 결과 */}
        {result && (
          <div className='mt-6 text-white'>
            <div className='flex gap-2 items-center mb-4'>
              <h2 className='text-lg font-medium'>
                {targetDistance}km 예상 완주 시간
              </h2>
              <div className='relative group'>
                <div className='cursor-help text-muted-foreground'>ⓘ</div>
                <div className='absolute bottom-full mb-2 p-3 text-sm bg-popover text-popover-foreground rounded-lg shadow-lg invisible group-hover:visible w-[280px] left-1/2 -translate-x-1/2'>
                  <p>Riegel의 레이스 타임 공식을 사용</p>
                  <p className='mt-1 font-mono text-xs'>
                    T2 = T1 × (D2/D1)^1.06
                  </p>
                  <p className='mt-2 text-xs text-muted-foreground'>
                    T1: 기록한 시간, D1: 기록한 거리
                    <br />
                    T2: 예상 시간, D2: 목표 거리
                  </p>
                </div>
              </div>
            </div>
            <div className='overflow-hidden rounded-lg border'>
              <table className='w-full'>
                <tbody className='divide-y'>
                  <tr>
                    <td className='px-4 py-3 font-medium text-white'>
                      예상 시간
                    </td>
                    <td className='px-4 py-3'>{result.time}</td>
                  </tr>
                  <tr>
                    <td className='px-4 py-3 font-medium text-white'>
                      평균 페이스
                    </td>
                    <td className='px-4 py-3'>{result.pace}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </FormLayout>
  );
}
