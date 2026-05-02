import Link from "next/link";
import { Calendar, LayoutDashboard, BarChart3, ArrowRight, ChevronLeft } from "lucide-react";
import { DEMO_CREW, DEMO_OVERALL } from "@/lib/demo/fixtures";

const SCREENS = [
    {
        href: "/demo/attendance",
        icon: Calendar,
        title: "출석 체크",
        subtitle: "위치 기반으로 한 번에",
        body: "GPS 인증 + 한 번 탭으로 출석. 단톡방에 답장 정리할 일이 사라집니다.",
    },
    {
        href: "/demo/admin",
        icon: LayoutDashboard,
        title: "관리자 대시보드",
        subtitle: "이번 달 크루는 어떻게?",
        body: "월별 출석 캘린더, 멤버별 참여 기록, 누가 자주 빠지는지 한눈에.",
    },
    {
        href: "/demo/stats",
        icon: BarChart3,
        title: "통계 시각화",
        subtitle: "데이터로 운영하기",
        body: "요일별·장소별 참여율, 멤버 랭킹. 추측 대신 데이터로 결정합니다.",
    },
];

export default function DemoHubPage() {
    return (
        <div className="flex min-h-screen flex-col bg-rh-bg-primary">
            <header className="sticky top-0 z-50 bg-rh-bg-surface/80 backdrop-blur-md border-b border-rh-border">
                <div className="flex h-14 items-center px-2 pt-safe">
                    <Link
                        href="/intro"
                        aria-label="소개로 돌아가기"
                        className="flex h-11 w-11 shrink-0 items-center justify-center"
                    >
                        <ChevronLeft className="h-6 w-6 text-white" />
                    </Link>
                    <h1 className="flex-1 text-[18px] font-semibold text-white">
                        둘러보기
                    </h1>
                </div>
            </header>

            <div className="flex-1 px-4 py-5 space-y-5">
                <div>
                    <p className="text-[13px] text-rh-text-tertiary">{DEMO_CREW.name}</p>
                    <h2 className="mt-1 text-[22px] font-bold text-white leading-tight">
                        실제 크루처럼 둘러보세요
                    </h2>
                    <p className="mt-2 text-[13px] text-rh-text-secondary leading-relaxed">
                        멤버 {DEMO_OVERALL.totalMembers}명, 최근 30일 출석 기록
                        {" "}
                        {DEMO_OVERALL.totalRecords}건이 미리 들어가 있어요.
                        <br />
                        실제 앱과 동일한 화면을 자유롭게 클릭해보세요.
                    </p>
                </div>

                <div className="space-y-3">
                    {SCREENS.map(({ href, icon: Icon, title, subtitle, body }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-start gap-4 rounded-2xl border border-rh-border bg-rh-bg-surface p-4 active:scale-[0.98] transition"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rh-accent/15">
                                <Icon className="h-6 w-6 text-rh-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] text-rh-text-tertiary">
                                    {subtitle}
                                </p>
                                <h3 className="mt-0.5 text-[16px] font-semibold text-white">
                                    {title}
                                </h3>
                                <p className="mt-1 text-[12px] leading-relaxed text-rh-text-secondary">
                                    {body}
                                </p>
                            </div>
                            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-rh-text-tertiary group-hover:text-white transition-colors" />
                        </Link>
                    ))}
                </div>

                <div className="rounded-xl border border-rh-border-subtle bg-rh-bg-inset p-4 text-center">
                    <p className="text-[12px] text-rh-text-tertiary leading-relaxed">
                        체험 모드에서는 데이터가 저장되지 않습니다.
                        <br />
                        모든 변경은 새로고침 시 초기화돼요.
                    </p>
                </div>
            </div>
        </div>
    );
}
