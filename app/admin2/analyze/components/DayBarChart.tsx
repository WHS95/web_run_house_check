import { memo } from "react";
import Link from "next/link";

interface DayBarData {
    dayName: string;
    shortName: string;
    participationRate: number;
}

interface DayBarChartProps {
    data: DayBarData[];
    year: number;
    month: number;
}

function getBarColor(
    rate: number,
    maxRate: number,
): string {
    if (maxRate === 0) return "bg-rh-status-error";
    const ratio = rate / maxRate;
    if (ratio >= 0.8) return "bg-rh-accent";
    if (ratio >= 0.5) return "bg-rh-status-success";
    if (ratio >= 0.3) return "bg-rh-status-warning";
    return "bg-rh-status-error";
}

const DayBarChart = memo(function DayBarChart({
    data,
    year,
    month,
}: DayBarChartProps) {
    const maxRate = Math.max(
        ...data.map((d) => d.participationRate),
        1,
    );

    return (
        <div
            className={
                "bg-rh-bg-surface rounded-xl"
                + " p-4 space-y-3"
            }
        >
            <div
                className={
                    "flex items-center"
                    + " justify-between"
                }
            >
                <h3
                    className={
                        "text-[15px] font-semibold"
                        + " text-white"
                    }
                >
                    요일별 참여율
                </h3>
                <Link
                    href={
                        "/admin2/analyze/day-detail"
                        + `?year=${year}`
                        + `&month=${month}`
                    }
                    className={
                        "text-xs"
                        + " text-rh-text-tertiary"
                    }
                >
                    상세
                </Link>
            </div>
            <div
                className={
                    "flex items-end"
                    + " gap-1.5 h-[120px]"
                }
            >
                {data.map((d) => {
                    const barH =
                        maxRate > 0
                            ? Math.max(
                                  (d.participationRate
                                      / maxRate)
                                      * 108,
                                  4,
                              )
                            : 4;
                    return (
                        <div
                            key={d.shortName}
                            className={
                                "flex-1 flex"
                                + " flex-col"
                                + " items-center"
                                + " justify-end"
                                + " gap-1 h-full"
                            }
                        >
                            <div
                                className={
                                    "w-full"
                                    + " rounded-t"
                                    + ` ${getBarColor(
                                        d.participationRate,
                                        maxRate,
                                    )}`
                                }
                                style={{
                                    height: barH,
                                }}
                            />
                            <span
                                className={
                                    "text-[10px]"
                                    + " text-rh-text-tertiary"
                                }
                            >
                                {d.shortName}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default DayBarChart;
