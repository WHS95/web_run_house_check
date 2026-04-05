"use client";

import {
    useState,
    useEffect,
    useMemo,
    useCallback,
    memo,
} from "react";
import { ChevronLeft, Check, Calendar, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminSelect from "@/app/admin2/components/ui/AdminSelect";
import AdminTabBar from "@/app/admin2/components/ui/AdminTabBar";
import AdminCheckbox from "@/app/admin2/components/ui/AdminCheckbox";
import { haptic } from "@/lib/haptic";

interface UserRow {
    id: string;
    first_name: string;
    birth_year: number | null;
}

interface LocationRow {
    id: number;
    name: string;
}

interface Props {
    crewId: string;
    initialDate: string; // YYYY-MM-DD
    onClose: () => void;
    onSuccess: () => void;
}

const EXERCISE_TABS = [
    { key: "running", label: "러닝" },
    { key: "walking", label: "걷기" },
    { key: "etc", label: "기타" },
];

function getBirthSuffix(year: number | null): string {
    if (!year) return "";
    return String(year).slice(-2);
}

function getNowKSTTime(): string {
    const d = new Date();
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(11, 16);
}

function AdminBulkAttendanceSheet({
    crewId,
    initialDate,
    onClose,
    onSuccess,
}: Props) {
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState(getNowKSTTime);
    const [locationId, setLocationId] = useState("");
    const [exerciseTab, setExerciseTab] = useState("running");
    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [hostIds, setHostIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* 데이터 로드 */
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const [uRes, sRes] = await Promise.all([
                    fetch(`/api/admin/users?crewId=${crewId}`),
                    fetch(`/api/admin/settings?crewId=${crewId}`),
                ]);
                const uJson = await uRes.json();
                const sJson = await sRes.json();
                if (cancelled) return;
                if (uJson?.success && Array.isArray(uJson.data)) {
                    setUsers(uJson.data);
                }
                if (sJson?.success && sJson.data?.locations) {
                    const locs: LocationRow[] = sJson.data.locations;
                    setLocations(locs);
                    if (locs.length > 0) {
                        setLocationId(String(locs[0].id));
                    }
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [crewId]);

    /* 전체 선택 상태 */
    const allSelected = useMemo(
        () => users.length > 0 && selected.size === users.length,
        [users.length, selected.size],
    );

    const toggleAll = useCallback(() => {
        haptic.light();
        setSelected((prev) =>
            prev.size === users.length
                ? new Set()
                : new Set(users.map((u) => u.id)),
        );
    }, [users]);

    const toggleUser = useCallback((userId: string) => {
        haptic.light();
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    }, []);

    const toggleHost = useCallback((userId: string) => {
        haptic.light();
        setHostIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    }, []);

    /* 제출 */
    const handleSubmit = useCallback(async () => {
        if (selected.size === 0) {
            alert("출석 처리할 회원을 선택해주세요.");
            return;
        }
        if (!locationId) {
            alert("출석 장소를 선택해주세요.");
            return;
        }
        if (!date || !time) {
            alert("출석 날짜와 시간을 모두 선택해주세요.");
            return;
        }

        setIsSubmitting(true);
        haptic.medium();
        try {
            const attendanceDateTime = new Date(
                `${date}T${time}:00`,
            );
            const attendanceTimestamp =
                attendanceDateTime.toISOString();
            const payload = {
                crewId,
                users: Array.from(selected).map((userId) => ({
                    userId,
                    isHost: hostIds.has(userId),
                })),
                attendanceTimestamp,
                locationId: parseInt(locationId, 10),
            };
            const res = await fetch(
                "/api/admin/attendance/bulk",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );
            const json = await res.json();
            if (res.ok && json.success) {
                haptic.success();
                alert(
                    `${selected.size}명의 출석이 성공적으로 처리되었습니다.`,
                );
                onSuccess();
            } else {
                haptic.error();
                alert(
                    json.message ||
                        "출석 처리 중 오류가 발생했습니다.",
                );
            }
        } catch {
            haptic.error();
            alert("출석 처리 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }, [
        selected,
        hostIds,
        locationId,
        date,
        time,
        crewId,
        onSuccess,
    ]);

    const locationOptions = useMemo(
        () =>
            locations.map((l) => ({
                value: String(l.id),
                label: l.name,
            })),
        [locations],
    );

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-rh-bg-primary">
            {/* Header — .pen aOvsj: 56px, bg-surface */}
            <div className="shrink-0 flex items-center justify-between h-14 px-4 bg-rh-bg-surface">
                <button
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 -ml-2"
                    aria-label="닫기"
                >
                    <ChevronLeft
                        size={24}
                        className="text-white"
                    />
                </button>
                <h2 className="text-base font-semibold text-white">
                    일괄 출석 등록
                </h2>
                <div className="w-8" />
            </div>

            {/* Content — scrollable, padding 20/16, gap 16 */}
            <div
                className="flex-1 overflow-y-auto px-4 pt-5 pb-4 space-y-4"
                style={{ overscrollBehavior: "contain" }}
            >
                {/* 날짜 */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-rh-text-secondary">
                        날짜
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) =>
                                setDate(e.target.value)
                            }
                            className="w-full h-12 px-4 pr-10 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white outline-none focus:border-rh-accent transition-colors"
                        />
                        <Calendar
                            size={18}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-rh-text-muted pointer-events-none"
                        />
                    </div>
                </div>

                {/* 시간 */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-rh-text-secondary">
                        시간
                    </label>
                    <div className="relative">
                        <input
                            type="time"
                            value={time}
                            onChange={(e) =>
                                setTime(e.target.value)
                            }
                            className="w-full h-12 px-4 pr-10 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white outline-none focus:border-rh-accent transition-colors"
                        />
                        <Clock
                            size={18}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-rh-text-muted pointer-events-none"
                        />
                    </div>
                </div>

                {/* 장소 */}
                <AdminSelect
                    label="장소"
                    value={locationId}
                    onChange={setLocationId}
                    options={locationOptions}
                    placeholder={
                        isLoading
                            ? "불러오는 중..."
                            : "장소를 선택해주세요"
                    }
                />

                {/* 운동 종류 */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-rh-text-secondary">
                        운동 종류
                    </label>
                    <AdminTabBar
                        tabs={EXERCISE_TABS}
                        activeTab={exerciseTab}
                        onTabChange={setExerciseTab}
                    />
                </div>

                {/* 출석 회원 선택 */}
                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">
                                출석 회원 선택
                            </h3>
                            <span className="text-xs font-medium text-rh-accent">
                                {selected.size}/{users.length}명
                                선택
                            </span>
                        </div>
                        <span className="text-[11px] text-rh-text-tertiary">
                            개설자
                        </span>
                    </div>

                    {/* 전체 선택 */}
                    <button
                        type="button"
                        onClick={toggleAll}
                        disabled={isLoading || users.length === 0}
                        className="flex items-center justify-between h-[52px] px-4 rounded-xl bg-rh-accent/10 border border-rh-accent/30 disabled:opacity-50"
                    >
                        <span className="text-sm font-semibold text-white">
                            전체 선택
                        </span>
                        <Switch
                            checked={allSelected}
                            onCheckedChange={toggleAll}
                            disabled={
                                isLoading || users.length === 0
                            }
                        />
                    </button>

                    {/* 회원 리스트 */}
                    <div className="flex flex-col gap-2">
                        {isLoading ? (
                            <>
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-[52px] rounded-xl bg-rh-bg-surface"
                                    />
                                ))}
                            </>
                        ) : users.length === 0 ? (
                            <div className="py-8 text-center text-sm text-rh-text-secondary">
                                회원이 없습니다.
                            </div>
                        ) : (
                            users.map((u) => {
                                const isSel = selected.has(u.id);
                                const isHost = hostIds.has(u.id);
                                return (
                                    <MemberRow
                                        key={u.id}
                                        userId={u.id}
                                        name={u.first_name}
                                        birthSuffix={getBirthSuffix(
                                            u.birth_year,
                                        )}
                                        selected={isSel}
                                        isHost={isHost}
                                        onToggleSelect={
                                            toggleUser
                                        }
                                        onToggleHost={
                                            toggleHost
                                        }
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="shrink-0 px-4 pt-3 pb-safe bg-rh-bg-surface border-t border-rh-border-subtle">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                        isSubmitting ||
                        isLoading ||
                        selected.size === 0
                    }
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-rh-accent text-white text-sm font-semibold disabled:opacity-50 active:bg-rh-accent-hover transition-colors"
                >
                    <span>
                        {isSubmitting
                            ? "처리 중..."
                            : "일괄 등록하기"}
                    </span>
                    {!isSubmitting && (
                        <Check size={18} strokeWidth={2.5} />
                    )}
                </button>
            </div>
        </div>
    );
}

const MemberRow = memo(function MemberRow({
    userId,
    name,
    birthSuffix,
    selected,
    isHost,
    onToggleSelect,
    onToggleHost,
}: {
    userId: string;
    name: string;
    birthSuffix: string;
    selected: boolean;
    isHost: boolean;
    onToggleSelect: (id: string) => void;
    onToggleHost: (id: string) => void;
}) {
    return (
        <div className="flex items-center justify-between h-[52px] px-4 rounded-xl bg-rh-bg-surface">
            <button
                type="button"
                onClick={() => onToggleSelect(userId)}
                className="flex items-center gap-3 flex-1 min-w-0 h-full"
            >
                <AdminCheckbox
                    checked={selected}
                    onCheckedChange={() =>
                        onToggleSelect(userId)
                    }
                />
                <span className="text-sm text-white truncate">
                    {name}
                    {birthSuffix && (
                        <span className="text-rh-text-secondary">
                            ({birthSuffix})
                        </span>
                    )}
                </span>
            </button>
            <Switch
                checked={isHost}
                onCheckedChange={() => onToggleHost(userId)}
            />
        </div>
    );
});

export default memo(AdminBulkAttendanceSheet);
