import { memo } from "react";
import Link from "next/link";
import AdminProgressBar
    from "@/app/admin2/components/ui/AdminProgressBar";

interface PlaceBarData {
    locationName: string;
    participationRate: number;
}

interface PlaceBarChartProps {
    data: PlaceBarData[];
    year: number;
    month: number;
}

const FILL = [
    "bg-rh-accent",
    "bg-rh-status-success",
    "bg-rh-status-warning",
    "bg-rh-status-error",
];
const TEXT = [
    "text-rh-accent",
    "text-rh-status-success",
    "text-rh-status-warning",
    "text-rh-status-error",
];

const PlaceBarChart = memo(function PlaceBarChart({
    data,
    year,
    month,
}: PlaceBarChartProps) {
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
                    장소별 참여율
                </h3>
                <Link
                    href={
                        "/admin2/analyze/place-detail"
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
            <div className="space-y-2.5">
                {data.length > 0 ? (
                    data.map((item, idx) => (
                        <div
                            key={item.locationName}
                            className="space-y-1"
                        >
                            <div
                                className={
                                    "flex"
                                    + " justify-between"
                                    + " items-center"
                                }
                            >
                                <span
                                    className={
                                        "text-[13px]"
                                        + " text-white"
                                    }
                                >
                                    {item.locationName}
                                </span>
                                <span
                                    className={
                                        "text-[13px]"
                                        + " font-semibold"
                                        + ` ${TEXT[idx] ?? "text-rh-accent"}`
                                    }
                                >
                                    {item
                                        .participationRate
                                    }%
                                </span>
                            </div>
                            <AdminProgressBar
                                percent={
                                    item
                                        .participationRate
                                }
                                fillColor={
                                    FILL[idx]
                                    ?? "bg-rh-accent"
                                }
                            />
                        </div>
                    ))
                ) : (
                    <p
                        className={
                            "py-4 text-center"
                            + " text-sm"
                            + " text-rh-text-secondary"
                        }
                    >
                        데이터가 없습니다.
                    </p>
                )}
            </div>
        </div>
    );
});

export default PlaceBarChart;
