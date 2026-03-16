"use client";

import { useState } from "react";
import CalculatorLayout from "@/components/calculator/shared/CalculatorLayout";
import TimeInput from "@/components/calculator/shared/TimeInput";
import ResultTable from "@/components/calculator/shared/ResultTable";
import {
    timeToSeconds,
    validateTimeInputs,
    secondsToTimeString,
} from "@/lib/utils/calculator";
import { useToast } from "@/components/ui/use-toast";

export default function SplitTimeCalculatorPage() {
    const { toast } = useToast();
    const [distance, setDistance] = useState("12");
    const [hours, setHours] = useState("1");
    const [minutes, setMinutes] = useState("1");
    const [seconds, setSeconds] = useState("0");
    const [rows, setRows] = useState<
        { label: string; value: string; highlight?: boolean }[]
    >([]);

    const handleCalculate = () => {
        const dist = parseFloat(distance);
        const h = parseInt(hours || "0");
        const m = parseInt(minutes || "0");
        const s = parseInt(seconds || "0");

        if (!dist || dist <= 0) {
            toast({ description: "올바른 거리를 입력해주세요.", duration: 2000 });
            return;
        }
        if (!validateTimeInputs(h, m, s)) {
            toast({ description: "올바른 시간을 입력해주세요.", duration: 2000 });
            return;
        }

        const totalSec = timeToSeconds(h, m, s);
        const pacePerKm = totalSec / dist;

        // 스플릿 포인트: 1km, 5km, 10km, 15km, 20km, 21.1km, 25km, 30km + 목표거리
        const splitPoints = [1, 5, 10, 15, 20, 21.1, 25, 30].filter(
            (d) => d < dist
        );

        const resultRows: { label: string; value: string; highlight?: boolean }[] = splitPoints.map((d) => ({
            label: d === 21.1 ? "하프 (21.1km)" : `${d} km`,
            value: secondsToTimeString(pacePerKm * d),
        }));

        // 목표 거리 (마지막 행, 하이라이트)
        resultRows.push({
            label: `${dist} km`,
            value: secondsToTimeString(totalSec),
            highlight: true,
        });

        setRows(resultRows);
    };

    return (
        <CalculatorLayout title="스플릿 타임 계산기">
            {/* 목표 거리 입력 */}
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
                        min="0"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        placeholder="12"
                        className="w-full text-base font-semibold text-white bg-transparent outline-none placeholder:text-rh-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </div>

            {/* 목표 시간 */}
            <TimeInput
                label="목표 시간"
                hours={hours}
                minutes={minutes}
                seconds={seconds}
                onHoursChange={setHours}
                onMinutesChange={setMinutes}
                onSecondsChange={setSeconds}
            />

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
