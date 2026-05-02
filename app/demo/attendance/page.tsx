"use client";

import { useState } from "react";
import { Calendar, ChevronDown, MapPin, Timer, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    DEMO_LOCATIONS,
    DEMO_EXERCISES,
    DEMO_CREW,
    DEMO_MEMBERS,
} from "@/lib/demo/fixtures";

/* 24시간 10분 단위 시간 옵션 (앱과 동일) */
const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
    ["00", "10", "20", "30", "40", "50"].map((m) => ({
        value: `${h.toString().padStart(2, "0")}:${m}`,
        label: `${h.toString().padStart(2, "0")}:${m}`,
    })),
).flat();

const todayStr = () => {
    // 데모는 결정론적 — 시스템 컨텍스트 기준일
    return "2026-04-26";
};

const initialTime = () => "19:00";

export default function DemoAttendancePage() {
    const [date, setDate] = useState(todayStr());
    const [time, setTime] = useState(initialTime());
    const [locationId, setLocationId] = useState(DEMO_LOCATIONS[0].id);
    const [exerciseId, setExerciseId] = useState(DEMO_EXERCISES[0].id);
    const [isHost, setIsHost] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const userName = DEMO_MEMBERS[2].name; // 이도현 (체험자 역할)

    const handleSubmit = () => {
        setSubmitted(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2400);
    };

    const handleReset = () => {
        setSubmitted(false);
    };

    if (submitted) {
        return (
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                <DemoHeader title="출석 체크" />
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rh-accent/15">
                        <Check className="h-10 w-10 text-rh-accent" />
                    </div>
                    <h2 className="mt-5 text-[20px] font-bold text-white">
                        출석 완료
                    </h2>
                    <p className="mt-2 text-[14px] text-rh-text-secondary">
                        {userName}님, {date} {time}
                        <br />
                        {DEMO_LOCATIONS.find((l) => l.id === locationId)?.name}에서 만나요.
                    </p>
                    <div className="mt-6 w-full max-w-xs space-y-2 rounded-xl bg-rh-bg-surface p-4 text-left">
                        <Row label="크루" value={DEMO_CREW.name} />
                        <Row
                            label="운동"
                            value={DEMO_EXERCISES.find((e) => e.id === exerciseId)?.name ?? ""}
                        />
                        <Row label="개설자 여부" value={isHost ? "예" : "아니오"} />
                    </div>
                    <button
                        onClick={handleReset}
                        className="mt-8 text-[13px] text-rh-text-tertiary underline-offset-4 hover:text-white hover:underline"
                    >
                        다시 입력하기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <DemoHeader title="출석 체크" />

            <div className="flex-1 px-4 pt-5 space-y-5">
                <Field label="날짜" icon={Calendar}>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-transparent text-[15px] text-white outline-none [color-scheme:dark]"
                    />
                </Field>

                <Field label="시간" icon={Timer}>
                    <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full appearance-none bg-transparent text-[15px] text-white outline-none"
                    >
                        {TIME_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value} className="bg-rh-bg-surface">
                                {t.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none h-5 w-5 text-rh-text-tertiary" />
                </Field>

                <Field label="장소" icon={MapPin}>
                    <select
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        className="w-full appearance-none bg-transparent text-[15px] text-white outline-none"
                    >
                        {DEMO_LOCATIONS.map((l) => (
                            <option key={l.id} value={l.id} className="bg-rh-bg-surface">
                                {l.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none h-5 w-5 text-rh-text-tertiary" />
                </Field>

                <div>
                    <p className="mb-2 text-[12px] text-rh-text-tertiary">운동 종류</p>
                    <div className="flex flex-wrap gap-2">
                        {DEMO_EXERCISES.map((e) => (
                            <button
                                key={e.id}
                                onClick={() => setExerciseId(e.id)}
                                className={`rounded-full px-4 py-2 text-[13px] transition ${
                                    exerciseId === e.id
                                        ? "bg-rh-accent text-white"
                                        : "bg-rh-bg-surface text-rh-text-secondary"
                                }`}
                            >
                                {e.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-rh-bg-surface px-4 py-3">
                    <div>
                        <p className="text-[14px] text-white">개설자로 참여</p>
                        <p className="mt-0.5 text-[11px] text-rh-text-tertiary">
                            오늘 모임을 만든 분만 켜주세요
                        </p>
                    </div>
                    <Switch checked={isHost} onCheckedChange={setIsHost} />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-rh-accent/30 bg-rh-accent/10 px-4 py-3">
                    <MapPin className="h-4 w-4 text-rh-accent" />
                    <p className="text-[12px] text-rh-text-secondary">
                        위치 인증 완료 — 반포 한강공원 (12m)
                    </p>
                </div>
            </div>

            <div className="sticky bottom-0 px-4 pt-3 pb-4 bg-gradient-to-t from-rh-bg-primary via-rh-bg-primary to-transparent">
                <button
                    onClick={handleSubmit}
                    className="h-[52px] w-full rounded-xl bg-rh-accent text-[15px] font-semibold text-white shadow-lg shadow-rh-accent/20 transition hover:bg-rh-accent-hover active:scale-[0.99]"
                >
                    출석 체크
                </button>
            </div>

            {showToast && (
                <div className="pointer-events-none fixed inset-x-0 bottom-24 flex justify-center px-4">
                    <div className="rounded-full bg-black/80 px-4 py-2 text-[12px] text-white shadow-xl">
                        체험 모드 — 실제 출석은 기록되지 않았어요
                    </div>
                </div>
            )}
        </div>
    );
}

function DemoHeader({ title }: { title: string }) {
    return (
        <header className="sticky top-0 z-50 bg-rh-bg-surface/72 backdrop-blur-[20px] border-b border-rh-border">
            <div className="flex h-14 items-center px-4 pt-safe">
                <h1 className="text-[18px] font-semibold text-white">{title}</h1>
            </div>
        </header>
    );
}

function Field({
    label,
    icon: Icon,
    children,
}: {
    label: string;
    icon: typeof Calendar;
    children: React.ReactNode;
}) {
    return (
        <div>
            <p className="mb-2 text-[12px] text-rh-text-tertiary">{label}</p>
            <div className="flex items-center gap-3 rounded-xl bg-rh-bg-surface px-4 py-3">
                <Icon className="h-5 w-5 shrink-0 text-rh-accent" />
                {children}
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-[13px]">
            <span className="text-rh-text-tertiary">{label}</span>
            <span className="font-medium text-white">{value}</span>
        </div>
    );
}
