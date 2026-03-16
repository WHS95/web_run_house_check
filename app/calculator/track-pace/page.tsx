"use client";

import { useState } from "react";
import CalculatorLayout from "@/components/calculator/shared/CalculatorLayout";
import TimeInput from "@/components/calculator/shared/TimeInput";
import ChipSelector from "@/components/calculator/shared/ChipSelector";
import ResultTable from "@/components/calculator/shared/ResultTable";
import { secondsToTimeString } from "@/lib/utils/calculator";

const LANE_DISTANCES = { lane1: 400, lane2: 407 } as const;

const modeOptions = [
    { value: "marathon", label: "마라톤 목표 기록" },
    { value: "pace", label: "1km 페이스 직접" },
];

const laneOptions = [
    { value: "both", label: "ALL" },
    { value: "lane1", label: "1레인" },
    { value: "lane2", label: "2레인" },
];

const outputOptions = [
    { value: "single", label: "단일 결과" },
    { value: "table", label: "전체 표 보기" },
];

export default function TrackPaceCalculatorPage() {
    const [inputMode, setInputMode] = useState("marathon");
    const [marathonH, setMarathonH] = useState("3");
    const [marathonM, setMarathonM] = useState("30");
    const [marathonS, setMarathonS] = useState("0");
    const [paceM, setPaceM] = useState("6");
    const [paceS, setPaceS] = useState("0");
    const [selectedLane, setSelectedLane] = useState("both");
    const [outputMode, setOutputMode] = useState("single");

    const getPaceInSeconds = (): number => {
        if (inputMode === "marathon") {
            const total =
                parseInt(marathonH) * 3600 +
                parseInt(marathonM) * 60 +
                parseInt(marathonS);
            return total / 42.195;
        }
        return parseInt(paceM) * 60 + parseInt(paceS);
    };

    const calcLapTime = (pacePerKm: number, laneDist: number): string => {
        const lapSec = pacePerKm * (laneDist / 1000);
        return secondsToTimeString(lapSec);
    };

    const getPaceString = (): string => {
        const paceSec = getPaceInSeconds();
        const m = Math.floor(paceSec / 60);
        const s = Math.floor(paceSec % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const paceInSeconds = getPaceInSeconds();

    // 테이블 결과 생성 (±60초, 30초 단위)
    const tableRows = [];
    for (let offset = -60; offset <= 60; offset += 30) {
        const currentPace = paceInSeconds + offset;
        if (currentPace <= 0) continue;
        const m = Math.floor(currentPace / 60);
        const s = Math.floor(currentPace % 60);
        const paceStr = `${m}:${s.toString().padStart(2, "0")}/km`;
        const lane1 = calcLapTime(currentPace, LANE_DISTANCES.lane1);
        const lane2 = calcLapTime(currentPace, LANE_DISTANCES.lane2);
        const isBase = offset === 0;

        let value = "";
        if (selectedLane === "lane1") value = lane1;
        else if (selectedLane === "lane2") value = lane2;
        else value = `${lane1} / ${lane2}`;

        tableRows.push({
            label: paceStr,
            value,
            highlight: isBase,
        });
    }

    return (
        <CalculatorLayout title="트랙 페이스 계산기">
            {/* 목표 설정 카드 */}
            <div
                className="rounded-xl p-4 space-y-4"
                style={{ backgroundColor: "#2B3644" }}
            >
                <span className="text-base font-semibold text-white">
                    목표 설정
                </span>

                <ChipSelector
                    options={modeOptions}
                    value={inputMode}
                    onChange={setInputMode}
                />

                {inputMode === "marathon" ? (
                    <>
                        <TimeInput
                            label="마라톤 목표 기록 (시:분:초)"
                            hours={marathonH}
                            minutes={marathonM}
                            seconds={marathonS}
                            onHoursChange={setMarathonH}
                            onMinutesChange={setMarathonM}
                            onSecondsChange={setMarathonS}
                        />
                        <span className="text-[11px]" style={{ color: "#64748B" }}>
                            입력한 마라톤 기록에서 1km 페이스를 자동 계산합니다
                        </span>
                    </>
                ) : (
                    <TimeInput
                        label="1km 페이스 (분:초)"
                        hours={paceM}
                        minutes={paceS}
                        seconds="0"
                        onHoursChange={setPaceM}
                        onMinutesChange={setPaceS}
                        onSecondsChange={() => {}}
                        hideHours
                    />
                )}
            </div>

            {/* 레인 선택 */}
            <ChipSelector
                label="레인 선택"
                options={laneOptions}
                value={selectedLane}
                onChange={setSelectedLane}
            />

            {/* 출력 모드 */}
            <ChipSelector
                label="출력 모드"
                options={outputOptions}
                value={outputMode}
                onChange={setOutputMode}
            />

            {/* 결과 */}
            {outputMode === "single" ? (
                <div
                    className="rounded-xl p-5 space-y-2"
                    style={{ backgroundColor: "#2B3644" }}
                >
                    <span
                        className="text-[13px] font-medium"
                        style={{ color: "#94A3B8" }}
                    >
                        {inputMode === "marathon"
                            ? `마라톤 ${marathonH}:${marathonM.padStart(2, "0")}:${marathonS.padStart(2, "0")} 기준`
                            : "직접 입력 페이스"}
                    </span>
                    <div className="flex items-end gap-2">
                        <span
                            className="text-[32px] font-bold leading-none"
                            style={{ color: "#669FF2" }}
                        >
                            {getPaceString()}
                        </span>
                        <span
                            className="text-sm font-medium mb-1"
                            style={{ color: "#94A3B8" }}
                        >
                            /km
                        </span>
                    </div>

                    {/* 레인별 랩타임 */}
                    <div className="space-y-2 pt-2">
                        {selectedLane !== "lane2" && (
                            <div
                                className="flex justify-between items-center rounded-lg px-4 py-3"
                                style={{ backgroundColor: "#1D2530" }}
                            >
                                <span className="text-[13px]" style={{ color: "#94A3B8" }}>
                                    1레인 (400m)
                                </span>
                                <span className="text-[13px] font-semibold text-white">
                                    {calcLapTime(paceInSeconds, LANE_DISTANCES.lane1)}
                                </span>
                            </div>
                        )}
                        {selectedLane !== "lane1" && (
                            <div
                                className="flex justify-between items-center rounded-lg px-4 py-3"
                                style={{ backgroundColor: "#1D2530" }}
                            >
                                <span className="text-[13px]" style={{ color: "#94A3B8" }}>
                                    2레인 (407m)
                                </span>
                                <span className="text-[13px] font-semibold text-white">
                                    {calcLapTime(paceInSeconds, LANE_DISTANCES.lane2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <ResultTable
                    headers={[
                        "페이스",
                        selectedLane === "lane1"
                            ? "1레인"
                            : selectedLane === "lane2"
                              ? "2레인"
                              : "1레인 / 2레인",
                    ]}
                    rows={tableRows}
                />
            )}
        </CalculatorLayout>
    );
}
