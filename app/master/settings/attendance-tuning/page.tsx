import type { Metadata } from 'next';
import PageHeader from '@/components/organisms/common/PageHeader';
import FadeIn from '@/components/atoms/FadeIn';
import { loadAttendanceTuningVM } from './_vm/loadSettingsViewModel';
import { AttendanceTuningForm } from './_components/AttendanceTuningForm';

export const metadata: Metadata = {
    title: '런하우스 - 출석 튜닝',
    robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function MasterAttendanceTuningPage() {
    const vm = await loadAttendanceTuningVM();

    return (
        <div className="flex flex-col">
            <PageHeader
                title="출석 튜닝"
                backLink="/master"
                iconColor="white"
            />
            <FadeIn>
                <AttendanceTuningForm vm={vm} />
            </FadeIn>
        </div>
    );
}
