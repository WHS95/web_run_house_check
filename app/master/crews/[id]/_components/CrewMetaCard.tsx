import Link from "next/link";
import { Pencil } from "lucide-react";
import type { CrewDetailViewModel } from "../_vm/detail";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

interface CrewMetaCardProps {
    crew: CrewDetailViewModel["crew"];
}

function formatDate(value: string | null): string {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return dateFormatter.format(d);
}

function MetaRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-rh-text-secondary">
                {label}
            </span>
            <span className="text-[13px] text-white text-right truncate">
                {value}
            </span>
        </div>
    );
}

export default function CrewMetaCard({ crew }: CrewMetaCardProps) {
    const locationBased = crew.location_based_attendance === true;
    const allowUnregistered = crew.allow_unregistered_location === true;

    return (
        <div className="rounded-xl bg-rh-bg-surface p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h2 className="text-[16px] font-semibold text-white truncate">
                        {crew.name}
                    </h2>
                    {crew.region && (
                        <p className="text-[12px] text-rh-text-tertiary mt-0.5">
                            {crew.region}
                        </p>
                    )}
                </div>
                <Link
                    href={`/master/crews/${crew.id}/edit`}
                    aria-label="크루 수정"
                    className="shrink-0 flex items-center gap-1 rounded-lg bg-rh-bg-muted px-2.5 py-1.5 text-[12px] text-white active:opacity-70 transition-opacity"
                >
                    <Pencil size={12} />
                    수정
                </Link>
            </div>

            {crew.description && (
                <p className="text-[13px] text-rh-text-secondary leading-relaxed whitespace-pre-wrap">
                    {crew.description}
                </p>
            )}

            <div className="h-px bg-rh-border" />

            <div className="space-y-2">
                <MetaRow
                    label="생성일"
                    value={formatDate(crew.created_at)}
                />
                <MetaRow
                    label="위치기반 출석"
                    value={locationBased ? "사용" : "미사용"}
                />
                <MetaRow
                    label="정확도 범위"
                    value={
                        crew.accuracy_range !== null
                            ? `${crew.accuracy_range}m`
                            : "-"
                    }
                />
                <MetaRow
                    label="미등록 위치 허용"
                    value={allowUnregistered ? "허용" : "차단"}
                />
            </div>
        </div>
    );
}
