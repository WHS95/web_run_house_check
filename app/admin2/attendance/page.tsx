import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getMonthlyAttendance } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import AttendanceManagement from "./components/AttendanceManagement";

export default async function Admin2AttendancePage({
    searchParams,
}: {
    searchParams: Promise<{
        year?: string;
        month?: string;
        day?: string;
    }>;
}) {
    const { crewId } = await getAdminAuth();
    const params = await searchParams;
    const now = new Date();
    const year = params.year ? parseInt(params.year) : now.getFullYear();
    const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
    const day = params.day ? parseInt(params.day) : now.getDate();

    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="출석 관리"
                    backLink="/admin2"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <Suspense fallback={<AttendanceSkeleton />}>
                <AttendanceDataServer
                    crewId={crewId}
                    year={year}
                    month={month}
                    day={day}
                />
            </Suspense>
        </>
    );
}

async function AttendanceDataServer({
    crewId,
    year,
    month,
    day,
}: {
    crewId: string;
    year: number;
    month: number;
    day: number;
}) {
    const records = await getMonthlyAttendance(crewId, year, month);
    return (
        <AttendanceManagement
            initialRecords={records}
            crewId={crewId}
            year={year}
            month={month}
            day={day}
        />
    );
}

function AttendanceSkeleton() {
    return (
        <div className="flex-1 px-4 pt-4 space-y-4">
            <div className="h-10 flex items-center justify-center">
                <div className="w-32 h-5 bg-rh-bg-muted rounded" />
            </div>
            <div className="bg-rh-bg-surface rounded-[12px] p-4">
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-10 bg-rh-bg-muted/30 rounded"
                        />
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-14 bg-rh-bg-surface rounded-[12px]"
                    />
                ))}
            </div>
        </div>
    );
}
