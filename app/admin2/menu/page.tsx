import PageHeader from "@/components/organisms/common/PageHeader";
import MenuListItem from "@/components/molecules/MenuListItem";
import SectionLabel from "@/components/atoms/SectionLabel";

const menuItems = [
    {
        title: "통계 분석",
        subtitle: "요일별 · 장소별 참여율",
        href: "/admin2/analyze",
    },
    {
        title: "설정",
        subtitle: "장소 · 운영진 · 초대코드",
        href: "/admin2/settings",
    },
    {
        title: "공지사항 관리",
        subtitle: "공지 작성 및 관리",
        href: "/admin2/notice",
    },
    {
        title: "푸시 알림 발송",
        subtitle: "크루원에게 알림 보내기",
        href: "/admin2/push",
    },
    {
        title: "크루 정보 편집",
        subtitle: "크루명 · 소개 · 로고",
        href: "/admin2/crew-edit",
    },
];

export default function AdminMenuPage() {
    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="메뉴"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <div className="flex-1 px-4 pt-4 pb-4 space-y-4">
                <SectionLabel>관리 기능</SectionLabel>
                <div className="space-y-2">
                    {menuItems.map((item) => (
                        <MenuListItem
                            key={item.href}
                            title={item.title}
                            subtitle={item.subtitle}
                            href={item.href}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
