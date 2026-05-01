import type { CrewActivityDay } from "@/lib/domain/master/types";

interface DailyAttendanceChartProps {
    days: CrewActivityDay[];
    totalDays: number;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * KST 기준 오늘부터 N일 전까지의 ISO date 문자열 (YYYY-MM-DD) 배열을
 * 과거 → 현재 순으로 반환.
 *
 * RPC가 (timestamp AT TIME ZONE 'Asia/Seoul')::DATE 로 반환하므로
 * 동일하게 KST date로 정렬해야 lookup이 일치.
 */
function buildKstDateRange(totalDays: number): string[] {
    const nowKstMs = Date.now() + KST_OFFSET_MS;
    const out: string[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
        const ms = nowKstMs - i * 24 * 60 * 60 * 1000;
        const d = new Date(ms);
        // d는 UTC 기준이지만 ms 자체가 KST 시각이라 UTC getter로 KST 날짜를 얻음
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        out.push(`${y}-${m}-${day}`);
    }
    return out;
}

const labelDateFormatter = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Seoul",
});

function formatLabel(isoDate: string): string {
    // isoDate는 KST 기준 YYYY-MM-DD. UTC midnight으로 파싱한 뒤 KST 포맷.
    const d = new Date(`${isoDate}T00:00:00+09:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
    return labelDateFormatter.format(d);
}

export default function DailyAttendanceChart({
    days,
    totalDays,
}: DailyAttendanceChartProps) {
    const range = buildKstDateRange(totalDays);
    const lookup = new Map<string, number>();
    for (const d of days) {
        lookup.set(d.date, d.count);
    }

    const filled = range.map((date) => ({
        date,
        count: lookup.get(date) ?? 0,
    }));

    const max = filled.reduce((acc, d) => Math.max(acc, d.count), 0);
    const totalCount = filled.reduce((acc, d) => acc + d.count, 0);

    if (totalCount === 0) {
        return (
            <div className="rounded-xl bg-rh-bg-surface px-4 py-8 text-center">
                <p className="text-sm text-rh-text-tertiary">
                    출석 기록이 없습니다
                </p>
            </div>
        );
    }

    // 막대 표시: 7개 간격으로 라벨, 그 외엔 빈 라벨
    const labelEvery = Math.max(1, Math.floor(totalDays / 6));

    return (
        <div className="rounded-xl bg-rh-bg-surface p-4">
            <div className="flex items-end gap-[3px] h-20">
                {filled.map((d, idx) => {
                    const ratio = max === 0 ? 0 : d.count / max;
                    // 최소 높이 2px (시각적 베이스라인)
                    const heightPct = d.count === 0 ? 4 : 4 + ratio * 96;
                    return (
                        <div
                            key={d.date}
                            className="flex-1 min-w-0 flex items-end"
                            title={`${d.date}: ${d.count}회`}
                            aria-label={`${d.date} ${d.count}회`}
                        >
                            <div
                                className={
                                    "w-full rounded-sm " +
                                    (d.count === 0
                                        ? "bg-rh-bg-muted/40"
                                        : "bg-rh-accent")
                                }
                                style={{ height: `${heightPct}%` }}
                            />
                            {idx === -1 ? null : null}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-rh-text-tertiary">
                {filled.map((d, idx) => (
                    <span key={d.date} className="flex-1 text-center">
                        {idx % labelEvery === 0 ? formatLabel(d.date) : ""}
                    </span>
                ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-rh-border">
                <span className="text-[12px] text-rh-text-secondary">
                    총 출석
                </span>
                <span className="text-[14px] font-semibold text-white">
                    {totalCount}회
                </span>
            </div>
        </div>
    );
}
