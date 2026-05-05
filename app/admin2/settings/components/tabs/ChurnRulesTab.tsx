"use client";

import {
    memo,
    useCallback,
    useMemo,
    useState,
    useTransition,
} from "react";
import {
    ChurnRulesSchema,
    type ChurnRulesInput,
} from "@/lib/domain/crew-settings/validators";
import { updateCrewChurnRulesAction } from "../../actions";

interface ChurnRulesTabProps {
    crewId: string;
    initial: ChurnRulesInput;
}

interface FieldDef {
    key: keyof ChurnRulesInput;
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    isFloat?: boolean;
}

const FIELDS: FieldDef[] = [
    {
        key: "churn_baseline_weeks",
        label: "이탈 기준선 주 수",
        description: "이전 N주 동안의 출석을 기준선으로 본다",
        min: 1,
        max: 26,
        step: 1,
        unit: "주",
    },
    {
        key: "churn_min_baseline_rate",
        label: "기준선 최소 출석률",
        description: "기준선 주들 중 출석률이 이 이상이어야 위험 평가 대상",
        min: 0,
        max: 1,
        step: 0.05,
        unit: "",
        isFloat: true,
    },
    {
        key: "churn_observation_weeks",
        label: "이탈 관찰 주 수",
        description: "최근 N주 동안 출석 0이면 이탈 위험으로 판정",
        min: 1,
        max: 12,
        step: 1,
        unit: "주",
    },
    {
        key: "onboarding_window_weeks",
        label: "온보딩 윈도우",
        description: "신규 가입 후 평가하는 기간",
        min: 1,
        max: 26,
        step: 1,
        unit: "주",
    },
    {
        key: "onboarding_min_count",
        label: "온보딩 최소 출석",
        description: "윈도우 내 출석 N회 미만이면 온보딩 위험",
        min: 0,
        max: 50,
        step: 1,
        unit: "회",
    },
];

const ChurnRulesTab = memo(function ChurnRulesTab({
    crewId,
    initial,
}: ChurnRulesTabProps) {
    const [draft, setDraft] = useState<ChurnRulesInput>(initial);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<
        { kind: "ok" | "err"; message: string } | null
    >(null);

    const isValid = useMemo(
        () => ChurnRulesSchema.safeParse(draft).success,
        [draft],
    );

    const handleChange = useCallback(
        (key: keyof ChurnRulesInput, isFloat: boolean) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;
                const n = Number(raw);
                if (!Number.isFinite(n)) return;
                setDraft((prev) => ({
                    ...prev,
                    [key]: isFloat ? n : Math.trunc(n),
                }));
            },
        [],
    );

    const handleSubmit = useCallback(() => {
        setFeedback(null);
        startTransition(async () => {
            const result = await updateCrewChurnRulesAction({
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
            <section className="bg-rh-bg-surface rounded-2xl p-4 space-y-4">
                <header>
                    <h2 className="text-[15px] font-semibold text-white">
                        이탈 / 온보딩 룰
                    </h2>
                    <p className="text-[12px] text-rh-text-secondary mt-1">
                        대시보드에서 위험 멤버를 가려내는 임계값입니다.
                    </p>
                </header>
                <div className="space-y-4">
                    {FIELDS.map((f) => {
                        const value = draft[f.key];
                        return (
                            <div key={f.key} className="space-y-1">
                                <label
                                    htmlFor={f.key}
                                    className="block text-[13px] font-medium text-white"
                                >
                                    {f.label}
                                </label>
                                <p className="text-[11px] text-rh-text-tertiary">
                                    {f.description}
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        id={f.key}
                                        name={f.key}
                                        type="number"
                                        inputMode={
                                            f.isFloat ? "decimal" : "numeric"
                                        }
                                        min={f.min}
                                        max={f.max}
                                        step={f.step}
                                        value={value}
                                        onChange={handleChange(
                                            f.key,
                                            !!f.isFloat,
                                        )}
                                        className="flex-1 bg-rh-bg-inset text-white text-[14px] rounded-lg px-3 py-2 border border-rh-border focus:outline-none focus:border-rh-accent"
                                    />
                                    {f.unit && (
                                        <span className="text-[12px] text-rh-text-secondary w-8">
                                            {f.unit}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-rh-text-muted">
                                    범위: {f.min} ~ {f.max} {f.unit}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

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

export default ChurnRulesTab;
