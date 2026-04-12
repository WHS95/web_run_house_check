"use client";

import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    memo,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
    X,
    Calendar,
    Clock,
    Search,
    ChevronDown,
    ChevronLeft,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AttendanceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    attendance: {
        id: string;
        userId: string;
        userName: string;
        checkInTime: string;
        location: string;
        exerciseType: string;
        isHost: boolean;
    };
    onSave: (attendanceData: {
        checkInTime: string;
        location: string;
        isHost: boolean;
    }) => Promise<void>;
    crewId?: string;
    onDelete?: (recordId: string) => void;
}

/* 10분 단위 시간 옵션 (00:00 ~ 23:50) */
const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
    ["00", "10", "20", "30", "40", "50"].map((m) => ({
        value: `${h.toString().padStart(2, "0")}:${m}`,
        label: `${h.toString().padStart(2, "0")}:${m}`,
    })),
).flat();

/* ISO 문자열 → 로컬 YYYY-MM-DD / HH:mm 분리 */
function splitDateTime(iso: string): {
    date: string;
    time: string;
} {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return {
        date: `${y}-${m}-${day}`,
        time: `${hh}:${mm}`,
    };
}

/* YYYY-MM-DD + HH:mm → ISO 문자열 (로컬 기준) */
function joinDateTime(date: string, time: string): string {
    return new Date(`${date}T${time}:00`).toISOString();
}

const AttendanceEditModal: React.FC<
    AttendanceEditModalProps
