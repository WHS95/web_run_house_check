"use client";
import { useState, useCallback } from "react";
import FadeIn from "@/components/atoms/FadeIn";
import AdminBadge from "@/app/admin2/components/ui/AdminBadge";
import AdminAlertDialog from "@/app/admin2/components/ui/AdminAlertDialog";
import { Switch } from "@/components/ui/switch";
import { updateUserStatus } from "@/lib/supabase/admin";
import type { CrewUserDetail } from "@/lib/admin2/queries";

interface Props {
    detail: CrewUserDetail;
    crewId: string;
}

function StatCard({
    value,
    label,
    valueSize = "lg",
}: {
    value: string;
    label: string;
    valueSize?: "sm" | "lg";
}) {
    return (
        <div className="h-[76px] min-w-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-rh-bg-surface py-4 px-2">
            <span
                className={
                    "font-bold text-white whitespace-nowrap tabular-nums leading-none " +
                    (valueSize === "lg"
                        ? "text-xl"
                        : "text-[13px]")
                }
            >
                {value}
            </span>
            <span className="text-xs text-rh-text-secondary whitespace-nowrap">
                {label}
            </span>
        </div>
    );
}

const formatDate = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return (
        `${dt.getFullYear()}.` +
        `${String(dt.getMonth() + 1).padStart(2, "0")}.` +
        `${String(dt.getDate()).padStart(2, "0")}`
    );
};

export default function UserDetail({
    detail,
    crewId,
}: Props) {
    const { user, role } = detail;
    const [active, setActive] = useState(
        user.status === null || user.status === "ACTIVE",
    );
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const isStaff = role === "admin" || role === "owner";

    const handleToggle = useCallback(async () => {
        setConfirmOpen(false);
        setBusy(true);
        const next = !active;
        const prev = active;
        setActive(next);
        const { error } = await updateUserStatus(
            user.id,
            crewId,
            next,
        );
        if (error) {
            setActive(prev);
            alert("상태 변경에 실패했습니다.");
        }
        setBusy(false);
    }, [active, user.id, crewId]);

    return (
        <FadeIn>
            <div className="flex-1 px-4 pt-4 pb-4 flex flex-col gap-4">
                {/* 프로필 카드 */}
                <div className="rounded-2xl bg-rh-bg-surface p-6 flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-rh-accent flex items-center justify-center text-white text-[22px] font-bold">
                        {(user.first_name || "?").charAt(0)}
                    </div>
                    <span className="text-lg font-bold text-white">
                        {user.first_name || "이름 없음"}
                    </span>
                    {isStaff && (
                        <AdminBadge variant="accent">
                            운영진
                        </AdminBadge>
                    )}
                    <span className="text-xs text-rh-text-tertiary">
                        가입일:{" "}
                        {formatDate(
                            user.join_date ||
                                user.created_at,
                        )}
                    </span>
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-3 gap-2">
                    <StatCard
                        value={formatDate(
                            detail.last_attendance_date,
                        )}
                        label="최근 참여일"
                        valueSize="sm"
                    />
                    <StatCard
                        value={`${detail.attendance_count}회`}
                        label="전체 출석"
                    />
                    <StatCard
                        value={`${detail.hosted_count}회`}
                        label="모임 개설"
                    />
                </div>

                {/* 회원 관리 */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-base font-semibold text-white px-1">
                        회원 관리
                    </h2>
                    <div className="flex items-center justify-between rounded-xl bg-rh-bg-surface p-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-white">
                                멤버 활성 상태
                            </span>
                            <span className="text-xs text-rh-text-tertiary">
                                비활성 시 출석 체크가
                                불가합니다
                            </span>
                        </div>
                        <Switch
                            checked={active}
                            disabled={busy}
                            onCheckedChange={() =>
                                setConfirmOpen(true)
                            }
                        />
                    </div>
                </section>
            </div>

            <AdminAlertDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleToggle}
                title={
                    active
                        ? "비활성화하시겠습니까?"
                        : "활성화하시겠습니까?"
                }
                description={
                    active
                        ? "해당 회원이 비활성 상태로 전환됩니다."
                        : "해당 회원이 활성 상태로 전환됩니다."
                }
                cancelLabel="취소"
                confirmLabel="확인"
            />
        </FadeIn>
    );
}
