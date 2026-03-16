"use client";

import { useState } from "react";
import CalculatorLayout from "@/components/calculator/shared/CalculatorLayout";
import TimeInput from "@/components/calculator/shared/TimeInput";
import ChipSelector from "@/components/calculator/shared/ChipSelector";
import {
    timeToSeconds,
    validateTimeInputs,
    calculatePacePerKm,
} from "@/lib/utils/calculator";
import { useToast } from "@/components/ui/use-toast";

type CalculatorMode = "pace" | "distance" | "time";

const modeOptions = [
    { value: "pace", label: "페이스" },
    { value: "distance", label: "거리" },
    { value: "time", label: "시간" },
];

export default function PaceCalculatorPage() {
    const { toast } = useToast();
    const [mode, setMode] = useState<CalculatorMode>("pace");
    const [distance, setDistance] = useState("10");
    const [hours, setHours] = useState("1");
    const [minutes, setMinutes] = useState("30");
    const [seconds, setSeconds] = useState("0");
    const [paceMin, setPaceMin] = useState("5");
    const [paceSec, setPaceSec] = useState("0");
    const [results, setResults] = useState<{
        pace?: string;
        distance?: string;
        time?: string;
        speed?: string;
    } | null>(null);

    const handleModeChange = (val: string) => {
        setMode(val as CalculatorMode);
        setResults(null);
    };

    const handleCalculate = () => {
        const h = parseInt(hours || "0");
        const m = parseInt(minutes || "0");
        const s = parseInt(seconds || "0");
        const pm = parseInt(paceMin || "0");
        const ps = parseInt(paceSec || "0");
        const dist = parseFloat(distance);

        if (mode === "pace") {
            if (!dist || dist <= 0) {
                toast({ description: "올바른 거리를 입력해주세요.", duration: 2000 });
                return;
            }
            if (!validateTimeInputs(h, m, s)) {
                toast({ description: "올바른 시간을 입력해주세요.", duration: 2000 });
                return;
            }
            const totalSec = timeToSeconds(h, m, s);
            const pace = calculatePacePerKm(dist, totalSec);
            const speed = ((dist / totalSec) * 3600).toFixed(1);
            setResults({ pace: `${pace}/km`, speed: `${speed} km/h` });
        } else if (mode === "distance") {
            if (!validateTimeInputs(h, m, s)) {
                toast({ description: "올바른 시간을 입력해주세요.", duration: 2000 });
                return;
            }
            if (!validateTimeInputs(0, pm, ps)) {
                toast({ description: "올바른 페이스를 입력해주세요.", duration: 2000 });
                return;
            }
            const totalSec = timeToSeconds(h, m, s);
            const paceSeconds = timeToSeconds(0, pm, ps);
            const calcDist = (totalSec / paceSeconds).toFixed(2);
            setResults({ distance: `${calcDist} km` });
        } else {
            if (!dist || dist <= 0) {
                toast({ description: "올바른 거리를 입력해주세요.", duration: 2000 });
                return;
            }
            if (!validateTimeInputs(0, pm, ps)) {
                toast({ description: "올바른 페이스를 입력해주세요.", duration: 2000 });
                return;
            }
            const paceSeconds = timeToSeconds(0, pm, ps);
            const totalSec = paceSeconds * dist;
            const rh = Math.floor(totalSec / 3600);
            const rm = Math.floor((totalSec % 3600) / 60);
            const rs = Math.floor(totalSec % 60);
            setResults({
                time: `${rh}:${rm.toString().padStart(2, "0")}:${rs.toString().padStart(2, "0")}`,
            });
        }
    };

    return (
        <CalculatorLayout title="페이스 계산기">
            {/* 탭 선택 */}
            <ChipSelector
                options={modeOptions}
                value={mode}
                onChange={handleModeChange}
            />

            {/* 거리 입력 (페이스/시간 모드) */}
            {mode !== "distance" && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>
                        거리 (km)
                    </span>
                    <div
                        className="flex items-center h-12 rounded-lg border px-4"
                        style={{ backgroundColor: "#2B3644", borderColor: "#374151" }}
                    >
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            placeholder="10"
                            className="w-full text-base font-semibold text-white bg-transparent outline-none placeholder:text-rh-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                </div>
            )}

            {/* 시간 입력 (페이스/거리 모드) */}
            {mode !== "time" && (
                <TimeInput
                    label="시간"
                    hours={hours}
                    minutes={minutes}
                    seconds={seconds}
                    onHoursChange={setHours}
                    onMinutesChange={setMinutes}
                    onSecondsChange={setSeconds}
                />
            )}

            {/* 페이스 입력 (거리/시간 모드) */}
            {mode !== "pace" && (
                <TimeInput
                    label="목표 페이스 (km당)"
                    hours={paceMin}
                    minutes={paceSec}
                    seconds="0"
                    onHoursChange={setPaceMin}
                    onMinutesChange={setPaceSec}
                    onSecondsChange={() => {}}
                    hideHours
                />
            )}

            {/* 계산하기 버튼 */}
            <button
                onClick={handleCalculate}
                className="w-full h-12 rounded-xl text-sm font-semibold text-white transition-colors active:opacity-80"
                style={{ backgroundColor: "#669FF2" }}
            >
                계산하기
            </button>

            {/* 결과 카드 */}
            {results && (
                <div
                    className="rounded-xl p-5 space-y-4"
                    style={{ backgroundColor: "#2B3644" }}
                >
                    <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>
                        계산 결과
                    </span>

                    {results.pace && (
                        <>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-white">
                                    {results.pace.replace("/km", "")}
                                </span>
                                <span className="text-base font-medium mb-1" style={{ color: "#94A3B8" }}>
                                    /km
                                </span>
                            </div>
                            <div
                                className="flex justify-between items-center rounded-lg px-4 py-3"
                                style={{ backgroundColor: "#1D2530" }}
                            >
                                <span className="text-[13px]" style={{ color: "#94A3B8" }}>
                                    평균 속도
                                </span>
                                <span className="text-[13px] font-semibold text-white">
                                    {results.speed}
                                </span>
                            </div>
                            <div
                                className="flex justify-between items-center rounded-lg px-4 py-3"
                                style={{ backgroundColor: "#1D2530" }}
                            >
                                <span className="text-[13px]" style={{ color: "#94A3B8" }}>
                                    총 거리
                                </span>
                                <span className="text-[13px] font-semibold text-white">
                                    {distance} km
                                </span>
                            </div>
                        </>
                    )}

                    {results.distance && (
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">
                                {results.distance.replace(" km", "")}
                            </span>
                            <span className="text-base font-medium mb-1" style={{ color: "#94A3B8" }}>
                                km
                            </span>
                        </div>
                    )}

                    {results.time && (
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">
                                {results.time}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </CalculatorLayout>
    );
}
