import PageHeader from "@/components/organisms/common/PageHeader";
import { AdminListItem } from "@/app/admin2/components/ui";
import { AnimatedList, AnimatedItem } from "@/components/atoms/AnimatedList";
import FadeIn from "@/components/atoms/FadeIn";

const menuItems = [
  {
    title: "설정",
    subtitle: "장소 · 운영진 · 초대코드",
    href: "/admin2/settings",
  },
  {
    title: "러닝 장소 관리",
    subtitle: "러닝 장소 추가 · 수정 · 삭제",
    href: "/admin2/settings?tab=location",
  },
  {
    title: "공지사항 관리",
    subtitle: "공지 작성 및 관리",
    href: "/admin2/notice",
  },
  {
    title: "크루 정보 편집",
    subtitle: "크루명 · 소개 · 로고",
    href: "/admin2/crew-edit",
  },
  {
    title: "단체 사진 합성",
    subtitle: "사진에 크루 로고 얹기",
    href: "/admin2/photo-composite",
  },
];

export default function AdminMenuPage() {
  return (
    <>
      <PageHeader
        title='메뉴'
        iconColor='white'
        backgroundColor='bg-rh-bg-primary'
      />
      <FadeIn>
        <div className='flex-1 px-4 pt-4 pb-4 space-y-5'>
          <span className='text-[11px] font-semibold text-rh-text-tertiary uppercase tracking-widest'>
            관리 기능
          </span>
          <AnimatedList className='space-y-2'>
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
