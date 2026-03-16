"use client";

export default function DashboardStatCards({
    totalMembers,
    monthlyParticipationCount,
    monthlyHostCount,
}: {
    totalMembers: number;
    monthlyParticipationCount: number;
    monthlyHostCount: number;
}) {
    const cards = [
        { value: totalMembers, label: "전체 멤버" },
        { value: monthlyParticipationCount, label: "총 출석" },
        { value: monthlyHostCount, label: "총 개설" },
    ];

    return (
        <div className="flex gap-3">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[12px] bg-rh-bg-surface h-[90px]"
                >
                    <span className="text-2xl font-bold text-rh-accent">
                        {card.value}
                    </span>
                    <span className="text-[11px] text-rh-text-tertiary">
                        {card.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
