import type { KpiSnapshot } from '../_vm/loadHealthDashboardVM';

interface Props {
    kpi: KpiSnapshot;
}

function 증감률포맷(rate: number | null): string {
    if (rate == null) return '-';
    const pct = Math.round(rate * 100);
    if (pct === 0) return '+0%';
    return `${pct > 0 ? '+' : ''}${pct}%`;
}

function 증감색(rate: number | null): string {
    if (rate == null || rate === 0) return 'text-rh-text-secondary';
    if (rate > 0) return 'text-rh-status-success';
    return 'text-rh-status-error';
}

interface CardProps {
    label: string;
    value: number;
    sub?: string | null;
    subClassName?: string;
}

function KpiCard({ label, value, sub, subClassName }: CardProps) {
    return (
        <div className="bg-rh-bg-surface rounded-[12px] p-4 flex-1 min-w-[140px]">
            <div className="text-rh-text-secondary text-xs mb-1">{label}</div>
            <div className="text-white font-semibold text-2xl">
                {value.toLocaleString()}
            </div>
            {sub != null && (
                <div className={`text-xs mt-1 ${subClassName ?? ''}`}>
                    {sub}
                </div>
            )}
        </div>
    );
}

export default function KpiCards({ kpi }: Props) {
    return (
        <div>
            <div className="text-white font-semibold mb-2 px-1">
                오늘의 활동
            </div>
            <div className="flex gap-2 flex-wrap">
                <KpiCard
                    label="WAU (7일)"
                    value={kpi.todayWau}
                    sub={증감률포맷(kpi.wauDeltaRate)}
                    subClassName={증감색(kpi.wauDeltaRate)}
                />
                <KpiCard label="MAU (30일)" value={kpi.todayMau} />
                <KpiCard
                    label="오늘 세션"
                    value={kpi.todaySessionCount}
                />
                <KpiCard
                    label="오늘 출석"
                    value={kpi.todayAttendanceCount}
                />
            </div>
        </div>
    );
}
