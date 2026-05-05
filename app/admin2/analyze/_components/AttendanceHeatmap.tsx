import type { HeatmapCell } from '../_vm/loadHealthDashboardVM';

interface Props {
    heatmap: HeatmapCell[];
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * 출석 히트맵 — 요일(7) × 시간대(24)
 * 색 강도는 max 대비 비율로 계산.
 */
export default function AttendanceHeatmap({ heatmap }: Props) {
    const max = heatmap.reduce(
        (acc, c) => (c.count > acc ? c.count : acc),
        0,
    );

    function 셀색상(count: number): string {
        if (max === 0 || count === 0) return 'bg-rh-bg-muted/30';
        const ratio = count / max;
        if (ratio < 0.25) return 'bg-rh-accent/20';
        if (ratio < 0.5) return 'bg-rh-accent/40';
        if (ratio < 0.75) return 'bg-rh-accent/60';
        return 'bg-rh-accent';
    }

    function 셀가져오기(day: number, hour: number): number {
        return (
            heatmap.find((c) => c.day === day && c.hour === hour)
                ?.count ?? 0
        );
    }

    return (
        <div>
            <div className="text-white font-semibold mb-2 px-1">
                출석 히트맵 (최근 30일)
            </div>
            <div className="bg-rh-bg-surface rounded-[12px] p-3 overflow-x-auto">
                <div className="min-w-[420px]">
                    {/* 시간 헤더 */}
                    <div className="flex gap-[2px] mb-1 ml-7">
                        {Array.from({ length: 24 }).map((_, h) => (
                            <div
                                key={h}
                                className="w-3 h-3 text-rh-text-tertiary text-[8px] flex items-center justify-center"
                            >
                                {h % 6 === 0 ? h : ''}
                            </div>
                        ))}
                    </div>
                    {DAY_ORDER.map((day, i) => (
                        <div
                            key={day}
                            className="flex items-center gap-[2px] mb-[2px]"
                        >
                            <div className="w-6 text-rh-text-tertiary text-[10px] text-right pr-1">
                                {DAY_LABELS[i]}
                            </div>
                            {Array.from({ length: 24 }).map((_, hour) => {
                                const count = 셀가져오기(day, hour);
                                return (
                                    <div
                                        key={hour}
                                        title={`${DAY_LABELS[i]} ${hour}시 — ${count}건`}
                                        className={`w-3 h-3 rounded-sm ${셀색상(count)}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
