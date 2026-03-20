import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewUsers } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import UserManagement from "./components/UserManagement";

export default async function Admin2UserPage() {
    const { crewId } = await getAdminAuth();

    return (
        <>
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="회원 관리"
                    backLink="/admin2"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <Suspense fallback={<UserListSkeleton />}>
                <UserListServer crewId={crewId} />
            </Suspense>
        </>
    );
}

async function UserListServer({ crewId }: { crewId: string }) {
    const users = await getCrewUsers(crewId);
    return <UserManagement initialUsers={users} crewId={crewId} />;
}

function UserListSkeleton() {
    return (
        <div className="flex-1 px-4 pt-4 space-y-4">
            <div className="h-12 bg-rh-bg-surface rounded-[12px]" />
            <div className="flex justify-between items-center">
                <div className="w-20 h-4 bg-rh-bg-muted rounded" />
                <div className="w-14 h-8 bg-rh-bg-surface rounded" />
            </div>
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-16 bg-rh-bg-surface rounded-[12px]"
                />
            ))}
        </div>
    );
}
