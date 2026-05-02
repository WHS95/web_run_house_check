"use client";

/**
 * 소개 페이지에서 데모 화면을 iframe으로 폰 모양 프레임 안에 띄우는 wrapper.
 * 노치, 둥근 모서리, 베젤 그림자를 흉내냄.
 */
export default function PhoneFrame({
    src,
    label,
    className = "",
}: {
    src: string;
    label: string;
    className?: string;
}) {
    return (
        <div className={`relative mx-auto w-full max-w-[300px] ${className}`}>
            {/* 외부 베젤 (검은 두께 + 그림자) */}
            <div className="relative overflow-hidden rounded-[44px] bg-black p-2 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)]">
                {/* 내부 화면 영역 */}
                <div
                    className="relative w-full overflow-hidden rounded-[36px] bg-rh-bg-primary"
                    style={{ aspectRatio: "9 / 19.5" }}
                >
                    <iframe
                        src={src}
                        title={label}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full border-0"
                    />
                    {/* 노치 */}
                    <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-black" />
                </div>
            </div>
        </div>
    );
}
