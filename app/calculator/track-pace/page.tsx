"use client";

import React, { useState } from "react";
import { FormLayout } from "@/components/layout/FormLayout";
import { cn } from "@/lib/utils";

interface TrackResult {
  lane1: string;
  lane2: string;
}

interface PaceRow {
  pace: string;
  lane1: string;
  lane2: string;
}

const LANE_DISTANCES = {
  lane1: 400,
  lane2: 407,
} as const;

export default function TrackPacePage() {
  const [inputMode, setInputMode] = useState<"marathon" | "pace">("marathon");
  const [marathonHours, setMarathonHours] = useState("3");
  const [marathonMinutes, setMarathonMinutes] = useState("30");
  const [marathonSeconds, setMarathonSeconds] = useState("0");
  const [paceMinutes, setPaceMinutes] = useState("6");
  const [paceSeconds, setPaceSeconds] = useState("0");
  const [outputMode, setOutputMode] = useState<"single" | "table">("single");
  const [selectedLanes, setSelectedLanes] = useState<"both" | "lane1" | "lane2">("both");

  const secondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const calculatePaceFromMarathon = (hours: string, minutes: string, seconds: string): number => {
    const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    return totalSeconds / 42.195;
  };

  const calculateLapTime = (pacePerKmInSeconds: number, distance: number): string => {
    const lapTimeSeconds = pacePerKmInSeconds * (distance / 1000);
    return secondsToTime(lapTimeSeconds);
  };

  const getCurrentPaceInSeconds = (): number => {
    if (inputMode === "marathon") {
      return calculatePaceFromMarathon(marathonHours, marathonMinutes, marathonSeconds);
    }
    return parseInt(paceMinutes) * 60 + parseInt(paceSeconds);
  };

  const calculateSingleResult = (): TrackResult | null => {
    const paceInSeconds = getCurrentPaceInSeconds();
    if (paceInSeconds === 0) return null;
    return {
      lane1: calculateLapTime(paceInSeconds, LANE_DISTANCES.lane1),
      lane2: calculateLapTime(paceInSeconds, LANE_DISTANCES.lane2),
    };
  };

  const calculateTableResults = (): PaceRow[] => {
    const basePaceInSeconds = getCurrentPaceInSeconds();
    if (basePaceInSeconds === 0) return [];
    const results: PaceRow[] = [];
    for (let offset = -60; offset <= 60; offset += 30) {
      const currentPaceInSeconds = basePaceInSeconds + offset;
      if (currentPaceInSeconds <= 0) continue;
      const minutes = Math.floor(currentPaceInSeconds / 60);
      const seconds = Math.floor(currentPaceInSeconds % 60);
      results.push({
        pace: `${minutes}:${seconds.toString().padStart(2, "0")}`,
        lane1: calculateLapTime(currentPaceInSeconds, LANE_DISTANCES.lane1),
        lane2: calculateLapTime(currentPaceInSeconds, LANE_DISTANCES.lane2),
      });
    }
    return results;
  };

  const singleResult = calculateSingleResult();
  const tableResults = calculateTableResults();

  const getCurrentPaceString = (): string => {
    if (inputMode === "marathon") {
      const paceInSeconds = calculatePaceFromMarathon(marathonHours, marathonMinutes, marathonSeconds);
      const minutes = Math.floor(paceInSeconds / 60);
      const seconds = Math.floor(paceInSeconds % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${paceMinutes}:${paceSeconds.padStart(2, "0")}`;
  };

  return (
    <FormLayout title='트랙 페이스 계산기'>
      <div className='space-y-4 mb-20'>
        {/* 입력 모드 */}
        <div className='p-4 bg-rh-bg-surface rounded-rh-lg space-y-4'>
          <h3 className='text-[15px] font-semibold text-white'>목표 설정</h3>

          <div className='flex gap-2'>
            {[
              { value: "marathon", label: "마라톤 목표 기록" },
              { value: "pace", label: "1km 페이스 직접" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setInputMode(opt.value as typeof inputMode)}
                className={cn(
                  "flex-1 px-3 py-2.5 text-sm font-medium rounded-rh-md transition-colors",
                  inputMode === opt.value
                    ? "bg-rh-accent text-white"
                    : "bg-rh-bg-muted text-rh-text-secondary"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {inputMode === "marathon" && (
            <div>
              <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
                마라톤 목표 기록 (시:분:초)
              </label>
              <div className='flex gap-2'>
                <select
                  value={marathonHours}
                  onChange={(e) => setMarathonHours(e.target.value)}
                  className='flex-1 px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
                >
                  {Array.from({ length: 25 }, (_, i) => (
                    <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}시</option>
                  ))}
                </select>
                <select
                  value={marathonMinutes}
                  onChange={(e) => setMarathonMinutes(e.target.value)}
                  className='flex-1 px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}분</option>
                  ))}
                </select>
                <select
                  value={marathonSeconds}
                  onChange={(e) => setMarathonSeconds(e.target.value)}
                  className='flex-1 px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}초</option>
                  ))}
                </select>
              </div>
              <p className='mt-1.5 text-[11px] text-rh-text-muted'>
                입력한 마라톤 기록에서 1km 페이스를 자동 계산합니다
              </p>
            </div>
          )}

          {inputMode === "pace" && (
            <div>
              <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
                1km 페이스 (분:초)
              </label>
              <div className='flex gap-2 items-center'>
                <select
                  value={paceMinutes}
                  onChange={(e) => setPaceMinutes(e.target.value)}
                  className='flex-1 px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}분</option>
                  ))}
                </select>
                <span className='text-rh-text-muted'>:</span>
                <select
                  value={paceSeconds}
                  onChange={(e) => setPaceSeconds(e.target.value)}
                  className='flex-1 px-3 py-2.5 text-sm text-white bg-rh-bg-muted rounded-rh-md outline-none'
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString()}>{i.toString().padStart(2, "0")}초</option>
                  ))}
                </select>
              </div>
              <p className='mt-1.5 text-[11px] text-rh-text-muted'>
                1km당 목표 페이스를 직접 설정합니다
              </p>
            </div>
          )}

          {/* 레인 선택 */}
          <div>
            <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
              레인 선택
            </label>
            <div className='flex gap-2'>
              {[
                { value: "both", label: "ALL" },
                { value: "lane1", label: "1레인" },
                { value: "lane2", label: "2레인" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedLanes(option.value as typeof selectedLanes)}
                  className={cn(
                    "flex-1 px-3 py-2.5 text-sm font-medium rounded-rh-md transition-colors",
                    selectedLanes === option.value
                      ? "bg-rh-accent text-white"
                      : "bg-rh-bg-muted text-rh-text-secondary"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 출력 모드 */}
          <div>
            <label className='block mb-2 text-xs font-medium text-rh-text-secondary'>
              출력 모드
            </label>
            <div className='flex gap-2'>
              {[
                { value: "single", label: "단일 결과" },
                { value: "table", label: "전체 표 보기" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOutputMode(opt.value as typeof outputMode)}
                  className={cn(
                    "flex-1 px-3 py-2.5 text-sm font-medium rounded-rh-md transition-colors",
                    outputMode === opt.value
                      ? "bg-rh-accent text-white"
                      : "bg-rh-bg-muted text-rh-text-secondary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 섹션 */}
        {(singleResult || tableResults.length > 0) && (
          <div className='p-4 bg-rh-bg-surface rounded-rh-lg'>
            <div className='mb-3 text-center'>
              <p className='text-xs text-rh-text-secondary'>
                {inputMode === "marathon"
                  ? `마라톤 ${marathonHours}:${marathonMinutes.padStart(2, "0")}:${marathonSeconds.padStart(2, "0")} 기준`
                  : "직접 입력 페이스"}
              </p>
              <p className='text-base font-bold text-rh-accent mt-0.5'>
                페이스: {getCurrentPaceString()}/km
                {outputMode === "table" && " ± 1분"}
              </p>
            </div>

            {outputMode === "single" && singleResult && (
              <div className='space-y-2'>
                {selectedLanes !== "lane2" && (
                  <div className='flex items-center justify-between px-4 py-3 bg-rh-bg-muted rounded-rh-md'>
                    <span className='text-sm text-rh-text-secondary'>1레인 (400m)</span>
                    <span className='text-base font-bold text-rh-accent'>{singleResult.lane1}</span>
                  </div>
                )}
                {selectedLanes !== "lane1" && (
                  <div className='flex items-center justify-between px-4 py-3 bg-rh-bg-muted rounded-rh-md'>
                    <span className='text-sm text-rh-text-secondary'>2레인 (407m)</span>
                    <span className='text-base font-bold text-rh-accent'>{singleResult.lane2}</span>
                  </div>
                )}
              </div>
            )}

            {outputMode === "table" && tableResults.length > 0 && (
              <div className='overflow-x-auto -mx-1'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-rh-border'>
                      <th className='px-2 py-2 text-left text-xs font-medium text-rh-text-secondary'>페이스(/km)</th>
                      {selectedLanes !== "lane2" && (
                        <th className='px-2 py-2 text-center text-xs font-medium text-rh-text-secondary'>1레인</th>
                      )}
                      {selectedLanes !== "lane1" && (
                        <th className='px-2 py-2 text-center text-xs font-medium text-rh-text-secondary'>2레인</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tableResults.map((row, index) => {
                      const isCurrentPace = row.pace === getCurrentPaceString();
                      return (
                        <tr
                          key={index}
                          className={cn(
                            "border-b border-rh-border/30",
                            isCurrentPace && "bg-rh-accent/15"
                          )}
                        >
                          <td className={cn("py-2 px-2 font-medium text-white", isCurrentPace && "text-rh-accent")}>
                            {row.pace}
                          </td>
                          {selectedLanes !== "lane2" && (
                            <td className={cn("text-center py-2 px-2 text-white", isCurrentPace && "text-rh-accent font-bold")}>
                              {row.lane1}
                            </td>
                          )}
                          {selectedLanes !== "lane1" && (
                            <td className={cn("text-center py-2 px-2 text-white", isCurrentPace && "text-rh-accent font-bold")}>
                              {row.lane2}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 사용법 */}
        <div className='p-4 bg-rh-bg-surface rounded-rh-lg'>
          <h3 className='text-[15px] font-semibold text-white mb-2'>사용법</h3>
          <div className='space-y-1.5 text-[12px] text-rh-text-tertiary leading-relaxed'>
            <p>• 마라톤 목표 기록 또는 1km 페이스를 입력하세요</p>
            <p>• 1레인: 400m, 2레인: 407m 기준 랩타임 계산</p>
            <p>• 단일 결과: 설정 페이스의 랩타임만 확인</p>
            <p>• 전체 표: 기준 페이스 ±1분 범위 비교표</p>
          </div>
        </div>
      </div>
    </FormLayout>
  );
}
