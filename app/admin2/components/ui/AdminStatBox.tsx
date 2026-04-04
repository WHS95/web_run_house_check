import { memo } from "react";

interface AdminStatBoxProps {
    label: string;
    value: string;
    valueColor?: string;
}

const AdminStatBox = memo(function AdminStatBox({
    label,
    value,
    valueColor = "text-white",
}: AdminStatBoxProps) {
    return (
        <div
            className={
                "flex-1 flex flex-col items-center"
                + " gap-1 rounded-lg bg-rh-bg-primary p-3"
            }
        >
            <span
                className="text-[11px] text-rh-text-tertiary"
            >
                {label}
            </span>
            <span
                className={
                    `text-base font-bold ${valueColor}`
                }
            >
                {value}
            </span>
        </div>
    );
});

export default AdminStatBox;
