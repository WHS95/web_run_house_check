"use client";

import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
    useRef,
    memo,
} from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import {
    motion,
    useMotionValue,
    useTransform,
    animate,
} from "framer-motion";
import { MapPin, WifiOff, CloudUpload } from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";
import PopupNotification, {
    NotificationType,
} from "@/components/molecules/common/PopupNotification";
import LocationVerificationModal from "@/components/molecules/LocationVerificationModal";
import LocationStatusIndicator from "@/components/molecules/LocationStatusIndicator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/atoms/FadeIn";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { haptic } from "@/lib/haptic";
import { useOfflineAttendance } from "@/hooks/useOfflineAttendance";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDistance, formatDistance } from "@/lib/utils/distance";
import { submitAttendance } from "@/app/attendance/actions";

// 한국 시간 유틸: UTC+9 기준으로 안정적 계산
const getKoreaDate = () => {
    const now = new Date();
    const koreaMs =
        now.getTime() +
        now.getTimezoneOffset() * 60000 +
        9 * 60 * 60000;
    return new Date(koreaMs);
};

// 한국 시간 기준 현재 시각을 10분 단위로 올림 (디폴트 시간용)
const getCurrentTime = () => {
    const korea = getKoreaDate();
    let h = korea.getHours();
    let m = korea.getMinutes();
    const remainder = m % 10;
    if (remainder !== 0) {
        m += 10 - remainder;
    }
    if (m >= 60) {
        h = (h + 1) % 24;
        m = 0;
    }
    return `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}`;
};

const getTodayString = () => {
    const korea = getKoreaDate();
    const y = korea.getFullYear();
    const m = (korea.getMonth() + 1).toString().padStart(2, "0");
    const d = korea.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const isFutureDateTime = (date: string, time: string) => {
    const [h, min] = time.split(":").map(Number);
    const [y, mo, d] = date.split("-").map(Number);
    const selectedMinutes =
        (y * 10000 + mo * 100 + d) * 1440 + h * 60 + min;

    const korea = getKoreaDate();
    const maxTime = new Date(korea.getTime() + 2 * 60 * 60000);
    const maxY = maxTime.getFullYear();
    const maxMo = maxTime.getMonth() + 1;
    const maxD = maxTime.getDate();
    const maxMinutes =
        (maxY * 10000 + maxMo * 100 + maxD) * 1440 +
        maxTime.getHours() * 60 +
        maxTime.getMinutes();

    return selectedMinutes > maxMinutes;
};

// 24시간 전체 10분 단위 옵션 (144개)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
    ["00", "10", "20", "30", "40", "50"].map((m) => ({
        value: `${h.toString().padStart(2, "0")}:${m}`,
        label: `${h.toString().padStart(2, "0")}:${m}`,
    }))
).flat();

/* 미등록 장소 고정 ID */
const UNREGISTERED_LOCATION_ID = "unregistered";

interface CrewInfo {
    id: string;
    name: string;
    location_based_attendance?: boolean;
    accuracy_range?: number;
    allow_unregistered_location?: boolean;
}

interface CrewLocation {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    allowed_radius?: number;
}

interface ClientAttendancePageProps {
    initialFormData?: {
        userName: string;
        crewInfo: CrewInfo;
        locationOptions: { value: string; label: string }[];
        exerciseOptions: { value: string; label: string }[];
        crewLocations?: CrewLocation[];
    };
    userStatus?: any;
    userId?: string;
    error?: string;
    canHost?: boolean;
}

const DEFAULT_ACCURACY_RANGE = 200;

