import { Suspense } from 'react';
import { getAdminAuth } from '@/lib/admin2/auth';
import PageHeader from '@/components/organisms/common/PageHeader';
import {
    loadSessionListVM,
    type SessionListFilter,
} from './_vm/loadSessionListVM';
import SessionList from './_components/SessionList';

export const metadata = { title: '세션 보정' };

export default async function Admin2SessionsPage({
    searchParams,
}: {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
        label?: string;
        minMembers?: string;
        page?: string;
    }>;
}) {
    const { crewId } = await getAdminAuth();
    const params = await searchParams;

    const filter: SessionListFilter = {
        startDate: params.startDate,
        endDate: params.endDate,
        label: params.label,
        minMembers: params.minMembers ? parseInt(params.minMembers, 10) : undefined,
        page: params.page ? Math.max(1, parseInt(params.page, 10)) : 1,
        pageSize: 20,
    };

    return (
        <>
            <PageHeader
                title="세션 보정"
                backLink="/admin2/attendance"
                iconColor="white"
                backgroundColor="bg-rh-bg-primary"
            />
            <Suspense fallback={<SessionListSkeleton />}>
                <SessionListServer crewId={crewId} filter={filter} />
            </Suspense>
        </>
    );
}

async function SessionListServer({
    crewId,
    filter,
}: {
    crewId: string;
    filter: SessionListFilter;
}) {
    const vm = await loadSessionListVM(crewId, filter);
    return <SessionList vm={vm} />;
}

function SessionListSkeleton() {
    return (
        <div className="flex-1 px-4 pt-4 space-y-3">
            <div className="h-32 rounded-[12px] bg-rh-bg-surface" />
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-[12px] bg-rh-bg-surface" />
            ))}
        </div>
    );
}