> = memo(
    ({
        isOpen,
        onClose,
        attendance,
        onSave,
        crewId,
        onDelete,
    }) => {
        const initial = useMemo(
            () => splitDateTime(attendance.checkInTime),
            [attendance.checkInTime],
        );

        const [dateStr, setDateStr] = useState(initial.date);
        const [timeStr, setTimeStr] = useState(initial.time);
        const [location, setLocation] = useState(
            attendance.location,
        );
        const [isHost, setIsHost] = useState(
            attendance.isHost,
        );
        const [isLoading, setIsLoading] = useState(false);
        const [locations, setLocations] = useState<
            Array<{ id: number; name: string }>
        >([]);
        const [
            showLocationPicker,
            setShowLocationPicker,
        ] = useState(false);
        const [locationSearch, setLocationSearch] =
            useState("");

        /* 출석 레코드 변경 시 폼 리셋 */
        useEffect(() => {
            const next = splitDateTime(
                attendance.checkInTime,
            );
            setDateStr(next.date);
            setTimeStr(next.time);
            setLocation(attendance.location);
            setIsHost(attendance.isHost);
            setShowLocationPicker(false);
            setLocationSearch("");
        }, [attendance]);

        const supabase = useMemo(
            () =>
                createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env
                        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                ),
            [],
        );

        /* 크루 활동 장소 조회 */
        useEffect(() => {
            if (!isOpen || !crewId) return;
            let cancelled = false;
            (async () => {
                const { data, error } = await supabase
                    .schema("attendance")
                    .from("crew_locations")
                    .select("id, name")
                    .eq("crew_id", crewId)
                    .eq("is_active", true)
                    .order("name");
                if (!cancelled && !error && data) {
                    setLocations(data);
                }
            })();
            return () => {
                cancelled = true;
            };
        }, [isOpen, crewId, supabase]);

        /* 현재 시간이 10분 단위가 아니면 맨 앞에 원본 유지용 옵션 추가 */
        const timeOptions = useMemo(() => {
            if (
                TIME_OPTIONS.find(
                    (o) => o.value === timeStr,
                )
            ) {
                return TIME_OPTIONS;
            }
            return [
                {
                    value: timeStr,
                    label: `${timeStr} (원본)`,
                },
                ...TIME_OPTIONS,
            ];
        }, [timeStr]);

        /* 검색 필터링된 장소 */
        const filteredLocations = useMemo(() => {
            const q = locationSearch.trim().toLowerCase();
            if (!q) return locations;
            return locations.filter((l) =>
                l.name.toLowerCase().includes(q),
            );
        }, [locations, locationSearch]);

        const handleSave = useCallback(async () => {
            setIsLoading(true);
            try {
                await onSave({
                    checkInTime: joinDateTime(
                        dateStr,
                        timeStr,
                    ),
                    location,
                    isHost,
                });
                onClose();
            } catch {
                // 저장 실패 시 무시
            } finally {
                setIsLoading(false);
            }
        }, [
            dateStr,
            timeStr,
            location,
            isHost,
            onSave,
            onClose,
        ]);

        const handleDelete = useCallback(() => {
            onDelete?.(attendance.id);
        }, [onDelete, attendance.id]);

        const handleLocationSelect = useCallback(
            (name: string) => {
                setLocation(name);
                setShowLocationPicker(false);
                setLocationSearch("");
            },
            [],
        );

        const closeLocationPicker = useCallback(() => {
            setShowLocationPicker(false);
            setLocationSearch("");
        }, []);

        if (!isOpen) return null;

        return (
            <div className="absolute inset-0 z-50 flex justify-center items-center">
                {/* Overlay */}
                <div
                    className="absolute inset-0 bg-black/50"
                    onClick={onClose}
                />

                {/* Modal */}
                <div
                    className={
                        "relative mx-5 w-full " +
                        "max-w-[360px] " +
                        "bg-rh-bg-surface rounded-2xl " +
                        "flex flex-col " +
                        "max-h-[calc(100dvh-80px)] " +
                        "overflow-hidden"
                    }
                >
                    {showLocationPicker ? (
                        /* ===== 장소 선택 모드 ===== */
                        <>
                            {/* Header (뒤로 + 타이틀) */}
                            <div className="flex items-center gap-2 px-4 pt-5 pb-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={
                                        closeLocationPicker
                                    }
                                    className="p-1 -ml-1 text-rh-text-secondary hover:text-white transition-colors"
                                    aria-label="뒤로"
                                >
                                    <ChevronLeft
                                        size={22}
                                    />
                                </button>
                                <h2 className="text-base font-semibold text-white">
                                    참여장소 선택
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="ml-auto p-1 -mr-1 text-rh-text-secondary hover:text-white transition-colors"
                                    aria-label="닫기"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* 검색 */}
                            <div className="px-4 pb-3 shrink-0">
                                <div className="relative">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-rh-text-muted pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        value={
                                            locationSearch
                                        }
                                        onChange={(e) =>
                                            setLocationSearch(
                                                e.target
                                                    .value,
                                            )
                                        }
                                        placeholder="장소 검색"
                                        autoFocus
                                        className={
                                            "w-full h-11 pl-9 pr-3 " +
                                            "rounded-lg " +
                                            "bg-rh-bg-inset " +
                                            "border border-rh-border " +
                                            "text-sm text-white " +
                                            "placeholder:text-rh-text-muted " +
                                            "outline-none " +
                                            "focus:border-rh-accent"
                                        }
                                    />
                                </div>
                            </div>

                            {/* 리스트 — 본문 남는 공간 전부 사용 */}
                            <div
                                className="flex-1 overflow-y-auto px-2 pb-2"
                                style={{
                                    overscrollBehavior:
                                        "contain",
                                }}
                            >
                                {filteredLocations.length >
                                0 ? (
                                    <div className="flex flex-col gap-0.5">
                                        {filteredLocations.map(
                                            (l) => {
                                                const active =
                                                    l.name ===
                                                    location;
                                                return (
                                                    <button
                                                        key={
                                                            l.id
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            handleLocationSelect(
                                                                l.name,
                                                            )
                                                        }
                                                        className={
                                                            "w-full px-4 py-3 " +
                                                            "rounded-lg " +
                                                            "text-left text-sm " +
                                                            "transition-colors " +
                                                            (active
                                                                ? "bg-rh-accent/15 text-rh-accent font-semibold"
                                                                : "text-white hover:bg-rh-bg-muted/30 active:bg-rh-bg-muted/40")
                                                        }
                                                    >
                                                        {
                                                            l.name
                                                        }
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-40 px-4 text-sm text-rh-text-tertiary">
                                        {locations.length ===
                                        0
                                            ? "등록된 장소가 없습니다"
                                            : "검색 결과가 없습니다"}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ===== 기본 폼 모드 ===== */
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
                                <h2 className="text-lg font-semibold text-white">
                                    출석 수정
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-rh-text-secondary hover:text-white transition-colors"
                                    aria-label="닫기"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            {/* Body */}
                            <div
                                className="flex-1 overflow-y-auto px-6 pb-4 space-y-4"
                                style={{
                                    overscrollBehavior:
                                        "contain",
                                }}
                            >
                                {/* 날짜 */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-rh-text-secondary">
                                        날짜
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={dateStr}
                                            onChange={(e) =>
                                                setDateStr(
                                                    e.target
                                                        .value,
                                                )
                                            }
                                            className="ios-date-input border border-rh-border text-sm text-white focus:border-rh-accent pr-10"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                            <Calendar
                                                size={18}
                                                className="text-rh-text-muted"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 시간 */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-rh-text-secondary">
                                        시간
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={timeStr}
                                            onChange={(e) =>
                                                setTimeStr(
                                                    e.target
                                                        .value,
                                                )
                                            }
                                            className={
                                                "w-full h-12 px-4 pr-10 " +
                                                "rounded-lg bg-rh-bg-surface " +
                                                "border border-rh-border " +
                                                "text-sm text-white " +
                                                "appearance-none outline-none " +
                                                "focus:border-rh-accent " +
                                                "transition-colors"
                                            }
                                        >
                                            {timeOptions.map(
                                                (opt) => (
                                                    <option
                                                        key={
                                                            opt.value
                                                        }
                                                        value={
                                                            opt.value
                                                        }
                                                    >
                                                        {
                                                            opt.label
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                            <Clock
                                                size={18}
                                                className="text-rh-text-muted"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 벙주여부 — SwitchRow */}
                                <div
                                    className={
                                        "flex items-center justify-between " +
                                        "gap-3 h-14 px-4 " +
                                        "rounded-lg bg-rh-bg-surface " +
                                        "border border-rh-border"
                                    }
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm text-white font-medium leading-tight">
                                            벙주여부
                                        </span>
                                        <span className="text-[11px] text-rh-text-tertiary leading-tight mt-0.5">
                                            {isHost
                                                ? "벙주로 참여"
                                                : "일반 참여"}
                                        </span>
                                    </div>
                                    <Switch
                                        checked={isHost}
                                        onCheckedChange={
                                            setIsHost
                                        }
                                    />
                                </div>

                                {/* 참여장소 */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-rh-text-secondary">
                                        참여장소
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowLocationPicker(
                                                true,
                                            )
                                        }
                                        className={
                                            "flex items-center justify-between " +
                                            "gap-2 w-full h-12 px-4 " +
                                            "bg-rh-bg-surface " +
                                            "rounded-lg border border-rh-border " +
                                            "text-left " +
                                            "active:bg-rh-bg-muted/20 " +
                                            "transition-colors"
                                        }
                                    >
                                        <span
                                            className={
                                                location
                                                    ? "text-sm text-white truncate"
                                                    : "text-sm text-rh-text-muted"
                                            }
                                        >
                                            {location ||
                                                "선택해주세요"}
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            className="text-rh-text-muted shrink-0 -rotate-90"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 px-6 pb-6 pt-2">
                                <div className="h-px bg-rh-border mb-4" />
                                <div className="flex gap-2">
                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={
                                                handleDelete
                                            }
                                            disabled={
                                                isLoading
                                            }
                                            className={
                                                "flex-1 h-11 " +
                                                "rounded-xl " +
                                                "text-sm font-semibold " +
                                                "text-white " +
                                                "transition-colors " +
                                                "disabled:opacity-50"
                                            }
                                            style={{
                                                backgroundColor:
                                                    "#3E6496",
                                            }}
                                        >
                                            기록 삭제
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className={
                                            "flex-1 h-11 " +
                                            "rounded-xl " +
                                            "text-sm font-semibold " +
                                            "text-white " +
                                            "bg-rh-accent " +
                                            "hover:bg-rh-accent-hover " +
                                            "transition-colors " +
                                            "disabled:opacity-50"
                                        }
                                    >
                                        {isLoading
                                            ? "저장 중..."
                                            : "저장"}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    },
);

AttendanceEditModal.displayName = "AttendanceEditModal";

export default AttendanceEditModal;