/* ============================================================
 * MiniMap — sc-att 사양: 카토그래픽 미니맵 + GPS 핀 + 점선 사거리
 * 좌상단 .crd 카드(장소명·거리), 우상단 .scl 스케일 라벨 floating
 *
 * 정적 SVG 미니맵: 실제 지도 줌이 없으므로 외곽 점선 원(r=44)이
 * accuracyRange를 시각적으로 표현하고, .scl은 그에 대응하는
 * 스케일 바 길이(accuracyRange / 2 반올림) 라벨을 노출.
 * .crd 거리는 GPS-크루좌표 haversine 실측(distanceMeters)으로 표시,
 * 미수신/미선택 시 accuracyRange fallback.
 * ============================================================ */
const MiniMap = memo(function MiniMap({
    locationLabel,
    accuracyRange,
    distanceMeters,
}: {
    locationLabel: string;
    accuracyRange: number;
    distanceMeters: number | null;
}) {
    const distanceLabel =
        distanceMeters !== null && Number.isFinite(distanceMeters)
            ? formatDistance(distanceMeters)
            : `${accuracyRange}m 이내`;
    // 시각 스케일바: accuracyRange의 절반을 10m 단위로 라운딩 (최소 10m)
    const scaleBarMeters = Math.max(
        10,
        Math.round(accuracyRange / 20) * 10,
    );
    return (
        <div className="relative h-[150px] rounded-rh-md bg-rh-bg-surface overflow-hidden border border-rh-border">
            {/* 격자(거리) SVG */}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 320 150"
                preserveAspectRatio="none"
                aria-hidden
            >
                {/* 도로 라인 (가로) */}
                <line
                    x1="0"
                    y1="48"
                    x2="320"
                    y2="48"
                    stroke="var(--rh-border)"
                    strokeWidth="1"
                />
                <line
                    x1="0"
                    y1="104"
                    x2="320"
                    y2="104"
                    stroke="var(--rh-border)"
                    strokeWidth="1"
                />
                {/* 도로 라인 (세로) */}
                <line
                    x1="100"
                    y1="0"
                    x2="100"
                    y2="150"
                    stroke="var(--rh-border)"
                    strokeWidth="1"
                />
                <line
                    x1="220"
                    y1="0"
                    x2="220"
                    y2="150"
                    stroke="var(--rh-border)"
                    strokeWidth="1"
                />
                {/* 점선 사거리 (정확도 반경) */}
                <circle
                    cx="160"
                    cy="75"
                    r="44"
                    fill="rgba(184,230,31,0.10)"
                    stroke="var(--rh-accent)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                />
                <circle
                    cx="160"
                    cy="75"
                    r="28"
                    fill="rgba(184,230,31,0.18)"
                    stroke="var(--rh-accent)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                />
            </svg>

            {/* 좌상단 floating crd 카드 (장소·실거리) */}
            <div className="absolute top-2.5 left-3 rh-mono text-[10px] text-rh-text-secondary bg-rh-bg-primary/80 backdrop-blur-sm border border-rh-border rounded-md px-2 py-1 max-w-[60%] truncate">
                <b className="font-medium text-rh-accent-hover">
                    {locationLabel}
                </b>
                <span className="ml-1">· {distanceLabel}</span>
            </div>

            {/* 우상단 floating scl 스케일 바 (정적 SVG → accuracyRange 기반 시각 스케일) */}
            <div className="absolute top-2.5 right-3 flex items-center gap-1 rh-mono text-[10px] text-rh-text-tertiary bg-rh-bg-primary/80 backdrop-blur-sm border border-rh-border rounded-md px-2 py-1">
                <span
                    aria-hidden
                    className="inline-block h-px w-5 bg-rh-text-tertiary"
                />
                <span>{scaleBarMeters}m</span>
            </div>

            {/* GPS 핀 (라임) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <div className="absolute inset-0 -m-1.5 rounded-full bg-rh-accent/30 animate-ping" />
                    <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-rh-accent shadow-lg">
                        <MapPin
                            size={14}
                            strokeWidth={2.4}
                            className="text-rh-text-inverted"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

/* ============================================================
 * ChipRow — 선택형 칩 행
 * ============================================================ */
const ChipRow = memo(function ChipRow({
    options,
    value,
    onChange,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex gap-2 flex-wrap">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className="rh-chip"
                    data-on={value === opt.value ? "true" : "false"}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
});

const ClientAttendancePage: React.FC<ClientAttendancePageProps> = ({
    initialFormData,
    userStatus,
    userId,
    error,
    canHost = true,
}) => {
    const router = useRouter();
    const { isOnline, queueCount, enqueue, isFlushing } =
        useOfflineAttendance();
    const { location: geoLocation } = useGeolocation();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] =
        useState<NotificationType | null>(null);
    const [notificationMessage, setNotificationMessage] = useState("");

    const [showLocationModal, setShowLocationModal] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // 배너(오프라인/대기열) collapse 진행도 (0=펼침, 1=접힘)
    const bannerProgress = useMotionValue(0);
    const bannerMaxHeight = useTransform(
        bannerProgress,
        [0, 1],
        [60, 0],
    );
    const bannerOpacity = useTransform(bannerProgress, [0, 1], [1, 0]);

    /* iOS gesture 패턴: 스크롤 컨테이너에 pointer 리스너 등록 */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        let startY = 0;
        let startProgress = 0;
        let startTime = 0;
        let mode: "idle" | "collapse" | "scroll" = "idle";
        const SENSITIVITY = 100;
        const VELOCITY_THRESHOLD = 400;

        const onPointerDown = (e: PointerEvent) => {
            startY = e.clientY;
            startTime = e.timeStamp;
            startProgress = bannerProgress.get();
            mode = "idle";
        };

        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerType === "mouse" && e.buttons === 0) return;
            const dy = e.clientY - startY;

            if (mode === "idle") {
                if (Math.abs(dy) < 5) return;
                const atTop = el.scrollTop <= 0;
                const cur = bannerProgress.get();
                const fingerDown = dy > 0;
                const fingerUp = dy < 0;

                if (cur > 0.5 && fingerDown) {
                    mode = "collapse";
                } else if (cur < 0.5 && atTop && fingerUp) {
                    mode = "collapse";
                } else {
                    mode = "scroll";
                }
            }

            if (mode === "collapse") {
                const newProg = Math.max(
                    0,
                    Math.min(1, startProgress + -dy / SENSITIVITY),
                );
                bannerProgress.set(newProg);
            }
        };

        const onPointerEnd = (e: PointerEvent) => {
            if (mode !== "collapse") {
                mode = "idle";
                return;
            }
            const elapsed = e.timeStamp - startTime;
            const dy = e.clientY - startY;
            const velocity = elapsed > 0 ? (-dy / elapsed) * 1000 : 0;
            const cur = bannerProgress.get();

            let target = cur > 0.5 ? 1 : 0;
            if (velocity > VELOCITY_THRESHOLD) target = 1;
            else if (velocity < -VELOCITY_THRESHOLD) target = 0;

            animate(bannerProgress, target, {
                type: "spring",
                damping: 30,
                stiffness: 350,
            });
            mode = "idle";
        };

        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", onPointerEnd);
        el.addEventListener("pointercancel", onPointerEnd);

        return () => {
            el.removeEventListener("pointerdown", onPointerDown);
            el.removeEventListener("pointermove", onPointerMove);
            el.removeEventListener("pointerup", onPointerEnd);
            el.removeEventListener("pointercancel", onPointerEnd);
        };
    }, [bannerProgress]);

    /* desktop wheel 제스처 */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        let endTimer: ReturnType<typeof setTimeout> | null = null;

        const snap = () => {
            const cur = bannerProgress.get();
            const target = cur > 0.5 ? 1 : 0;
            if (cur !== target) {
                animate(bannerProgress, target, {
                    type: "spring",
                    damping: 30,
                    stiffness: 350,
                });
            }
        };

        const onWheel = (e: WheelEvent) => {
            const cur = bannerProgress.get();
            const atTop = el.scrollTop <= 0;
            if (!atTop) return;

            const dy = e.deltaY;
            if (dy > 0 && cur < 1) {
                bannerProgress.set(Math.min(1, cur + dy / 60));
                e.preventDefault();
            } else if (dy < 0 && cur > 0) {
                bannerProgress.set(Math.max(0, cur + dy / 60));
                e.preventDefault();
            } else {
                return;
            }

            if (endTimer) clearTimeout(endTimer);
            endTimer = setTimeout(snap, 150);
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            el.removeEventListener("wheel", onWheel);
            if (endTimer) clearTimeout(endTimer);
        };
    }, [bannerProgress]);

    // 초기 폼 데이터 (SSR/CSR 일치를 위해 날짜/시간은 빈 값으로 시작)
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState(() => {
        if (initialFormData) {
            return {
                name: initialFormData.userName,
                date: "",
                time: "",
                location:
                    initialFormData.locationOptions[0]?.value || "",
                exerciseType:
                    initialFormData.exerciseOptions[0]?.value || "",
                isHost: "아니오",
            };
        }
        return {
            name: "",
            date: "",
            time: "",
            location: "",
            exerciseType: "",
            isHost: "아니오",
        };
    });

    // 마운트 후 클라이언트 기준 현재 날짜/시간 설정 (hydration 불일치 방지)
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            date: getTodayString(),
            time: getCurrentTime(),
        }));
        setMounted(true);
    }, []);

    const handleFormChange = useCallback(
        (field: string, value: string) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    // 실제 출석 제출 처리
    const proceedWithSubmission = useCallback(async () => {
        setIsSubmitting(true);
        haptic.medium();

        setNotificationType("loading");
        setNotificationMessage("출석 처리 중...");
        setShowNotification(true);

        try {
            // 출석 등록은 항상 오늘 기준 — 디자인은 시각만 노출하고
            // 날짜는 KST 오늘로 자동 고정 (자정 경계 페이지 stale 방지)
            const todayKst = getTodayString();
            const attendanceDateTime = new Date(
                `${todayKst}T${formData.time}:00`,
            );

            const submissionData = {
                userId,
                crewId: initialFormData!.crewInfo.id,
                locationId: formData.location,
                exerciseTypeId: formData.exerciseType,
                isHost: formData.isHost === "예",
                attendanceTimestamp: attendanceDateTime.toISOString(),
            };

            // 오프라인 상태: 큐에 저장
            if (!isOnline) {
                await enqueue({
                    userId: submissionData.userId!,
                    crewId: submissionData.crewId,
                    locationId: Number(submissionData.locationId),
                    exerciseTypeId: Number(
                        submissionData.exerciseTypeId,
                    ),
                    isHost: submissionData.isHost,
                    attendanceTimestamp:
                        submissionData.attendanceTimestamp,
                });
                posthog.capture("attendance_queued_offline", {
                    crew_id: submissionData.crewId,
                    location_id: submissionData.locationId,
                    exercise_type_id: submissionData.exerciseTypeId,
                    is_host: submissionData.isHost,
                });
                haptic.success();
                setNotificationType("success");
                setNotificationMessage(
                    "오프라인 출석이 저장되었습니다. 연결 시 자동 전송됩니다.",
                );
                setIsSubmitting(false);
                setShowNotification(true);
                return;
            }

            const result = await submitAttendance(submissionData);

            if (result.success) {
                posthog.capture("attendance_submitted", {
                    crew_id: submissionData.crewId,
                    location_id: submissionData.locationId,
                    exercise_type_id: submissionData.exerciseTypeId,
                    is_host: submissionData.isHost,
                });
                haptic.success();
                setNotificationType("success");
                setNotificationMessage("출석이 완료되었습니다!");
            } else {
                posthog.captureException(
                    new Error(result.message || "attendance_failed"),
                );
                haptic.error();
                setNotificationType("error");
                setNotificationMessage(
                    result.message ||
                        "출석 처리 중 오류가 발생했습니다.",
                );
            }
        } catch (error) {
            posthog.captureException(error);
            haptic.error();
            setNotificationType("error");
            setNotificationMessage("네트워크 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
            setShowNotification(true);
        }
    }, [formData, initialFormData, userId, isOnline, enqueue]);

    // 위치 검증 완료 핸들러
    const handleLocationVerified = useCallback(
        (isVerified: boolean, message: string) => {
            setShowLocationModal(false);

            if (isVerified) {
                proceedWithSubmission();
            } else {
                haptic.error();
                setNotificationType("error");
                setNotificationMessage(message);
                setShowNotification(true);
            }
        },
        [proceedWithSubmission],
    );

    const handleSubmit = useCallback(async () => {
        if (isSubmitting || !userId) return;

        if (userStatus && !userStatus.isActive) {
            haptic.error();
            setNotificationType("error");
            setNotificationMessage(
                `${userStatus.statusMessage}\n\n${userStatus.suspensionReason}`,
            );
            setShowNotification(true);
            return;
        }

        if (isFutureDateTime(getTodayString(), formData.time)) {
            haptic.error();
            setNotificationType("error");
            setNotificationMessage("허용된 시간 범위를 초과했습니다.");
            setShowNotification(true);
            return;
        }

        const isUnregistered =
            formData.location === UNREGISTERED_LOCATION_ID;
        if (
            initialFormData?.crewInfo?.location_based_attendance &&
            !isUnregistered
        ) {
            setShowLocationModal(true);
            return;
        }

        proceedWithSubmission();
    }, [
        isSubmitting,
        userId,
        userStatus,
        formData,
        initialFormData,
        proceedWithSubmission,
    ]);

    // 24시간 전체 옵션 (제출 시 isFutureDateTime으로 검증)
    const availableTimeOptions = TIME_OPTIONS;

    /* 미등록 장소 허용 시 장소 옵션에 추가 */
    const locationOptionsWithUnregistered = useMemo(() => {
        const base = initialFormData?.locationOptions || [];
        if (!initialFormData?.crewInfo?.allow_unregistered_location) {
            return base;
        }
        return [
            ...base,
            {
                value: UNREGISTERED_LOCATION_ID,
                label: "미등록 장소",
            },
        ];
    }, [initialFormData]);

    const selectedLocationLabel = useMemo(() => {
        const opt = locationOptionsWithUnregistered.find(
            (o) => o.value === formData.location,
        );
        return opt?.label ?? "장소 미선택";
    }, [locationOptionsWithUnregistered, formData.location]);

    const accuracyRange =
        initialFormData?.crewInfo?.accuracy_range ??
        DEFAULT_ACCURACY_RANGE;

    // 선택된 크루 장소 좌표 (haversine 실거리 계산용)
    const selectedCrewLocation = useMemo(() => {
        if (!formData.location || !initialFormData?.crewLocations)
            return null;
        return (
            initialFormData.crewLocations.find(
                (cl) => String(cl.id) === formData.location,
            ) ?? null
        );
    }, [formData.location, initialFormData?.crewLocations]);

    const distanceMeters = useMemo(() => {
        if (
            !geoLocation ||
            !selectedCrewLocation?.latitude ||
            !selectedCrewLocation?.longitude
        )
            return null;
        return calculateDistance(
            {
                latitude: geoLocation.latitude,
                longitude: geoLocation.longitude,
            },
            {
                latitude: selectedCrewLocation.latitude,
                longitude: selectedCrewLocation.longitude,
            },
        );
    }, [geoLocation, selectedCrewLocation]);

    // 에러 상태 처리
    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                <PageHeader
                    title="출석 체크"
                    backLink="/"
                    iconColor="white"
                    borderColor="rh-border"
                    backgroundColor="bg-rh-bg-primary"
                />
                <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                    <h2 className="mb-2 text-rh-title3 font-semibold text-rh-text-primary">
                        오류가 발생했습니다
                    </h2>
                    <p className="mb-6 text-rh-body text-rh-text-secondary">
                        {error}
                    </p>
                    <Button onClick={() => router.push("/")}>
                        홈으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    // 초기 데이터가 없는 경우
    if (!initialFormData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-rh-bg-primary">
                <LoadingSpinner size="sm" color="white" />
            </div>
        );
    }

    const isDisabled =
        isSubmitting || Boolean(userStatus && !userStatus.isActive);

    return (
        <FadeIn>
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                <PageHeader
                    title="출석 체크"
                    iconColor="white"
                    borderColor="rh-border"
                    backgroundColor="bg-rh-bg-primary"
                    rightAction={
                        mounted && initialFormData?.crewInfo?.name ? (
                            <span className="rh-live pr-1">
                                {initialFormData.crewInfo.name}
                            </span>
                        ) : null
                    }
                />

                <div
                    ref={scrollRef}
                    className="overflow-y-auto flex-1 px-4 pt-3 pb-4 flex flex-col gap-4 native-scroll"
                >
                    {/* 오프라인/대기열 배너 — gesture로 접힘 가능 */}
                    <motion.div
                        style={{
                            maxHeight: bannerMaxHeight,
                            opacity: bannerOpacity,
                        }}
                        className="overflow-hidden"
                    >
                        {!isOnline && (
                            <div className="flex items-center gap-2 rounded-rh-md bg-rh-bg-surface border border-rh-border-strong px-3 py-2">
                                <WifiOff className="h-4 w-4 shrink-0 text-rh-accent" />
                                <span className="text-rh-caption text-rh-text-secondary">
                                    오프라인 상태 · 출석 시 자동
                                    저장됩니다
                                </span>
                            </div>
                        )}
                        {queueCount > 0 && isOnline && (
                            <div className="flex items-center gap-2 rounded-rh-md bg-rh-bg-surface border border-rh-border-strong px-3 py-2">
                                <CloudUpload className="h-4 w-4 shrink-0 text-rh-accent" />
                                <span className="text-rh-caption text-rh-text-secondary">
                                    {isFlushing
                                        ? "대기 중인 출석을 전송하고 있습니다..."
                                        : `대기 중인 출석 ${queueCount}건`}
                                </span>
                            </div>
                        )}
                    </motion.div>

                    {/* 미니맵 + GPS 핀 (sc-att 핵심) */}
                    <div className="flex flex-col gap-2">
                        <MiniMap
                            locationLabel={selectedLocationLabel}
                            accuracyRange={accuracyRange}
                            distanceMeters={
                                mounted ? distanceMeters : null
                            }
                        />
                        {/* GPS 인증 상태 + 좌표 (sc-att row between) */}
                        <div className="flex items-center justify-between">
                            <span className="rh-eye rh-eye-lime">
                                {mounted && geoLocation
                                    ? "GPS 인증됨"
                                    : "GPS 확인 중"}
                            </span>
                            <span
                                className="text-rh-caption rh-mono text-rh-text-tertiary"
                                suppressHydrationWarning
                            >
                                {mounted && geoLocation
                                    ? `${geoLocation.latitude.toFixed(4)} · ${geoLocation.longitude.toFixed(4)}`
                                    : "—— · ——"}
                            </span>
                        </div>
                    </div>

                    {/* 장소 선택 (chip 행) */}
                    <div className="flex flex-col gap-2">
                        <div className="rh-eye">장소</div>
                        <ChipRow
                            options={locationOptionsWithUnregistered}
                            value={formData.location}
                            onChange={(v) =>
                                handleFormChange("location", v)
                            }
                        />
                    </div>

                    {/* 운동 종류 (chip 행) */}
                    <div className="flex flex-col gap-2">
                        <div className="rh-eye">운동 종류</div>
                        <ChipRow
                            options={
                                initialFormData!.exerciseOptions
                            }
                            value={formData.exerciseType}
                            onChange={(v) =>
                                handleFormChange("exerciseType", v)
                            }
                        />
                    </div>

                    {/* 시작 시간 (sc-att 단일 input — date는 오늘 자동) */}
                    <div className="flex flex-col gap-2">
                        <div className="rh-eye">시작 시간</div>
                        <label className="flex items-center justify-between rounded-rh-md bg-rh-bg-inset border border-rh-border-strong px-3.5 h-[44px]">
                            <select
                                value={formData.time}
                                onChange={(e) =>
                                    handleFormChange(
                                        "time",
                                        e.target.value,
                                    )
                                }
                                className="flex-1 bg-transparent text-rh-body font-medium text-rh-text-primary outline-none rh-mono appearance-none"
                                suppressHydrationWarning
                            >
                                <option value="" disabled>
                                    시각 선택
                                </option>
                                {availableTimeOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* 개설자 여부 (SwitchRow) */}
                    <div className="flex items-center justify-between rounded-rh-lg bg-rh-bg-surface border border-rh-border-strong px-4 h-[52px]">
                        <div className="flex items-center gap-2">
                            <span className="text-rh-body font-medium text-rh-text-primary">
                                개설자 여부
                            </span>
                            {!canHost && (
                                <span className="text-rh-label text-rh-accent-hover">
                                    등급 권한 없음
                                </span>
                            )}
                        </div>
                        <Switch
                            checked={formData.isHost === "예"}
                            onCheckedChange={(checked) =>
                                handleFormChange(
                                    "isHost",
                                    checked ? "예" : "아니오",
                                )
                            }
                            disabled={!canHost}
                        />
                    </div>

                    {/* 위치 상태 — informational only */}
                    <LocationStatusIndicator
                        isLocationBasedAttendance={
                            initialFormData?.crewInfo
                                ?.location_based_attendance || false
                        }
                        crewLocations={
                            initialFormData?.crewLocations || []
                        }
                        selectedLocationId={formData.location}
                        allowedRadius={accuracyRange}
                    />
                </div>

                {/* 하단 고정 액션 영역 (라임 풀버튼) */}
                <div className="shrink-0 px-4 pt-2 pb-3 bg-rh-bg-primary border-t border-rh-border/40">
                    <Button
                        onClick={handleSubmit}
                        disabled={isDisabled}
                        size="lg"
                        className="w-full"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner
                                    size="sm"
                                    color="white"
                                />
                                <span>처리 중...</span>
                            </span>
                        ) : userStatus && !userStatus.isActive ? (
                            "출석 불가"
                        ) : (
                            "출석하기"
                        )}
                    </Button>
                </div>

                {/* 위치 검증 모달 */}
                <LocationVerificationModal
                    isOpen={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                    onVerified={handleLocationVerified}
                    crewLocations={
                        initialFormData?.crewLocations || []
                    }
                    allowedRadius={accuracyRange}
                />

                {/* 알림 팝업 */}
                {notificationType && (
                    <PopupNotification
                        isVisible={showNotification}
                        message={notificationMessage}
                        type={notificationType}
                        duration={
                            notificationType === "loading" ? 0 : 1500
                        }
                        onClose={() => {
                            setShowNotification(false);
                            if (notificationType === "success") {
                                setTimeout(
                                    () => router.push("/ranking"),
                                    100,
                                );
                            } else if (
                                notificationType === "error" &&
                                userStatus &&
                                !userStatus.isActive
                            ) {
                                setTimeout(
                                    () => router.push("/"),
                                    100,
                                );
                            }
                        }}
                    />
                )}
            </div>
        </FadeIn>
    );
};

export default memo(ClientAttendancePage);
