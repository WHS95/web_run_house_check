// app/admin2/menu/page.tsx
import PageHeader from "@/components/organisms/common/PageHeader";
import { AdminListItem } from "@/app/admin2/components/ui";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import FadeIn from "@/components/atoms/FadeIn";

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
            <div className="sticky top-0 z-50 bg-rh-bg-surface">
                <PageHeader
                    title="메뉴"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <FadeIn>
                <div className="flex-1 px-4 pt-4 pb-4 space-y-5">
                    <span className="text-[11px] font-semibold text-rh-text-tertiary uppercase tracking-widest">
                        관리 기능
                    </span>
                    <AnimatedList className="space-y-2">
                        {menuItems.map((item) => (
                            <AnimatedItem key={item.href}>
                                <AdminListItem
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    href={item.href}
                                />
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                </div>
            </FadeIn>
        </>
    );
}
