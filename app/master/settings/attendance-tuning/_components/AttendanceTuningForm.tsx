'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import type { AttendanceTuningVM } from '../_vm/loadSettingsViewModel';
import type { SystemSettings } from '@/lib/domain/system-settings/types';
import { SystemSettingsSchema } from '@/lib/domain/system-settings/validators';
import { 위험변경_여부 } from '@/lib/domain/system-settings/policies';
import { updateAttendanceTuningAction } from '../actions';

interface FieldDef {
    key: keyof SystemSettings;
    label: string;
    description: string;
    min: number;
    max: number;
    unit: string;
}

const FIELDS: FieldDef[] = [
    {
        key: 'session_window_minutes',
        label: '세션 시간 윈도우',
        description: '출석 시각이 ±N분 안이면 같은 세션',
        min: 1,
        max: 120,
        unit: '분',
    },
    {
        key: 'session_radius_m',
        label: '세션 거리 반경',
        description: '세션 중심에서 ±N미터 안이면 같은 세션',
        min: 10,
        max: 2000,
        unit: 'm',
    },
    {
        key: 'session_close_minutes',
        label: '세션 자동 종료',
        description: '마지막 출석 후 N분 경과 시 종료',
        min: 5,
        max: 360,
        unit: '분',
    },
    {
        key: 'auto_label_min_session_count',
        label: '라벨 자동 추천 임계',
        description: '동일 위치에서 N회 이상 누적된 라벨만 추천',
        min: 1,
        max: 100,
        unit: '회',
    },
];

interface Props {
    vm: AttendanceTuningVM;
}

export function AttendanceTuningForm({ vm }: Props) {
    const [draft, setDraft] = useState<SystemSettings>(vm.settings);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<
        { kind: 'ok' | 'err'; message: string } | null
    >(null);

    const isDirty = useMemo(() => {
        return (
            draft.session_window_minutes !== vm.settings.session_window_minutes ||
            draft.session_radius_m !== vm.settings.session_radius_m ||
            draft.session_close_minutes !== vm.settings.session_close_minutes ||
            draft.auto_label_min_session_count !==
                vm.settings.auto_label_min_session_count
        );
    }, [draft, vm.settings]);

    const isRisky = useMemo(
        () => 위험변경_여부(vm.settings, draft),
        [draft, vm.settings],
    );

    const isValid = useMemo(
        () => SystemSettingsSchema.safeParse(draft).success,
        [draft],
    );

    // 빈 입력은 직전 값을 유지 (0으로 떨어뜨리면 즉시 범위 오류 메시지가 나는 UX 문제).
    // 사용자는 백스페이스로 지우고 새 숫자를 타이핑하는 패턴이 흔함.
    const handleChange = useCallback(
        (key: keyof SystemSettings) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;
                if (raw === '') return;
                const n = Number(raw);
                if (!Number.isFinite(n)) return;
                setDraft((prev) => ({
                    ...prev,
                    [key]: Math.trunc(n),
                }));
            },
        [],
    );

    // SSR/CSR 시각 표기 차이로 인한 hydration mismatch 방지.
    // mounted 전에는 ISO 원본을, mounted 후에는 ko-KR 포맷을 사용.
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!isValid) {
                setFeedback({
                    kind: 'err',
                    message: '입력값이 허용 범위를 벗어났습니다.',
                });
                return;
            }
            if (isRisky) {
                const ok = window.confirm(
                    '임계값을 절반 미만으로 줄이면 진행 중인 세션이 분리될 수 있습니다.\n그래도 저장하시겠습니까?',
                );
                if (!ok) return;
            }
            startTransition(async () => {
                const result = await updateAttendanceTuningAction(draft);
                setFeedback({
                    kind: result.success ? 'ok' : 'err',
                    message: result.message,
                });
            });
        },
        [draft, isRisky, isValid],
    );

    return (
        <form onSubmit={handleSubmit} className="px-4 pt-4 pb-6 space-y-4">
            <section className="bg-rh-bg-surface rounded-2xl p-4 space-y-4">
                <header>
                    <h2 className="text-[15px] font-semibold text-white">
                        클러스터링 임계값
                    </h2>
                    <p className="text-[12px] text-rh-text-secondary mt-1">
                        모든 크루에 적용되는 시스템 전역 값. 변경 시 다음 출석부터
                        즉시 반영됩니다.
                    </p>
                </header>

                <div className="space-y-4">
                    {FIELDS.map((f) => {
                        const value = draft[f.key];
                        const out = value < f.min || value > f.max;
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
                                        inputMode="numeric"
                                        min={f.min}
                                        max={f.max}
                                        value={value}
                                        onChange={handleChange(f.key)}
                                        className="flex-1 bg-rh-bg-inset text-white text-[14px] rounded-lg px-3 py-2 border border-rh-border focus:outline-none focus:border-rh-accent"
                                    />
                                    <span className="text-[12px] text-rh-text-secondary w-8">
                                        {f.unit}
                                    </span>
                                </div>
                                <p className="text-[11px] text-rh-text-muted">
                                    범위: {f.min} ~ {f.max} {f.unit}
                                </p>
                                {out && (
                                    <p className="text-[11px] text-rh-status-error">
                                        허용 범위를 벗어났습니다.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {isRisky && (
                    <div className="rounded-lg border border-rh-status-warning/40 bg-rh-status-warning/10 p-3">
                        <p className="text-[12px] text-rh-status-warning">
                            현재 값을 절반 미만으로 줄이고 있어요. 진행 중인 세션이
                            분리될 수 있습니다.
                        </p>
                    </div>
                )}

                {feedback && (
                    <p
                        className={`text-[12px] ${
                            feedback.kind === 'ok'
                                ? 'text-rh-status-success'
                                : 'text-rh-status-error'
                        }`}
                    >
                        {feedback.message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={!isDirty || !isValid || isPending}
                    className="w-full h-12 rounded-xl bg-rh-accent text-white text-[14px] font-semibold disabled:bg-rh-bg-muted disabled:text-rh-text-tertiary"
                >
                    {isPending ? '저장 중...' : '저장하기'}
                </button>
            </section>

            <section className="bg-rh-bg-surface rounded-2xl p-4">
                <header className="mb-3">
                    <h2 className="text-[15px] font-semibold text-white">
                        변경 이력
                    </h2>
                    <p className="text-[12px] text-rh-text-secondary mt-1">
                        최근 20건
                    </p>
                </header>

                {vm.history.length === 0 ? (
                    <p className="text-[12px] text-rh-text-tertiary">
                        아직 변경 이력이 없습니다.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {vm.history.map((h, idx) => (
                            <li
                                key={`${h.key}-${h.updated_at}-${idx}`}
                                className="bg-rh-bg-inset rounded-lg p-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-medium text-white">
                                        {h.key}
                                    </span>
                                    <span className="text-[11px] text-rh-text-tertiary">
                                        {h.updated_by_name ?? '시스템'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[12px] mt-1">
                                    <span className="text-rh-text-secondary">
                                        {String(h.old_value)}
                                    </span>
                                    <span className="text-rh-text-tertiary">
                                        →
                                    </span>
                                    <span className="text-rh-accent">
                                        {String(h.new_value)}
                                    </span>
                                </div>
                                <time
                                    className="text-[11px] text-rh-text-muted block mt-1"
                                    suppressHydrationWarning
                                >
                                    {mounted
                                        ? new Date(h.updated_at).toLocaleString(
                                              'ko-KR',
                                          )
                                        : h.updated_at.slice(0, 16).replace(
                                              'T',
                                              ' ',
                                          )}
                                </time>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </form>
    );
}
