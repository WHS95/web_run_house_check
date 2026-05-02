import Link from "next/link";
import {
    ArrowRight,
    MapPin,
    BarChart3,
    LayoutDashboard,
    Calendar,
    Sparkles,
} from "lucide-react";
import PhoneFrame from "./_components/PhoneFrame";

export default function IntroPage() {
    return (
        <main className="min-h-full bg-rh-bg-primary text-white">
            <Nav />
            <Hero />
            <Problem />
            <DualPerspective />
            <Features />
            <FinalCTA />
            <Footer />
        </main>
    );
}

/* ── 상단 내비 ── */
function Nav() {
    return (
        <nav className="sticky top-0 z-40 border-b border-rh-border/40 bg-rh-bg-primary/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
                <span className="text-[15px] font-bold tracking-tight">런하우스</span>
                <div className="flex items-center gap-1.5">
                    <Link
                        href="/demo"
                        className="rounded-full px-3 py-1.5 text-[12px] text-rh-text-secondary hover:text-white"
                    >
                        체험하기
                    </Link>
                    <Link
                        href="/auth/login"
                        className="rounded-full bg-rh-accent px-3.5 py-1.5 text-[12px] font-medium text-white hover:bg-rh-accent-hover"
                    >
                        시작하기
                    </Link>
                </div>
            </div>
        </nav>
    );
}

/* ── Hero ── */
function Hero() {
    return (
        <section className="relative overflow-hidden border-b border-rh-border/40">
            <div className="mx-auto grid max-w-5xl gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:pb-24 md:pt-20">
                <div className="flex flex-col justify-center">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rh-accent/15 px-3 py-1 text-[11px] font-medium text-rh-accent">
                        <Sparkles className="h-3 w-3" />
                        러닝 크루를 위한 출석·운영 도구
                    </span>
                    <h1 className="mt-5 text-[34px] font-bold leading-[1.15] tracking-tight md:text-[52px]">
                        단톡방 출석체크 그만,
                        <br />
                        <span className="text-rh-accent">러닝 크루 운영을 데이터화.</span>
                    </h1>
                    <p className="mt-5 max-w-md text-[15px] leading-relaxed text-rh-text-secondary md:text-[16px]">
                        매주 단톡방에 답장 정리하느라 일요일 저녁이 사라지셨나요?
                        런하우스는 위치 기반 출석부터 통계 시각화까지,
                        크루를 운영하는 일을 한결 가볍게 만듭니다.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-2">
                        <Link
                            href="/demo"
                            className="inline-flex items-center gap-1.5 rounded-full bg-rh-accent px-5 py-3 text-[14px] font-semibold text-white hover:bg-rh-accent-hover"
                        >
                            지금 데모 체험하기
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="#features"
                            className="inline-flex items-center rounded-full border border-rh-border bg-rh-bg-surface/40 px-5 py-3 text-[14px] font-medium text-white hover:bg-rh-bg-surface"
                        >
                            기능 살펴보기
                        </Link>
                    </div>
                    <p className="mt-5 text-[12px] text-rh-text-tertiary">
                        가입 없이 바로 둘러볼 수 있어요. 데이터는 저장되지 않습니다.
                    </p>
                </div>

                <div className="flex justify-center md:justify-end">
                    <PhoneFrame
                        src="/demo/attendance?embed=1"
                        label="출석 체크 데모"
                        className="md:translate-y-2"
                    />
                </div>
            </div>
        </section>
    );
}

