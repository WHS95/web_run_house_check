"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import CalculatorLayout from "@/components/calculator/shared/CalculatorLayout";
import {
    calculateMaxHeartRate,
    calculateHeartRateZones,
    type HeartRateZone,
} from "@/lib/utils/calculator";
import { useToast } from "@/components/ui/use-toast";

// 블루 톤 존 색상 (CLAUDE.md 규칙 준수 — 초록/노랑/빨강 금지)
const ZONE_COLORS: Record<number, { bg: string; accent: string }> = {
    1: { bg: "#1A2A3A", accent: "#8BB5F5" },
    2: { bg: "#1A2A3A", accent: "#669FF2" },
    3: { bg: "#1A2535", accent: "#5580C0" },
    4: { bg: "#1A2030", accent: "#3E6496" },
    5: { bg: "#1D2530", accent: "#4C525E" },
};

export default function HeartRateCalculatorPage() {
    const { toast } = useToast();
    const [age, setAge] = useState("");
    const [maxHR, setMaxHR] = useState<number | null>(null);
    const [zones, setZones] = useState<HeartRateZone[]>([]);

    const handleCalculate = () => {
        const ageNum = parseInt(age);
        if (!ageNum || ageNum <= 0 || ageNum > 120) {
            toast({
                description: "올바른 나이를 입력해주세요 (1-120).",
                duration: 2000,
            });
            return;
        }
        setMaxHR(calculateMaxHeartRate(ageNum));
        setZones(calculateHeartRateZones(ageNum));
    };

    return (
        <CalculatorLayout title="심박수 존 계산기">
            {/* 나이 입력 */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>
                    나이 (세)
                </span>
                <div
                    className="flex items-center h-12 rounded-lg border px-4"
                    style={{ backgroundColor: "#2B3644", borderColor: "#374151" }}
                >
                    <input
                        type="number"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="20"
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

            {/* 결과 */}
            {maxHR && zones.length > 0 && (
                <div className="space-y-3">
                    {/* 트레이닝 존 타이틀 */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-base font-semibold text-white">
                            트레이닝 존
                        </span>
                        <Info size={16} style={{ color: "#64748B" }} />
                    </div>

                    {/* 최대 심박수 카드 */}
                    <div
                        className="rounded-xl p-4 space-y-1"
                        style={{ backgroundColor: "#2B3644" }}
                    >
                        <span
                            className="text-[13px] font-medium"
                            style={{ color: "#94A3B8" }}
                        >
                            예상 최대 심박수
                        </span>
                        <div className="flex items-end gap-1.5">
                            <span className="text-[32px] font-bold text-white leading-none">
                                {maxHR}
                            </span>
                            <span
                                className="text-sm font-medium mb-1"
                                style={{ color: "#64748B" }}
                            >
                                bpm
                            </span>
                        </div>
                    </div>

                    {/* 존 카드들 */}
                    {zones.map((zone) => {
                        const colors = ZONE_COLORS[zone.zone];
                        return (
                            <div
                                key={zone.zone}
                                className="flex items-center gap-3 rounded-xl px-4 py-3.5"
                                style={{ backgroundColor: colors.bg }}
                            >
                                {/* 넘버 원 */}
                                <div
                                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                                    style={{ backgroundColor: colors.accent }}
                                >
                                    <span
                                        className="text-[13px] font-bold"
                                        style={{ color: "#1D2530" }}
                                    >
                                        {zone.zone}
                                    </span>
                                </div>

                                {/* 텍스트 */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold text-white">
                                        {zone.name}
                                    </span>
                                    <p
                                        className="text-[11px] mt-0.5"
                                        style={{ color: "#94A3B8" }}
                                    >
                                        {zone.description}
                                    </p>
                                </div>

                                {/* 범위 값 */}
                                <span
                                    className="text-sm font-bold shrink-0"
                                    style={{ color: colors.accent }}
                                >
                                    {zone.min}-{zone.max}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </CalculatorLayout>
    );
}
