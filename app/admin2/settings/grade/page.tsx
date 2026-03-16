import { getAdminAuth } from "@/lib/admin2/auth";
import PageHeader from "@/components/organisms/common/PageHeader";
import GradeManagementWrapper from "./components/GradeManagementWrapper";

export default async function Admin2GradePage() {
    const { crewId } = await getAdminAuth();

    return (
        <>
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="등급 관리"
                    backLink="/admin2/settings"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <div className="flex-1 overflow-y-auto scroll-area-bottom">
                <GradeManagementWrapper crewId={crewId} />
            </div>
        </>
    );
}
