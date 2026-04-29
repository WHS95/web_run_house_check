"use client";

import {
    useState,
    useEffect,
    useMemo,
    useCallback,
    memo,
    useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Check,
    Calendar,
    Clock,
    MapPin,
    Zap,
    Search,
    X,
    Users,
    CircleCheck,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import AdminCheckbox from
    "@/app/admin2/components/ui/AdminCheckbox";
import { Switch } from "@/components/ui/switch";
import { haptic } from "@/lib/haptic";
import { getAdminCrewUsersAction } from "@/app/admin2/actions";
import { createBulkAttendanceAction } from "@/app/admin2/attendance/actions";

/* ── 타입 ── */
interface UserRow {
    id: string;
    first_name: string;
    birth_year: number | null;
}
interface LocationRow {
    id: number;
    name: string;
}
interface ExerciseTypeRow {
    id: number;
    name: string;
}
interface Props {
    crewId: string;
    initialDate: string;
    onClose: () => void;
    onSuccess: () => void;
}

/* ── 유틸 ── */
function getBirthSuffix(year: number | null): string {
    if (!year) return "";
    return String(year).slice(-2);
}

function getKSTNow(): Date {
    return new Date(
        new Date().getTime() + 9 * 60 * 60 * 1000,
    );
}

function getNowKSTDate(): string {
    const kst = getKSTNow();
    const y = kst.getUTCFullYear();
    const m = (kst.getUTCMonth() + 1)
        .toString().padStart(2, "0");
    const d = kst.getUTCDate()
        .toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getNowKSTTime(): string {
    const kst = getKSTNow();
    const hh = kst.getUTCHours()
        .toString().padStart(2, "0");
    const mm = kst.getUTCMinutes();
    const mmRounded = (Math.floor(mm / 10) * 10)
        .toString().padStart(2, "0");
    return `${hh}:${mmRounded}`;
}

const TIME_OPTIONS = Array.from(
    { length: 24 },
    (_, h) =>
        ["00", "10", "20", "30", "40", "50"].map(
            (m) => ({
                value: `${h.toString().padStart(2, "0")}:${m}`,
                label: `${h.toString().padStart(2, "0")}:${m}`,
            }),
        ),
).flat();

/** 날짜 문자열을 M/D(요일) 포맷으로 */
function formatDateChip(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    const weekdays = [
        "일", "월", "화", "수", "목", "금", "토",
    ];
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const dow = weekdays[d.getDay()];
    return `${m}/${day}(${dow})`;
}

/* ── InfoChip ── */
const InfoChip = memo(function InfoChip({
    icon: Icon,
    label,
    active,
}: {
    icon: typeof Calendar;
    label: string;
    active: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-1 h-7 px-2 rounded-md ${
                active
                    ? "bg-rh-bg-primary"
                    : "bg-rh-bg-muted/30"
            }`}
        >
            <Icon
                size={12}
                className={
                    active
                        ? "text-rh-text-secondary"
                        : "text-rh-text-muted"
                }
            />
            <span
                className={`text-[11px] font-medium ${
                    active
                        ? "text-rh-text-secondary"
                        : "text-rh-text-muted"
                }`}
            >
                {label}
            </span>
        </div>
    );
});

/* ── UserRow ── */
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
        <div
            className="flex items-center gap-3 h-11 px-3 rounded-[10px] bg-rh-bg-surface"
        >
            <AdminCheckbox
                checked={selected}
                onCheckedChange={() => {
                    haptic.light();
                    onToggleSelect(userId);
                }}
                size={20}
            />
            <button
                type="button"
                onClick={() => {
                    haptic.light();
                    onToggleSelect(userId);
                }}
                className="flex-1 min-w-0 text-left"
            >
                <span
                    className="text-sm font-medium text-white truncate"
                >
                    {name}
                    {birthSuffix && (
                        <span className="text-rh-text-secondary">
                            ({birthSuffix})
                        </span>
                    )}
                </span>
            </button>
            {selected && (
                <div className="flex items-center gap-1.5 shrink-0">
                    {isHost && (
                        <span className="text-[11px] font-semibold text-rh-accent">
                            개설자
                        </span>
                    )}
                    <Switch
                        checked={isHost}
                        onCheckedChange={() => {
                            haptic.light();
                            onToggleHost(userId);
                        }}
                    />
                </div>
            )}
        </div>
    );
});

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */
function AdminBulkAttendanceSheet({
    crewId,
    initialDate,
    onClose,
    onSuccess,
}: Props) {
    /* ── 폼 상태 ── */
    const [date, setDate] = useState(getNowKSTDate);
    const [time, setTime] = useState(getNowKSTTime);
    const [locationId, setLocationId] = useState("");
    const [exerciseTypeId, setExerciseTypeId] =
        useState("");

    /* ── 데이터 ── */
    const [exerciseTypes, setExerciseTypes] = useState<
        ExerciseTypeRow[]
    >([]);
    const [locations, setLocations] = useState<
        LocationRow[]
    >([]);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] =
        useState(false);

    /* ── 유저 선택 ── */
    const [selected, setSelected] = useState<
        Set<string>
    >(new Set());
    const [hostIds, setHostIds] = useState<
        Set<string>
    >(new Set());

    /* ── UI 상태 ── */
    const [formExpanded, setFormExpanded] =
        useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState<
        "all" | "selected"
    >("all");
    const [confirmOpen, setConfirmOpen] =
        useState(false);
    const [guideMessage, setGuideMessage] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(
        null,
    );

    /* 필수 필드 완료 여부 */
    const allFieldsReady =
        !!date && !!time && !!locationId;

    /* 자동 접기: 필드가 "처음" 완성되는 순간에만 1회 작동.
       수동으로 "수정" ��튼을 눌러 다시 펼친 경우에는 작동하지 않음. */
    const hasAutoCollapsed = useRef(false);
    useEffect(() => {
        if (
            allFieldsReady &&
            formExpanded &&
            !isLoading &&
            !hasAutoCollapsed.current
        ) {
            const timer = setTimeout(() => {
                hasAutoCollapsed.current = true;
                setFormExpanded(false);
                haptic.light();
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [allFieldsReady, formExpanded, isLoading]);

    /* ── 데이터 로드 ── */
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const [uResult, sRes] = await Promise.all([
                    getAdminCrewUsersAction({ crewId }),
                    fetch(
                        `/api/admin/settings?crewId=${crewId}`,
                    ),
                ]);
                const sJson = await sRes.json();
                if (cancelled) return;
                if (
                    uResult.success &&
                    Array.isArray(uResult.data)
                ) {
                    setUsers(uResult.data as any);
                }
                if (sJson?.success && sJson.data) {
                    const locs: LocationRow[] =
                        sJson.data.locations || [];
                    setLocations(locs);
                    if (locs.length > 0) {
                        setLocationId(
                            String(locs[0].id),
                        );
                    }
                    const exTypes: ExerciseTypeRow[] =
                        sJson.data.exerciseTypes || [];
                    setExerciseTypes(exTypes);
                    if (exTypes.length > 0) {
                        setExerciseTypeId(
                            String(exTypes[0].id),
                        );
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

    /* ── 파생 데이터 ── */
    const locationName = useMemo(
        () =>
            locations.find(
                (l) => String(l.id) === locationId,
            )?.name || "",
        [locations, locationId],
    );

    const exerciseTypeName = useMemo(
        () =>
            exerciseTypes.find(
                (e) => String(e.id) === exerciseTypeId,
            )?.name || "",
        [exerciseTypes, exerciseTypeId],
    );

    const allSelected = useMemo(
        () =>
            users.length > 0 &&
            selected.size === users.length,
        [users.length, selected.size],
    );

    const filteredUsers = useMemo(() => {
        let list = users;
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter((u) =>
                u.first_name.toLowerCase().includes(q),
            );
        }
        if (filterTab === "selected") {
            list = list.filter((u) =>
                selected.has(u.id),
            );
        }
        return list;
    }, [users, searchQuery, filterTab, selected]);

    /* ── 핸들러 ── */
    const toggleAll = useCallback(() => {
        haptic.light();
        setSelected((prev) =>
            prev.size === users.length
                ? new Set()
                : new Set(users.map((u) => u.id)),
        );
    }, [users]);

    const toggleUser = useCallback(
        (userId: string) => {
            setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(userId)) {
                    next.delete(userId);
                } else {
                    next.add(userId);
                }
                return next;
            });
        },
        [],
    );

    const toggleHost = useCallback(
        (userId: string) => {
            setHostIds((prev) => {
                const next = new Set(prev);
                if (next.has(userId)) next.delete(userId);
                else next.add(userId);
                return next;
            });
        },
        [],
    );

    /* 가이드 메시지 자동 해제 */
    useEffect(() => {
        if (!guideMessage) return;
        const timer = setTimeout(
            () => setGuideMessage(""),
            2500,
        );
        return () => clearTimeout(timer);
    }, [guideMessage]);

    /* 제출 전 확인 */
    const handlePreSubmit = useCallback(() => {
        if (!allFieldsReady) {
            haptic.error();
            setGuideMessage(
                "날짜, 시간, 장소를 모두 선택해주세요.",
            );
            setFormExpanded(true);
            return;
        }
        if (selected.size === 0) {
            haptic.error();
            setGuideMessage(
                "출석 처리할 회원을 선택해주세요.",
            );
            return;
        }
        haptic.medium();
        setConfirmOpen(true);
    }, [allFieldsReady, selected.size]);

    /* 실제 제출 */
    const handleSubmit = useCallback(async () => {
        setConfirmOpen(false);
        setIsSubmitting(true);
        haptic.medium();
        try {
            const attendanceDateTime = new Date(
                `${date}T${time}:00`,
            );
            const payload = {
                crewId,
                users: Array.from(selected).map(
                    (userId) => ({
                        userId,
                        isHost: hostIds.has(userId),
                    }),
                ),
                attendanceTimestamp:
                    attendanceDateTime.toISOString(),
                locationId: parseInt(locationId, 10),
                exerciseTypeId: parseInt(
                    exerciseTypeId,
                    10,
                ),
            };
            const result =
                await createBulkAttendanceAction(payload);
            if (result.success) {
                haptic.success();
                onSuccess();
            } else {
                haptic.error();
                setGuideMessage(
                    result.message ||
                        "출석 처리 중 오류가 발생했습니다.",
                );
            }
        } catch {
            haptic.error();
            setGuideMessage(
                "출석 처리 중 오류가 발생했습니다.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }, [
        selected,
        hostIds,
        locationId,
        exerciseTypeId,
        date,
        time,
        crewId,
        onSuccess,
    ]);

    /* ── 렌더 ── */
    return (
        <>
            <div
                className="fixed inset-0 z-[60] flex flex-col bg-rh-bg-primary"
            >
                {/* Header — 56px */}
                <div
                    className="shrink-0 flex items-center justify-between h-14 px-4 bg-rh-bg-surface"
                >
                    <button
                        onClick={onClose}
                        className="flex items-center gap-3"
                        aria-label="닫기"
                    >
                        <ChevronLeft
                            size={24}
                            className="text-white"
                        />
                        <h2
                            className="text-lg font-semibold text-white"
                        >
                            일괄 출석 등록
                        </h2>
                    </button>
                    <div className="w-8" />
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-3"
                    style={{
                        overscrollBehavior: "contain",
                    }}
                >
                    {/* InfoSummary 칩 — 항상 표시 */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <InfoChip
                            icon={Calendar}
                            label={
                                date
                                    ? formatDateChip(date)
                                    : "날짜"
                            }
                            active={!!date}
                        />
                        <InfoChip
                            icon={Clock}
                            label={time || "시간"}
                            active={!!time}
                        />
                        <InfoChip
                            icon={MapPin}
                            label={
                                locationName || "장소"
                            }
                            active={!!locationId}
                        />
                        <InfoChip
                            icon={Zap}
                            label={
                                exerciseTypeName || "종류"
                            }
                            active={!!exerciseTypeId}
                        />
                        {/* 칩 영역 탭 → 폼 토글 */}
                        {!formExpanded && (
                            <button
                                type="button"
                                onClick={() => {
                                    haptic.light();
                                    setFormExpanded(true);
                                }}
                                className="ml-auto flex items-center gap-0.5 text-[11px] text-rh-accent font-medium"
                            >
                                수정
                                <ChevronDown size={12} />
                            </button>
                        )}
                    </div>

                    {/* 폼 섹션 (접기/펼치기) */}
                    <motion.div
                        animate={{
                            height: formExpanded
                                ? "auto"
                                : 0,
                            opacity: formExpanded
                                ? 1
                                : 0,
                        }}
                        initial={false}
                        transition={{
                            height: {
                                duration: 0.3,
                                ease: [0.32, 0.72, 0, 1],
                            },
                            opacity: {
                                duration: 0.2,
                            },
                        }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 pb-1">
                            {/* 날짜 */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    className="text-xs font-medium text-rh-text-secondary"
                                >
                                    날짜
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) =>
                                            setDate(
                                                e.target
                                                    .value,
                                            )
                                        }
                                        className="ios-date-input border border-rh-border text-sm text-white focus:border-rh-accent"
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
                                <label
                                    className="text-xs font-medium text-rh-text-secondary"
                                >
                                    시간
                                </label>
                                <div className="relative">
                                    <select
                                        value={time}
                                        onChange={(e) =>
                                            setTime(
                                                e.target
                                                    .value,
                                            )
                                        }
                                        className="w-full h-12 px-4 pr-10 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white appearance-none outline-none focus:border-rh-accent transition-colors"
                                    >
                                        {TIME_OPTIONS.map(
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

                            {/* 장소 */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    className="text-xs font-medium text-rh-text-secondary"
                                >
                                    장소
                                </label>
                                <div className="relative">
                                    <select
                                        value={locationId}
                                        onChange={(e) =>
                                            setLocationId(
                                                e.target
                                                    .value,
                                            )
                                        }
                                        className="w-full h-12 px-4 pr-10 rounded-lg bg-rh-bg-surface border border-rh-border text-sm text-white appearance-none outline-none focus:border-rh-accent transition-colors"
                                    >
                                        <option value="">
                                            {isLoading
                                                ? "불러오는 중..."
                                                : "장소를 선택해주세요"}
                                        </option>
                                        {locations.map(
                                            (l) => (
                                                <option
                                                    key={
                                                        l.id
                                                    }
                                                    value={String(
                                                        l.id,
                                                    )}
                                                >
                                                    {
                                                        l.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <MapPin
                                            size={18}
                                            className="text-rh-text-muted"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 운동 종류 */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    className="text-xs font-medium text-rh-text-secondary"
                                >
                                    운동 종류
                                </label>
                                {isLoading ? (
                                    <div className="h-10 rounded-lg bg-rh-bg-surface" />
                                ) : exerciseTypes.length ===
                                  0 ? (
                                    <div className="h-10 flex items-center px-4 rounded-lg bg-rh-bg-surface text-xs text-rh-text-secondary">
                                        등록된 운동 종류가
                                        없습니다.
                                    </div>
                                ) : (
                                    <div className="flex gap-2 flex-wrap">
                                        {exerciseTypes.map(
                                            (et) => {
                                                const isActive =
                                                    exerciseTypeId ===
                                                    String(
                                                        et.id,
                                                    );
                                                return (
                                                    <button
                                                        key={
                                                            et.id
                                                        }
                                                        type="button"
                                                        onClick={() => {
                                                            haptic.light();
                                                            setExerciseTypeId(
                                                                String(
                                                                    et.id,
                                                                ),
                                                            );
                                                        }}
                                                        className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                                                            isActive
                                                                ? "bg-rh-accent text-white"
                                                                : "bg-rh-bg-surface text-rh-text-secondary border border-rh-border"
                                                        }`}
                                                    >
                                                        {
                                                            et.name
                                                        }
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 접기 버튼 */}
                            {allFieldsReady && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        haptic.light();
                                        setFormExpanded(
                                            false,
                                        );
                                    }}
                                    className="flex items-center justify-center gap-1 w-full py-2 text-xs text-rh-text-tertiary"
                                >
                                    접기
                                    <ChevronUp
                                        size={14}
                                    />
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* 구분선 */}
                    <div className="h-px bg-rh-border" />

                    {/* 검색바 — .pen YmfNw */}
                    <div
                        className="flex items-center gap-2 h-10 px-3 rounded-lg bg-rh-bg-surface border border-rh-border"
                    >
                        <Search
                            size={18}
                            className="text-rh-text-muted shrink-0"
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="이름으로 검색..."
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(
                                    e.target.value,
                                )
                            }
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-rh-text-muted outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearchQuery("")
                                }
                                className="shrink-0"
                            >
                                <X
                                    size={16}
                                    className="text-rh-text-muted"
                                />
                            </button>
                        )}
                    </div>

                    {/* 필터 탭 — .pen hKAUD */}
                    <div className="flex">
                        <button
                            type="button"
                            onClick={() => {
                                haptic.light();
                                setFilterTab("all");
                            }}
                            className={`flex-1 flex items-center justify-center gap-1 h-9 rounded-l-lg text-[13px] font-medium transition-colors ${
                                filterTab === "all"
                                    ? "bg-rh-accent text-white"
                                    : "bg-rh-bg-surface text-rh-text-secondary border border-rh-border"
                            }`}
                        >
                            전체
                            <span
                                className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                                    filterTab === "all"
                                        ? "bg-white/30 text-white"
                                        : "bg-rh-accent text-white"
                                }`}
                            >
                                {users.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                haptic.light();
                                setFilterTab("selected");
                            }}
                            className={`flex-1 flex items-center justify-center gap-1 h-9 rounded-r-lg text-[13px] font-medium transition-colors ${
                                filterTab === "selected"
                                    ? "bg-rh-accent text-white"
                                    : "bg-rh-bg-surface text-rh-text-secondary border border-rh-border"
                            }`}
                        >
                            선택됨
                            <span
                                className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                                    filterTab ===
                                    "selected"
                                        ? "bg-white/30 text-white"
                                        : "bg-rh-accent text-white"
                                }`}
                            >
                                {selected.size}
                            </span>
                        </button>
                    </div>

                    {/* 전체 선택 — .pen lsmVj */}
                    <div
                        className="flex items-center justify-between h-10 px-3 rounded-lg bg-rh-bg-surface"
                    >
                        <span className="text-[13px] font-medium text-rh-text-secondary">
                            전체 선택
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-rh-accent">
                                {selected.size}/
                                {users.length}
                            </span>
                            <AdminCheckbox
                                checked={allSelected}
                                onCheckedChange={
                                    toggleAll
                                }
                                disabled={
                                    isLoading ||
                                    users.length === 0
                                }
                                size={20}
                            />
                        </div>
                    </div>

                    {/* 유저 리스트 */}
                    <div className="flex flex-col gap-1.5">
                        {isLoading ? (
                            <>
                                {[1, 2, 3, 4, 5].map(
                                    (i) => (
                                        <div
                                            key={i}
                                            className="h-11 rounded-[10px] bg-rh-bg-surface"
                                        />
                                    ),
                                )}
                            </>
                        ) : filteredUsers.length ===
                          0 ? (
                            <div className="py-8 text-center text-sm text-rh-text-secondary">
                                {searchQuery
                                    ? "검색 결과가 없습니다."
                                    : filterTab ===
                                        "selected"
                                      ? "선택된 회원이 없습니다."
                                      : "회원이 없습니다."}
                            </div>
                        ) : (
                            filteredUsers.map((u) => (
                                <MemberRow
                                    key={u.id}
                                    userId={u.id}
                                    name={u.first_name}
                                    birthSuffix={getBirthSuffix(
                                        u.birth_year,
                                    )}
                                    selected={selected.has(
                                        u.id,
                                    )}
                                    isHost={hostIds.has(
                                        u.id,
                                    )}
                                    onToggleSelect={
                                        toggleUser
                                    }
                                    onToggleHost={
                                        toggleHost
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div
                    className="shrink-0 px-4 pt-3 pb-safe bg-rh-bg-primary border-t border-rh-border-subtle"
                >
                    <button
                        type="button"
                        onClick={handlePreSubmit}
                        disabled={
                            isSubmitting || isLoading
                        }
                        className="flex items-center justify-center gap-2 w-full h-[52px] rounded-xl bg-rh-accent text-white text-base font-semibold disabled:opacity-50 active:bg-rh-accent-hover transition-colors"
                    >
                        <span>
                            {isSubmitting
                                ? "처리 중..."
                                : selected.size > 0
                                  ? `${selected.size}명 일괄 등록하기`
                                  : "일괄 등록하기"}
                        </span>
                        {!isSubmitting && (
                            <CircleCheck
                                size={18}
                                strokeWidth={2.5}
                            />
                        )}
                    </button>
                </div>
            </div>

            {/* ══ 가이드 토스트 ══ */}
            <AnimatePresence>
                {guideMessage && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: 20,
                        }}
                        transition={{
                            duration: 0.2,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        className="fixed z-[65] left-4 right-4 bottom-28 flex items-center gap-2 px-4 py-3 rounded-xl bg-rh-bg-surface border border-rh-border shadow-lg"
                    >
                        <span className="text-sm text-white">
                            {guideMessage}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══ 확인 모달 ══ */}
            <AnimatePresence>
                {confirmOpen && (
                    <ConfirmModal
                        selectedCount={selected.size}
                        totalCount={users.length}
                        dateLabel={formatDateChip(date)}
                        timeLabel={time}
                        locationLabel={locationName}
                        exerciseLabel={exerciseTypeName}
                        selectedUsers={users.filter(
                            (u) => selected.has(u.id),
                        )}
                        hostIds={hostIds}
                        isSubmitting={isSubmitting}
                        onCancel={() =>
                            setConfirmOpen(false)
                        }
                        onConfirm={handleSubmit}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ── 확인 모달 ── */
const ConfirmModal = memo(function ConfirmModal({
    selectedCount,
    totalCount,
    dateLabel,
    timeLabel,
    locationLabel,
    exerciseLabel,
    selectedUsers,
    hostIds,
    isSubmitting,
    onCancel,
    onConfirm,
}: {
    selectedCount: number;
    totalCount: number;
    dateLabel: string;
    timeLabel: string;
    locationLabel: string;
    exerciseLabel: string;
    selectedUsers: UserRow[];
    hostIds: Set<string>;
    isSubmitting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const previewCount = 3;
    const previewUsers = expanded
        ? selectedUsers
        : selectedUsers.slice(0, previewCount);
    const remaining =
        selectedUsers.length - previewCount;

    return (
        <>
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[70]"
                style={{
                    backgroundColor: "#00000080",
                }}
                onClick={onCancel}
            />

            {/* Modal — .pen QBfLi */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{
                    duration: 0.2,
                    ease: [0.32, 0.72, 0, 1],
                }}
                className="fixed z-[71] left-5 right-5 rounded-2xl bg-rh-bg-surface p-6 space-y-4"
                style={{ top: 140 }}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                        일괄 등록 확인
                    </h3>
                    <button
                        type="button"
                        onClick={onCancel}
                    >
                        <X
                            size={22}
                            className="text-rh-text-secondary"
                        />
                    </button>
                </div>

                {/* 요약 */}
                <div className="flex items-center gap-3">
                    <Users
                        size={28}
                        className="text-rh-accent shrink-0"
                    />
                    <div>
                        <p className="text-[15px] font-semibold text-white">
                            {selectedCount}명의
                            출석을 등록합니다
                        </p>
                        <p className="text-xs text-rh-text-secondary">
                            전체 {totalCount}명 중{" "}
                            {selectedCount}명 선택됨
                        </p>
                    </div>
                </div>

                {/* 정보 칩 */}
                <div className="flex flex-wrap gap-1.5">
                    <InfoChip
                        icon={Calendar}
                        label={dateLabel}
                        active
                    />
                    <InfoChip
                        icon={Clock}
                        label={timeLabel}
                        active
                    />
                    <InfoChip
                        icon={MapPin}
                        label={locationLabel}
                        active
                    />
                    <InfoChip
                        icon={Zap}
                        label={exerciseLabel}
                        active
                    />
                </div>

                {/* 구분선 */}
                <div className="h-px bg-rh-border" />

                {/* 유저 미리보기 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-rh-text-secondary">
                            출석 등록 회원
                        </span>
                        {remaining > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setExpanded(
                                        !expanded,
                                    )
                                }
                                className="flex items-center gap-0.5 text-xs text-rh-text-muted"
                            >
                                {expanded
                                    ? "접기"
                                    : "전체 보기"}
                                {expanded ? (
                                    <ChevronUp
                                        size={14}
                                    />
                                ) : (
                                    <ChevronDown
                                        size={14}
                                    />
                                )}
                            </button>
                        )}
                    </div>
                    {previewUsers.map((u) => (
                        <div
                            key={u.id}
                            className="flex items-center gap-2"
                        >
                            <CircleCheck
                                size={16}
                                className="text-rh-accent shrink-0"
                            />
                            <span className="text-[13px] font-medium text-white">
                                {u.first_name}
                                {u.birth_year && (
                                    <span className="text-rh-text-secondary">
                                        (
                                        {getBirthSuffix(
                                            u.birth_year,
                                        )}
                                        )
                                    </span>
                                )}
                            </span>
                            {hostIds.has(u.id) && (
                                <span className="px-2 py-0.5 rounded-full bg-rh-accent text-[10px] font-semibold text-white">
                                    개설자
                                </span>
                            )}
                        </div>
                    ))}
                    {remaining > 0 && !expanded && (
                        <button
                            type="button"
                            onClick={() =>
                                setExpanded(true)
                            }
                            className="flex items-center justify-center gap-1 w-full h-8 rounded-lg bg-rh-bg-primary text-xs font-medium text-rh-text-muted"
                        >
                            외 {remaining}명 더보기
                            <ChevronDown size={14} />
                        </button>
                    )}
                    {expanded && remaining > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                setExpanded(false)
                            }
                            className="flex items-center justify-center gap-1 w-full h-8 rounded-lg bg-rh-bg-primary text-xs font-medium text-rh-text-muted"
                        >
                            접기
                            <ChevronUp size={14} />
                        </button>
                    )}
                </div>

                {/* 버튼 */}
                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center h-11 rounded-xl bg-rh-bg-primary border border-rh-border text-sm font-semibold text-rh-text-secondary disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white disabled:opacity-50 active:bg-rh-accent-hover transition-colors"
                    >
                        {isSubmitting
                            ? "처리 중..."
                            : "등록하기"}
                    </button>
                </div>
            </motion.div>
        </>
    );
});

export default memo(AdminBulkAttendanceSheet);
