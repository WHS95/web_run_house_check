"use client";

import { memo, useCallback, useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminLabeledInput } from "@/app/admin2/components/ui";
import {
    TimeWindowSchema,
    type TimeWindowInput,
} from "@/lib/domain/crew-settings/validators";
import type {
    ActiveHoursSlot,
    DayOfWeek,
    TimeWindowMode,
} from "@/lib/domain/crew-settings/types";
import { updateCrewTimeWindowAction } from "../../actions";

interface TimeWindowTabProps {
    crewId: string;
    initialMode: TimeWindowMode;
    initialActiveHours: ActiveHoursSlot[] | null;
}

const MODE_OPTIONS: {
    value: TimeWindowMode;
    label: string;
    description: string;
}[] = [
    {
        value: "cluster_first",
        label: "군집 우선",
        description: "최근 활성 세션 근처면 무조건 허용. 그 외는 슬롯 적용.",
    },
    {
        value: "active_hours",
        label: "활성 시간대만",
        description: "지정된 요일/시간대 안에서만 출석 가능.",
    },
    {
        value: "anytime",
        label: "항상 허용",
        description: "24시간 출석 가능 (제한 없음).",
    },
];

const DAY_LABEL: Record<DayOfWeek, string> = {
    sun: "일",
    mon: "월",
    tue: "화",
    wed: "수",
    thu: "목",
    fri: "금",
    sat: "토",
};

const DAY_ORDER: DayOfWeek[] = [
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun",
];

const TimeWindowTab = memo(function TimeWindowTab({
    crewId,
    initialMode,
    initialActiveHours,
}: TimeWindowTabProps) {
    const [mode, setMode] = useState<TimeWindowMode>(initialMode);
    const [slots, setSlots] = useState<ActiveHoursSlot[]>(
        initialActiveHours ?? [],
    );
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<
        { kind: "ok" | "err"; message: string } | null
    >(null);

    const draft: TimeWindowInput = useMemo(
        () => ({
            time_window_mode: mode,
            active_hours: mode === "anytime" ? null : slots,
        }),
        [mode, slots],
    );

    const isValid = useMemo(
        () => TimeWindowSchema.safeParse(draft).success,
        [draft],
    );

    const handleAddSlot = useCallback(() => {
        setSlots((prev) => [
            ...prev,
            { day: "mon", from: "18:00", to: "22:00" },
        ]);
    }, []);

    const handleRemoveSlot = useCallback((idx: number) => {
        setSlots((prev) => prev.filter((_, i) => i !== idx));
    }, []);

    const handleUpdateSlot = useCallback(
        (idx: number, patch: Partial<ActiveHoursSlot>) => {
            setSlots((prev) =>
                prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
            );
        },
        [],
    );

    const handleSubmit = useCallback(() => {
        setFeedback(null);
        startTransition(async () => {
            const result = await updateCrewTimeWindowAction({
                crewId,
                input: draft,
            });
            setFeedback({
                kind: result.success ? "ok" : "err",
                message: result.message ?? (result.success ? "저장됨" : "실패"),
            });
        });
    }, [crewId, draft]);

    return (
        <div className="space-y-4">
            <section className="bg-rh-bg-surface rounded-2xl p-4 space-y-3">
                <h2 className="text-[15px] font-semibold text-white">
                    시간 윈도우 모드
                </h2>
                <p className="text-[12px] text-rh-text-secondary">
                    출석이 가능한 시간대를 정의합니다.
                </p>
                <div className="space-y-2">
                    {MODE_OPTIONS.map((opt) => (
                        <label
                            key={opt.value}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${
                                mode === opt.value
                                    ? "border-rh-accent bg-rh-accent/10"
                                    : "border-rh-border bg-rh-bg-inset"
                            }`}
                        >
                            <input
                                type="radio"
                                name="time_window_mode"
                                value={opt.value}
                                checked={mode === opt.value}
                                onChange={() => setMode(opt.value)}
                                className="mt-1 accent-rh-accent"
                            />
                            <div className="flex-1">
                                <div className="text-[13px] font-medium text-white">
                                    {opt.label}
                                </div>
                                <div className="text-[11px] text-rh-text-secondary mt-0.5">
                                    {opt.description}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </section>

            {mode !== "anytime" && (
                <section className="bg-rh-bg-surface rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[15px] font-semibold text-white">
                            활성 시간대
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddSlot}
                            className="flex items-center gap-1 text-[12px] text-rh-accent"
                        >
                            <Plus className="w-4 h-4" />
                            슬롯 추가
                        </button>
                    </div>
                    <p className="text-[12px] text-rh-text-secondary">
                        요일 + 시작/종료 시각을 지정하세요. 비워두면 제한 없음으로
                        간주됩니다.
                    </p>

                    {slots.length === 0 ? (
                        <p className="text-[12px] text-rh-text-tertiary py-4 text-center">
                            슬롯이 없습니다. 위에서 추가하세요.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {slots.map((slot, idx) => (
                                <li
                                    key={idx}
                                    className="bg-rh-bg-inset rounded-xl p-3 space-y-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={slot.day}
                                            onChange={(e) =>
                                                handleUpdateSlot(idx, {
                                                    day: e.target
                                                        .value as DayOfWeek,
                                                })
                                            }
                                            className="bg-rh-bg-surface text-white text-[13px] rounded-lg px-2 py-1.5 border border-rh-border focus:outline-none focus:border-rh-accent"
                                        >
                                            {DAY_ORDER.map((d) => (
                                                <option key={d} value={d}>
                                                    {DAY_LABEL[d]}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveSlot(idx)
                                            }
                                            className="ml-auto text-rh-text-tertiary hover:text-rh-status-error"
                                            aria-label="슬롯 삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <AdminLabeledInput
                                            label="시작"
                                            type="time"
                                            value={slot.from}
                                            onChange={(v) =>
                                                handleUpdateSlot(idx, {
                                                    from: v,
                                                })
                                            }
                                        />
                                        <AdminLabeledInput
                                            label="종료"
                                            type="time"
                                            value={slot.to}
                                            onChange={(v) =>
                                                handleUpdateSlot(idx, {
                                                    to: v,
                                                })
                                            }
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {feedback && (
                <p
                    className={`text-[12px] ${
                        feedback.kind === "ok"
                            ? "text-rh-status-success"
                            : "text-rh-status-error"
                    }`}
                >
                    {feedback.message}
                </p>
            )}

            <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || isPending}
                className="w-full h-12 rounded-xl bg-rh-accent text-white text-[14px] font-semibold disabled:bg-rh-bg-muted disabled:text-rh-text-tertiary"
            >
                {isPending ? "저장 중..." : "저장하기"}
            </button>
        </div>
    );
});

export default TimeWindowTab;
