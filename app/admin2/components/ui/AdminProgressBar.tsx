import { memo } from "react";

interface AdminProgressBarProps {
    percent: number;
    height?: number;
    fillColor?: string;
    trackColor?: string;
}

const AdminProgressBar = memo(function AdminProgressBar({
    percent,
    height = 6,
    fillColor = "bg-rh-accent",
    trackColor = "bg-rh-bg-inset",
}: AdminProgressBarProps) {
    return (
        <div
            className={`w-full rounded-[3px] ${trackColor}`}
            style={{ height }}
        >
            <div
                className={
                    `h-full rounded-[3px] ${fillColor}`
                    + " transition-all duration-300"
                }
                style={{
                    width: `${Math.min(percent, 100)}%`,
                }}
            />
        </div>
    );
});

export default AdminProgressBar;
