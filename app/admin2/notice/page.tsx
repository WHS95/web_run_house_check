import PageHeader from "@/components/organisms/common/PageHeader";
import NoticeManagement from "./components/NoticeManagement";

export default function AdminNoticePage() {
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
            <NoticeManagement />
        </>
    );
}
