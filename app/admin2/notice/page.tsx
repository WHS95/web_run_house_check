import PageHeader from "@/components/organisms/common/PageHeader";

export default function AdminNoticePage() {
    return (
        <>
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="공지사항 관리"
                    backLink="/admin2/menu"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <div className="flex-1 flex items-center justify-center">
                <p className="text-rh-text-secondary text-sm">
                    준비 중입니다
                </p>
            </div>
        </>
    );
}
