import { getAdminAuth } from "@/lib/admin2/auth";
import PageHeader from "@/components/organisms/common/PageHeader";
import PushManagement from "./components/PushManagement";

export default async function AdminPushPage() {
    const { crewId } = await getAdminAuth();

    return (
        <>
            <PageHeader
                title="푸시 알림 발송"
                backLink="/admin2/menu"
                iconColor="white"
                backgroundColor="bg-rh-bg-surface"
            />
            <PushManagement crewId={crewId} />
        </>
    );
}
