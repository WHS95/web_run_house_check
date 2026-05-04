"use client";

interface Props {
    crewName: string;
    crewLogoUrl: string | null;
}

export default function PhotoComposer({ crewName, crewLogoUrl }: Props) {
    return (
        <div className='flex-1 px-4 pt-4 pb-4 space-y-4'>
            <div className='rounded-xl bg-rh-bg-surface p-4 text-rh-text-secondary text-sm'>
                {crewName} · 로고 {crewLogoUrl ? "있음" : "없음"}
            </div>
            <p className='text-rh-text-tertiary text-sm'>
                다음 Task에서 업로드/합성 UI가 들어갑니다.
            </p>
        </div>
    );
}
