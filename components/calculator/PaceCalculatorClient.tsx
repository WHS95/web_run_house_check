"use client";

import { useState } from "react";
import {
  timeToSeconds,
  validateTimeInputs,
  calculatePacePerKm,
} from "@/lib/utils/calculator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type CalculatorMode = "pace" | "distance" | "time";

export default function PaceCalculatorClient() {
  const { toast } = useToast();
  const [mode, setMode] = useState<CalculatorMode>("pace");
  const [distance, setDistance] = useState<string>("10");
  const [hours, setHours] = useState<string>("1");
  const [minutes, setMinutes] = useState<string>("30");
  const [seconds, setSeconds] = useState<string>("0");
  const [paceMinutes, setPaceMinutes] = useState<string>("5");
  const [paceSeconds, setPaceSeconds] = useState<string>("0");
  const [results, setResults] = useState<{
    pace?: string;
    distance?: string;
    time?: string;
    speed?: string;
  } | null>(null);

  const handleCalculate = () => {
    const targetHours = parseInt(hours || "0");
    const targetMinutes = parseInt(minutes || "0");
    const targetSeconds = parseInt(seconds || "0");
    const targetPaceMinutes = parseInt(paceMinutes || "0");
    const targetPaceSeconds = parseInt(paceSeconds || "0");
    const targetDistance = parseFloat(distance);

    if (mode === "pace") {
      if (!targetDistance || targetDistance <= 0) {
        toast({ description: "올바른 거리를 입력해주세요.", duration: 2000 });
        return;
      }
      if (!validateTimeInputs(targetHours, targetMinutes, targetSeconds)) {
        toast({ description: "올바른 시간을 입력해주세요.", duration: 2000 });
        return;
      }
      const totalSeconds = timeToSeconds(targetHours, targetMinutes, targetSeconds);
      const pacePerKm = calculatePacePerKm(targetDistance, totalSeconds);
      const speed = ((targetDistance / totalSeconds) * 3600).toFixed(1);
      setResults({ pace: `${pacePerKm}/km`, speed: `${speed} km/h` });
    } else if (mode === "distance") {
      if (!validateTimeInputs(targetHours, targetMinutes, targetSeconds)) {
        toast({ description: "올바른 시간을 입력해주세요.", duration: 2000 });
        return;
      }
      if (!validateTimeInputs(0, targetPaceMinutes, targetPaceSeconds)) {
        toast({ description: "올바른 페이스를 입력해주세요.", duration: 2000 });
        return;
      }
      const totalSeconds = timeToSeconds(targetHours, targetMinutes, targetSeconds);
      const paceSec = timeToSeconds(0, targetPaceMinutes, targetPaceSeconds);
      const calculatedDistance = (totalSeconds / paceSec).toFixed(2);
      setResults({ distance: `${calculatedDistance} km` });
    } else {
      if (!targetDistance || targetDistance <= 0) {
        toast({ description: "올바른 거리를 입력해주세요.", duration: 2000 });
        return;
      }
      if (!validateTimeInputs(0, targetPaceMinutes, targetPaceSeconds)) {
        toast({ description: "올바른 페이스를 입력해주세요.", duration: 2000 });
        return;
      }
      const paceSec = timeToSeconds(0, targetPaceMinutes, targetPaceSeconds);
      const totalSeconds = paceSec * targetDistance;
      const resultHours = Math.floor(totalSeconds / 3600);
      const resultMinutes = Math.floor((totalSeconds % 3600) / 60);
      const resultSeconds = Math.floor(totalSeconds % 60);
      setResults({
        time: `${resultHours}:${resultMinutes.toString().padStart(2, "0")}:${resultSeconds.toString().padStart(2, "0")}`,
      });
    }
  };

  const resetInputs = () => {
    setDistance("10");
    setHours("1");
    setMinutes("30");
    setSeconds("0");
    setPaceMinutes("5");
    setPaceSeconds("0");
    setResults(null);
  };

  return (
    <div className='space-y-4'>
      {/* 모드 선택 탭 */}
      <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-4'>
        <h3 className='text-[15px] font-semibold text-white'>계산 모드</h3>
        <div className='flex gap-2'>
          {[
            { id: "pace", label: "페이스" },
            { id: "distance", label: "거리" },
            { id: "time", label: "시간" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id as CalculatorMode);
                resetInputs();
              }}
              className={cn(
                "flex-1 px-3 py-2.5 text-sm font-medium rounded-rh-md transition-colors",
                mode === tab.id
                  ? "bg-rh-accent text-white"
                  : "bg-rh-bg-muted text-rh-text-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 입력 폼 */}
      <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-4'>
        <h3 className='text-[15px] font-semibold text-white'>입력값</h3>

        {mode !== "distance" && (
          <div>
            <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
              거리 (km)
            </label>
            <input
              type='number'
              step='0.1'
              min='0'
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder='10'
              className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none placeholder:text-rh-text-muted focus:ring-1 focus:ring-rh-accent'
            />
          </div>
        )}

        {mode !== "time" && (
          <div>
            <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
              시간
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
        )}

        {mode !== "pace" && (
          <div>
            <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
              목표 페이스 (km당)
            </label>
            <div className='flex gap-2 items-center'>
              <div className='flex-1'>
                <select
                  value={paceMinutes}
                  onChange={(e) => setPaceMinutes(e.target.value)}
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
                  value={paceSeconds}
                  onChange={(e) => setPaceSeconds(e.target.value)}
                  className='w-full px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}초</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleCalculate}
          className='w-full py-3 text-sm font-semibold text-white bg-rh-accent rounded-rh-md transition-colors active:bg-rh-accent-hover'
        >
          계산하기
        </button>
      </div>

      {/* 결과 */}
      {results && (
        <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-3'>
          <h3 className='text-[15px] font-semibold text-white'>결과</h3>
          {results.pace && (
            <>
              <div className='flex items-center justify-between px-4 py-3 bg-rh-bg-muted rounded-rh-md'>
                <span className='text-sm text-rh-text-secondary'>평균 페이스</span>
                <span className='text-base font-bold text-rh-accent'>{results.pace}</span>
              </div>
              <div className='flex items-center justify-between px-4 py-3 bg-rh-bg-muted rounded-rh-md'>
                <span className='text-sm text-rh-text-secondary'>평균 속도</span>
                <span className='text-base font-bold text-rh-accent'>{results.speed}</span>
              </div>
            </>
          )}
          {results.distance && (
            <div className='flex items-center justify-between px-4 py-3 bg-rh-bg-muted rounded-rh-md'>
              <span className='text-sm text-rh-text-secondary'>예상 거리</span>
              <span className='text-base font-bold text-rh-accent'>{results.distance}</span>
            </div>
          )}
          {results.time && (
            <div className='flex items-center justify-between px-4 py-3 bg-rh-bg-muted rounded-rh-md'>
              <span className='text-sm text-rh-text-secondary'>예상 시간</span>
              <span className='text-base font-bold text-rh-accent'>{results.time}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
