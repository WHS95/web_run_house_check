import { notFound } from "next/navigation";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewUserDetail } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import UserDetail from "./components/UserDetail";

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
            <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="회원 상세"
                    backLink="/admin2/user"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <UserDetail detail={detail} crewId={crewId} />
        </>
    );
}
