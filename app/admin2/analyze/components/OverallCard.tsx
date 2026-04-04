import { memo } from "react";
import Link from "next/link";
import AdminStatBox
    from "@/app/admin2/components/ui/AdminStatBox";
import AdminProgressBar
    from "@/app/admin2/components/ui/AdminProgressBar";

interface OverallCardProps {
    totalMembers: number;
    attendedMembers: number;
    attendanceRate: number;
    year: number;
    month: number;
}

const OverallCard = memo(function OverallCard({
    totalMembers,
    attendedMembers,
    attendanceRate,
    year,
    month,
}: OverallCardProps) {
    return (
        <div
            className={
                "bg-rh-bg-surface rounded-xl"
                + " p-4 space-y-3.5"
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
                    전체 대비 출석 현황
                </h3>
                <Link
                    href={
                        "/admin2/analyze"
                        + "/overall-detail"
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
            <div className="flex gap-3">
                <AdminStatBox
                    label="전체 인원"
                    value={`${totalMembers}명`}
                />
                <AdminStatBox
                    label="참여 인원"
                    value={`${attendedMembers}명`}
                    valueColor="text-rh-accent"
                />
                <AdminStatBox
                    label="참여율"
                    value={`${attendanceRate}%`}
                    valueColor="text-rh-accent"
                />
            </div>
            <div className="space-y-2">
                <div
                    className={
                        "flex justify-between"
                        + " items-center"
                    }
                >
                    <span
                        className={
                            "text-xs"
                            + " text-rh-text-tertiary"
                        }
                    >
                        월간 출석률
                    </span>
                    <span
                        className={
                            "text-xs font-semibold"
                            + " text-rh-accent"
                        }
                    >
                        {attendanceRate}%
                    </span>
                </div>
                <AdminProgressBar
                    percent={attendanceRate}
                    height={8}
                    fillColor="bg-rh-accent"
                    trackColor="bg-rh-bg-primary"
                />
            </div>
        </div>
    );
});

export default OverallCard;
