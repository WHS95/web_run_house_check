"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import CalculatorLayout from "@/components/calculator/shared/CalculatorLayout";
import TimeInput from "@/components/calculator/shared/TimeInput";
import ResultTable from "@/components/calculator/shared/ResultTable";
import {
    timeToSeconds,
    validateTimeInputs,
    predictFinishTime,
    secondsToTimeString,
} from "@/lib/utils/calculator";
import { useToast } from "@/components/ui/use-toast";

const STANDARD_DISTANCES = [
    { distance: 5, label: "5 km" },
    { distance: 10, label: "10 km" },
    { distance: 21.1, label: "하프 (21.1km)" },
    { distance: 42.195, label: "풀 (42.195km)" },
];

export default function PredictionCalculatorPage() {
    const { toast } = useToast();
    const [recordedDistance, setRecordedDistance] = useState("");
    const [hours, setHours] = useState("0");
    const [minutes, setMinutes] = useState("50");
    const [seconds, setSeconds] = useState("0");
    const [targetDistance, setTargetDistance] = useState("");
    const [rows, setRows] = useState<
        { label: string; value: string; highlight?: boolean }[]
    >([]);

    const handleCalculate = () => {
        const dist = parseFloat(recordedDistance);
        const targetDist = parseFloat(targetDistance);
        const h = parseInt(hours || "0");
        const m = parseInt(minutes || "0");
        const s = parseInt(seconds || "0");

        if (!dist || dist <= 0 || dist > 300) {
            toast({
                description: "기록 거리를 올바르게 입력해주세요. (1~300km)",
                duration: 2000,
            });
            return;
        }
        if (!validateTimeInputs(h, m, s)) {
            toast({ description: "기록 시간을 입력해주세요.", duration: 2000 });
            return;
        }
        if (!targetDist || targetDist <= 0 || targetDist > 300) {
            toast({
                description: "목표 거리를 올바르게 입력해주세요. (1~300km)",
                duration: 2000,
            });
            return;
        }

        const totalSec = timeToSeconds(h, m, s);

        // 표준 거리 + 목표 거리 계산
        const resultRows: { label: string; value: string; highlight?: boolean }[] = [];

        for (const sd of STANDARD_DISTANCES) {
            if (sd.distance <= dist) continue; // 기록 거리보다 짧으면 스킵
            const predicted = predictFinishTime(dist, totalSec, sd.distance);
            resultRows.push({
                label: sd.label,
                value: secondsToTimeString(predicted),
            });
        }

        // 목표 거리가 표준에 없으면 추가
        const isStandard = STANDARD_DISTANCES.some(
            (sd) => Math.abs(sd.distance - targetDist) < 0.01
        );
        if (!isStandard) {
            const predicted = predictFinishTime(dist, totalSec, targetDist);
            resultRows.push({
                label: `${targetDist} km`,
                value: secondsToTimeString(predicted),
                highlight: true,
            });
        }

        setRows(resultRows);
    };

    return (
        <CalculatorLayout title="완주 시간 예측기">
            {/* 정보 카드 */}
            <div
                className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                style={{ backgroundColor: "rgba(102, 159, 242, 0.15)" }}
            >
                <Info size={18} className="shrink-0 mt-0.5" style={{ color: "#669FF2" }} />
                <span
                    className="text-xs font-medium leading-relaxed"
                    style={{ color: "#669FF2" }}
                >
                    이전 기록을 바탕으로 다른 거리의 예상 완주 시간을 계산합니다.
                </span>
            </div>

            {/* 나의 기록 거리 */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>
                    나의 기록 거리 (km)
                </span>
                <div
                    className="flex items-center h-12 rounded-lg border px-4"
                    style={{ backgroundColor: "#2B3644", borderColor: "#374151" }}
                >
                    <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="300"
                        value={recordedDistance}
                        onChange={(e) => setRecordedDistance(e.target.value)}
                        placeholder="예: 10.5"
                        className="w-full text-base font-semibold text-white bg-transparent outline-none placeholder:text-rh-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </div>

            {/* 나의 기록 시간 */}
            <TimeInput
                label="나의 기록 시간"
                hours={hours}
                minutes={minutes}
                seconds={seconds}
                onHoursChange={setHours}
                onMinutesChange={setMinutes}
                onSecondsChange={setSeconds}
            />

            {/* 목표 거리 */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>
                    목표 거리 (km)
                </span>
                <div
                    className="flex items-center h-12 rounded-lg border px-4"
                    style={{ backgroundColor: "#2B3644", borderColor: "#374151" }}
                >
                    <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="300"
                        value={targetDistance}
                        onChange={(e) => setTargetDistance(e.target.value)}
                        placeholder="예: 21.1"
                        className="w-full text-base font-semibold text-white bg-transparent outline-none placeholder:text-rh-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </div>

            {/* 계산하기 버튼 */}
            <button
                onClick={handleCalculate}
                className="w-full h-12 rounded-xl text-sm font-semibold text-white transition-colors active:opacity-80"
                style={{ backgroundColor: "#669FF2" }}
            >
                계산하기
            </button>

            {/* 결과 테이블 */}
            {rows.length > 0 && (
                <ResultTable
                    headers={["거리", "예상 시간"]}
                    rows={rows}
                />
            )}
        </CalculatorLayout>
    );
}
