import PageHeader from "@/components/organisms/common/PageHeader";
import NoticeManagement from "./components/NoticeManagement";
import { getAdminAuth } from "@/lib/admin2/auth";
import { adminKey } from "@/lib/admin2/swr-keys";
import { getNoticesForAdmin } from "@/lib/admin2/queries";

export default async function AdminNoticePage() {
    const { crewId } = await getAdminAuth();
    const initial = await getNoticesForAdmin(crewId);
    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="공지사항 관리"
                    backLink="/admin2/menu"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <NoticeManagement
                fallback={{ [adminKey.notices(crewId)]: initial }}
            />
        </>
    );
}
