interface KpiCardProps {
    label: string;
    value: number;
    highlight?: boolean;
}

const formatter = new Intl.NumberFormat("ko-KR");

export default function KpiCard({
    label,
    value,
    highlight = false,
}: KpiCardProps) {
    return (
        <div
            className={
                "rounded-xl bg-rh-bg-surface px-4 py-4 " +
                (highlight ? "ring-1 ring-rh-accent" : "")
            }
        >
            <p className="text-[12px] text-rh-text-secondary">
                {label}
            </p>
            <p
                className={
                    "mt-1 text-[22px] font-bold " +
                    (highlight
                        ? "text-rh-accent"
                        : "text-white")
                }
            >
                {formatter.format(value)}
            </p>
        </div>
    );
}
