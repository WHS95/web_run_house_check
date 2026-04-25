import PageHeader from "@/components/organisms/common/PageHeader";
import NoticeWriteForm from "./components/NoticeWriteForm";

export default function AdminNoticeWritePage() {
    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="공지사항 작성"
                backLink="/admin2/notice"
                iconColor="white"
                backgroundColor="bg-rh-bg-surface"
            />
            <NoticeWriteForm />
        </div>
    );
}
