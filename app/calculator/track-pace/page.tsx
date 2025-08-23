"use client";

import React, { useState } from "react";
import { FormLayout } from "@/components/layout/FormLayout";

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
  lane1: 400, // 미터
  lane2: 407, // 미터
} as const;

export default function TrackPacePage() {
  const [marathonHours, setMarathonHours] = useState("3");
  const [marathonMinutes, setMarathonMinutes] = useState("30");
  const [marathonSeconds, setMarathonSeconds] = useState("0");
  const [paceMinutes, setPaceMinutes] = useState("6");
  const [paceSeconds, setPaceSeconds] = useState("0");
  const [outputMode, setOutputMode] = useState<"single" | "table">("single");
  const [selectedLanes, setSelectedLanes] = useState<
    "both" | "lane1" | "lane2"
  >("both");

  // 시간을 초로 변환
  const timeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(":");
    if (parts.length === 3) {
      return (
        parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
      );
    }
    return 0;
  };

  // 초를 시:분:초 형식으로 변환
  const secondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // 마라톤 시간에서 1km 페이스 계산
  const calculatePaceFromMarathon = (
    hours: string,
    minutes: string,
    seconds: string
  ): number => {
    const totalSeconds =
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    return totalSeconds / 42.195; // 42.195km로 나누어 1km당 초 계산
  };

  // 페이스에서 랩 타임 계산
  const calculateLapTime = (
    pacePerKmInSeconds: number,
    distance: number
  ): string => {
    const lapTimeSeconds = pacePerKmInSeconds * (distance / 1000);
    return secondsToTime(lapTimeSeconds);
  };

  // 현재 설정된 페이스 가져우기 (초 단위)
  const getCurrentPaceInSeconds = (): number => {
    if (marathonHours || marathonMinutes || marathonSeconds) {
      return calculatePaceFromMarathon(
        marathonHours,
        marathonMinutes,
        marathonSeconds
      );
    } else if (paceMinutes && paceSeconds) {
      return parseInt(paceMinutes) * 60 + parseInt(paceSeconds);
    }
    return 0;
  };

  // 단일 결과 계산
  const calculateSingleResult = (): TrackResult | null => {
    const paceInSeconds = getCurrentPaceInSeconds();
    if (paceInSeconds === 0) return null;

    return {
      lane1: calculateLapTime(paceInSeconds, LANE_DISTANCES.lane1),
      lane2: calculateLapTime(paceInSeconds, LANE_DISTANCES.lane2),
    };
  };

  // 표 형식 결과 계산 (±1분 범위)
  const calculateTableResults = (): PaceRow[] => {
    const basePaceInSeconds = getCurrentPaceInSeconds();
    if (basePaceInSeconds === 0) return [];

    const results: PaceRow[] = [];

    // ±1분 범위에서 30초 간격으로 생성
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

  // 현재 페이스 문자열 가져오기
  const getCurrentPaceString = (): string => {
    if (marathonHours || marathonMinutes || marathonSeconds) {
      const paceInSeconds = calculatePaceFromMarathon(
        marathonHours,
        marathonMinutes,
        marathonSeconds
      );
      const minutes = Math.floor(paceInSeconds / 60);
      const seconds = Math.floor(paceInSeconds % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    } else if (paceMinutes && paceSeconds) {
      return `${paceMinutes}:${paceSeconds.padStart(2, "0")}`;
    }
    return "";
  };

  return (
    <FormLayout title='트랙 페이스 계산기'>
      <div className='space-y-6 mb-44'>
        {/* 입력 섹션 */}
        <div className='p-4 space-y-4 bg-basic-black-gray rounded-2xl'>
          <h3 className='text-lg font-bold text-white'>목표 설정</h3>

          {/* 마라톤 목표 시간 */}
          <div>
            <label className='block mb-2 text-sm font-medium text-white'>
              마라톤 목표 기록 (시:분:초)
            </label>
            <div className='flex gap-2'>
              <select
                value={marathonHours}
                onChange={(e) => {
                  setMarathonHours(e.target.value);
                  if (
                    e.target.value !== "0" ||
                    marathonMinutes !== "0" ||
                    marathonSeconds !== "0"
                  ) {
                    setPaceMinutes("6");
                    setPaceSeconds("0");
                  }
                }}
                className='flex-1 px-3 py-2 text-white rounded-lg bg-basic-gray'
              >
                {Array.from({ length: 25 }, (_, i) => (
                  <option key={i} value={i.toString()}>
                    {i.toString().padStart(2, "0")}시
                  </option>
                ))}
              </select>
              <select
                value={marathonMinutes}
                onChange={(e) => {
                  setMarathonMinutes(e.target.value);
                  if (
                    marathonHours !== "0" ||
                    e.target.value !== "0" ||
                    marathonSeconds !== "0"
                  ) {
                    setPaceMinutes("6");
                    setPaceSeconds("0");
                  }
                }}
                className='flex-1 px-3 py-2 text-white rounded-lg bg-basic-gray'
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i.toString()}>
                    {i.toString().padStart(2, "0")}분
                  </option>
                ))}
              </select>
              <select
                value={marathonSeconds}
                onChange={(e) => {
                  setMarathonSeconds(e.target.value);
                  if (
                    marathonHours !== "0" ||
                    marathonMinutes !== "0" ||
                    e.target.value !== "0"
                  ) {
                    setPaceMinutes("6");
                    setPaceSeconds("0");
                  }
                }}
                className='flex-1 px-3 py-2 text-white rounded-lg bg-basic-gray'
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i.toString()}>
                    {i.toString().padStart(2, "0")}초
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='text-sm text-center text-gray-400'>또는</div>

          {/* 1km 페이스 직접 입력 */}
          <div>
            <label className='block mb-2 text-sm font-medium text-white'>
              1km 페이스 (분:초)
            </label>
            <div className='flex gap-2'>
              <select
                value={paceMinutes}
                onChange={(e) => {
                  setPaceMinutes(e.target.value);
                  if (e.target.value !== "6" || paceSeconds !== "0") {
                    setMarathonHours("0");
                    setMarathonMinutes("0");
                    setMarathonSeconds("0");
                  }
                }}
                className='flex-1 px-3 py-2 text-white rounded-lg bg-basic-gray'
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i.toString()}>
                    {i.toString().padStart(2, "0")}분
                  </option>
                ))}
              </select>
              <span className='self-center text-white'>:</span>
              <select
                value={paceSeconds}
                onChange={(e) => {
                  setPaceSeconds(e.target.value);
                  if (paceMinutes !== "6" || e.target.value !== "0") {
                    setMarathonHours("0");
                    setMarathonMinutes("0");
                    setMarathonSeconds("0");
                  }
                }}
                className='flex-1 px-3 py-2 text-white rounded-lg bg-basic-gray'
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i.toString()}>
                    {i.toString().padStart(2, "0")}초
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 레인 선택 */}
          <div>
            <label className='block mb-2 text-sm font-medium text-white'>
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
                  onClick={() =>
                    setSelectedLanes(option.value as typeof selectedLanes)
                  }
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedLanes === option.value
                      ? "bg-basic-blue text-white"
                      : "bg-basic-gray text-gray-300 hover:bg-basic-blue/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 출력 모드 선택 */}
          <div>
            <label className='block mb-2 text-sm font-medium text-white'>
              출력 모드
            </label>
            <div className='flex gap-2'>
              <button
                onClick={() => setOutputMode("single")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  outputMode === "single"
                    ? "bg-basic-blue text-white"
                    : "bg-basic-gray text-gray-300 hover:bg-basic-blue/20"
                }`}
              >
                단일 결과
              </button>
              <button
                onClick={() => setOutputMode("table")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  outputMode === "table"
                    ? "bg-basic-blue text-white"
                    : "bg-basic-gray text-gray-300 hover:bg-basic-blue/20"
                }`}
              >
                전체 표 보기
              </button>
            </div>
          </div>
        </div>

        {/* 결과 섹션 */}
        {(singleResult || tableResults.length > 0) && (
          <div className='p-4 bg-basic-black-gray rounded-2xl'>
            {outputMode === "single" && singleResult && (
              <div className='space-y-3'>
                <div className='mb-4 text-lg font-bold text-center text-basic-blue'>
                  페이스: {getCurrentPaceString()}/km
                </div>

                {selectedLanes !== "lane2" && (
                  <div className='flex items-center justify-between px-4 py-3 rounded-lg bg-basic-gray'>
                    <span className='font-medium text-white'>1레인 (400m)</span>
                    <span className='text-lg font-bold text-basic-blue'>
                      {singleResult.lane1}
                    </span>
                  </div>
                )}

                {selectedLanes !== "lane1" && (
                  <div className='flex items-center justify-between px-4 py-3 rounded-lg bg-basic-gray'>
                    <span className='font-medium text-white'>2레인 (407m)</span>
                    <span className='text-lg font-bold text-basic-blue'>
                      {singleResult.lane2}
                    </span>
                  </div>
                )}
              </div>
            )}

            {outputMode === "table" && tableResults.length > 0 && (
              <div className='overflow-x-auto'>
                <table className='w-full text-white'>
                  <thead>
                    <tr className='border-b border-basic-gray'>
                      <th className='px-2 py-2 text-left'>페이스(/km)</th>
                      {selectedLanes !== "lane2" && (
                        <th className='px-2 py-2 text-center'>1레인 (400m)</th>
                      )}
                      {selectedLanes !== "lane1" && (
                        <th className='px-2 py-2 text-center'>2레인 (407m)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tableResults.map((row, index) => {
                      const isCurrentPace = row.pace === getCurrentPaceString();
                      return (
                        <tr
                          key={index}
                          className={`border-b border-basic-gray/30 ${
                            isCurrentPace ? "bg-basic-blue/20" : ""
                          }`}
                        >
                          <td
                            className={`py-2 px-2 font-medium ${
                              isCurrentPace ? "text-basic-blue" : ""
                            }`}
                          >
                            {row.pace}
                          </td>
                          {selectedLanes !== "lane2" && (
                            <td
                              className={`text-center py-2 px-2 ${
                                isCurrentPace ? "text-basic-blue font-bold" : ""
                              }`}
                            >
                              {row.lane1}
                            </td>
                          )}
                          {selectedLanes !== "lane1" && (
                            <td
                              className={`text-center py-2 px-2 ${
                                isCurrentPace ? "text-basic-blue font-bold" : ""
                              }`}
                            >
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

        {/* 설명 섹션 */}
        <div className='p-4 bg-basic-black-gray rounded-2xl'>
          <h3 className='mb-2 text-lg font-bold text-white'>사용법</h3>
          <div className='space-y-2 text-sm text-gray-300'>
            <p>• 마라톤 목표 기록 입력 시 자동으로 1km 페이스가 계산됩니다</p>
            <p>• 또는 1km 페이스를 직접 입력할 수 있습니다</p>
            <p>• 1레인: 400m, 2레인: 407m 기준으로 계산됩니다</p>
            <p>• 단일 결과: 입력한 페이스만 간단히 확인</p>
            <p>• 전체 표 보기: 주변 페이스 구간도 함께 비교</p>
          </div>
        </div>
      </div>
    </FormLayout>
  );
}
