import PageHeader from "@/components/organisms/common/PageHeader";

export default function AdminPushPage() {
    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="푸시 알림 발송"
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