/* ── Problem ── */
function Problem() {
    const items = [
        {
            title: "“이번 주 누구 와요?”",
            body: "일요일 저녁마다 단톡방에 12개 답장이 흩어져요. 운영진이 일일이 메모장에 옮겨 적습니다.",
        },
        {
            title: "“이번 달 누가 자주 빠졌지?”",
            body: "기록은 흩어져 있고, 통계는 머릿속 추측. 누가 잘 나오고 누가 멀어지는지 눈으로 보기 어려워요.",
        },
        {
            title: "“신규 크루원, 적응 잘 되고 있나?”",
            body: "들어온 지 두 달 된 멤버가 몇 번 출석했는지, 어떤 모임을 좋아하는지 한 번에 알 방법이 없습니다.",
        },
    ];
    return (
        <section className="border-b border-rh-border/40 px-5 py-16 md:py-24">
            <div className="mx-auto max-w-3xl">
                <p className="text-[12px] font-medium uppercase tracking-wider text-rh-accent">
                    문제
                </p>
                <h2 className="mt-2 text-[28px] font-bold leading-tight md:text-[36px]">
                    크루를 운영하는 일은
                    <br />
                    생각보다 잡일이 많습니다.
                </h2>
                <div className="mt-10 space-y-5 md:space-y-6">
                    {items.map((it) => (
                        <div
                            key={it.title}
                            className="rounded-2xl border border-rh-border bg-rh-bg-surface/60 p-5"
                        >
                            <p className="text-[16px] font-semibold text-white">{it.title}</p>
                            <p className="mt-2 text-[14px] leading-relaxed text-rh-text-secondary">
                                {it.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ── 두 관점: 운영진 / 크루원 ── */
function DualPerspective() {
    return (
        <section className="border-b border-rh-border/40 px-5 py-16 md:py-24">
            <div className="mx-auto max-w-5xl">
                <div className="text-center">
                    <p className="text-[12px] font-medium uppercase tracking-wider text-rh-accent">
                        해결
                    </p>
                    <h2 className="mt-2 text-[28px] font-bold leading-tight md:text-[36px]">
                        모든 출석이 데이터가 됩니다.
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-rh-text-secondary">
                        운영진은 추측 대신 데이터로 결정하고, 크루원은
                        자기 기록을 쌓아 동기를 얻습니다. 두 관점이 맞물릴 때
                        크루는 더 단단해집니다.
                    </p>
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-10">
                    {/* 운영진 */}
                    <div className="rounded-3xl border border-rh-border bg-rh-bg-surface/40 p-6 md:p-8">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rh-accent/15 px-2.5 py-1 text-[11px] font-medium text-rh-accent">
                            운영진을 위한
                        </span>
                        <h3 className="mt-3 text-[22px] font-bold leading-tight">
                            출석을 데이터로 보면,
                            <br />
                            크루 운영이 보입니다.
                        </h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-rh-text-secondary">
                            “요일별 참여율을 보고 모임 시간을 옮기니 출석률이 올라갔어요.
                            누가 한 달 넘게 안 보이는지 보이니, 안부를 챙길 수 있게 됐죠.”
                        </p>
                        <div className="mt-6 flex justify-center">
                            <PhoneFrame
                                src="/demo/admin?embed=1"
                                label="관리자 대시보드"
                            />
                        </div>
                    </div>

                    {/* 크루원 */}
                    <div className="rounded-3xl border border-rh-border bg-rh-bg-surface/40 p-6 md:p-8">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rh-accent/15 px-2.5 py-1 text-[11px] font-medium text-rh-accent">
                            크루원을 위한
                        </span>
                        <h3 className="mt-3 text-[22px] font-bold leading-tight">
                            내 기록과 랭킹으로,
                            <br />
                            계속 뛰는 재미.
                        </h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-rh-text-secondary">
                            이번 달 몇 번 나갔는지, 크루에서 몇 등인지
                            한 번에 보여요. 단톡방 보다가 “나도 한 번 더 나갈까?”
                            싶은 마음이 들도록.
                        </p>
                        <div className="mt-6 flex justify-center">
                            <PhoneFrame
                                src="/demo/stats?embed=1"
                                label="통계와 랭킹"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ── 화면별 기능 3개 ── */
function Features() {
    const features = [
        {
            icon: Calendar,
            tag: "출석 체크",
            title: "한 손으로, 한 번에.",
            body: "위치를 자동 인증하고, 날짜·장소·운동만 고르면 출석 끝. 단톡방 답장 정리에서 해방됩니다.",
            href: "/demo/attendance",
            highlight: "GPS 인증 · 10초",
        },
        {
            icon: LayoutDashboard,
            tag: "관리자 대시보드",
            title: "한 달이 한 화면에.",
            body: "월별 캘린더에 출석일이 표시되고, 멤버별 참여 현황과 최근 기록을 한눈에 확인합니다.",
            href: "/demo/admin",
            highlight: "월간 캘린더 · 멤버별 참여",
        },
        {
            icon: BarChart3,
            tag: "통계 시각화",
            title: "추측 말고, 데이터로.",
            body: "요일별·장소별 참여율과 멤버 랭킹을 시각화. 운영 결정의 근거가 명확해집니다.",
            href: "/demo/stats",
            highlight: "요일별 · 장소별 · 랭킹",
        },
    ];
    return (
        <section
            id="features"
            className="border-b border-rh-border/40 px-5 py-16 md:py-24"
        >
            <div className="mx-auto max-w-5xl">
                <p className="text-[12px] font-medium uppercase tracking-wider text-rh-accent">
                    핵심 기능
                </p>
                <h2 className="mt-2 text-[28px] font-bold leading-tight md:text-[36px]">
                    3개 화면이면 충분합니다.
                </h2>

                <div className="mt-12 space-y-16 md:space-y-24">
                    {features.map((f, i) => {
                        const reverse = i % 2 === 1;
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.tag}
                                className={`grid gap-8 md:grid-cols-[1fr_1fr] md:gap-12 ${
                                    reverse ? "md:[&>*:first-child]:order-2" : ""
                                }`}
                            >
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rh-accent/15">
                                            <Icon className="h-4 w-4 text-rh-accent" />
                                        </div>
                                        <span className="text-[12px] font-medium uppercase tracking-wider text-rh-text-tertiary">
                                            {f.tag}
                                        </span>
                                    </div>
                                    <h3 className="mt-4 text-[24px] font-bold leading-tight md:text-[30px]">
                                        {f.title}
                                    </h3>
                                    <p className="mt-3 text-[15px] leading-relaxed text-rh-text-secondary">
                                        {f.body}
                                    </p>
                                    <p className="mt-4 text-[12px] text-rh-accent">{f.highlight}</p>
                                    <Link
                                        href={f.href}
                                        className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-rh-border bg-rh-bg-surface/40 px-4 py-2 text-[13px] hover:bg-rh-bg-surface"
                                    >
                                        이 화면 체험하기
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                                <div className="flex justify-center">
                                    <PhoneFrame src={`${f.href}?embed=1`} label={f.tag} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* ── Final CTA ── */
function FinalCTA() {
    return (
        <section className="border-b border-rh-border/40 px-5 py-20 md:py-28">
            <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-rh-accent/20 via-rh-bg-surface to-rh-bg-primary p-10 text-center md:p-14">
                <MapPin className="mx-auto h-8 w-8 text-rh-accent" />
                <h2 className="mt-4 text-[28px] font-bold leading-tight md:text-[34px]">
                    크루 운영,
                    <br />
                    오늘부터 가볍게.
                </h2>
                <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-rh-text-secondary">
                    가입 전에 충분히 둘러보세요.
                    <br />
                    실제 크루처럼 12명 멤버 데이터가 미리 들어있습니다.
                </p>
                <Link
                    href="/demo"
                    className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-rh-accent px-6 py-3 text-[14px] font-semibold text-white hover:bg-rh-accent-hover"
                >
                    지금 데모 체험하기
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
    );
}

/* ── Footer ── */
function Footer() {
    return (
        <footer className="px-5 py-10">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-[12px] text-rh-text-tertiary md:flex-row">
                <span>© 2026 런하우스</span>
                <div className="flex gap-4">
                    <Link href="/demo" className="hover:text-white">
                        체험
                    </Link>
                    <Link href="/auth/login" className="hover:text-white">
                        로그인
                    </Link>
                </div>
            </div>
        </footer>
    );
}
