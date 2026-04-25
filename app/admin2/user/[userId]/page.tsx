import { notFound } from "next/navigation";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewUserDetail } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import UserDetail from "./components/UserDetail";
import UserDetailHeaderMenu from "./components/UserDetailHeaderMenu";

interface PageProps {
    params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({
    params,
}: PageProps) {
    const { userId } = await params;
    const { crewId } = await getAdminAuth();
    const detail = await getCrewUserDetail(crewId, userId);
    if (!detail) notFound();

    return (
        <>
            <PageHeader
                title="회원 상세"
                backLink="/admin2/user"
                iconColor="white"
                backgroundColor="bg-rh-bg-surface"
                rightAction={
                    <UserDetailHeaderMenu
                        user={detail.user}
                    />
                }
            />
            <UserDetail detail={detail} crewId={crewId} />
        </>
    );
}
