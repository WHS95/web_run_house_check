"use client";
import { useRouter, usePathname } from "next/navigation";
import MonthNavigator from "@/components/molecules/MonthNavigator";

export default function DashboardMonthNav({
    year,
    month,
}: {
    year: number;
    month: number;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const navigate = (y: number, m: number) => {
        router.push(`${pathname}?year=${y}&month=${m}`);
    };

    const handlePrev = () => {
        if (month <= 1) navigate(year - 1, 12);
        else navigate(year, month - 1);
    };

    const handleNext = () => {
        if (month >= 12) navigate(year + 1, 1);
        else navigate(year, month + 1);
    };

    return (
        <MonthNavigator
            year={year}
            month={month}
            onPrev={handlePrev}
            onNext={handleNext}
        />
    );
}
