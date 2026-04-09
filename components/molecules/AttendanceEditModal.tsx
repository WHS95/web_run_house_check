"use client";

import React, {
    useState,
    useEffect,
    useCallback,
    memo,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { X, ChevronDown } from "lucide-react";

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

const AttendanceEditModal: React.FC<
    AttendanceEditModalProps
> = memo(({
    isOpen,
    onClose,
    attendance,
    onSave,
    crewId,
    onDelete,
}) => {
    const [formData, setFormData] = useState({
        checkInTime: attendance.checkInTime,
        location: attendance.location,
        isHost: attendance.isHost,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [locations, setLocations] = useState<
        Array<{
            id: number;
            name: string;
            description?: string;
        }>
    >([]);
    const [showHostDropdown, setShowHostDropdown] =
        useState(false);
    const [showLocationDropdown, setShowLocationDropdown] =
        useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 크루별 활동장소 목록 조회
    useEffect(() => {
        const fetchCrewLocations = async () => {
            if (!crewId) return;

            try {
                const { data, error } = await supabase
                    .schema("attendance")
                    .from("crew_locations")
                    .select("id, name, description")
                    .eq("crew_id", crewId)
                    .eq("is_active", true)
                    .order("name");

                if (!error && data) {
                    setLocations(data);
                }
            } catch {
                // 조회 실패 시 무시
            }
        };

        if (isOpen) {
            fetchCrewLocations();
        }
    }, [isOpen, crewId, supabase]);

    // 드롭다운 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent
        ) => {
            const target = event.target as Element;
            if (
                !target.closest(
                    ".host-dropdown-container"
                )
            ) {
                setShowHostDropdown(false);
            }
            if (
                !target.closest(
                    ".location-dropdown-container"
                )
            ) {
                setShowLocationDropdown(false);
            }
        };

        if (showHostDropdown || showLocationDropdown) {
            document.addEventListener(
                "mousedown",
                handleClickOutside
            );
            return () =>
                document.removeEventListener(
                    "mousedown",
                    handleClickOutside
                );
        }
    }, [showHostDropdown, showLocationDropdown]);

    const handleSave = useCallback(async () => {
        setIsLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch {
            // 저장 실패 시 무시
        } finally {
            setIsLoading(false);
        }
    }, [formData, onSave, onClose]);

    const handleDelete = useCallback(() => {
        if (onDelete) {
            onDelete(attendance.id);
        }
    }, [onDelete, attendance.id]);

    const handleHostSelect = useCallback(
        (isHost: boolean) => {
            setFormData((prev) => ({
                ...prev,
                isHost,
            }));
            setShowHostDropdown(false);
        },
        []
    );

    const handleLocationSelect = useCallback(
        (location: { id: number; name: string }) => {
            setFormData((prev) => ({
                ...prev,
                location: location.name,
            }));
            setShowLocationDropdown(false);
        },
        []
    );

    // 시간을 HH:MM 형식으로 표시
    const formatTimeDisplay = useCallback(
        (dateTimeString: string) => {
            const date = new Date(dateTimeString);
            const hours = String(
                date.getHours()
            ).padStart(2, "0");
            const minutes = String(
                date.getMinutes()
            ).padStart(2, "0");
            return `${hours}:${minutes}`;
        },
        []
    );

    // 시간을 YYYY-MM-DDTHH:MM 형식으로 변환
    const formatDateTimeForInput = useCallback(
        (dateTimeString: string) => {
            const date = new Date(dateTimeString);
            const year = date.getFullYear();
            const month = String(
                date.getMonth() + 1
            ).padStart(2, "0");
            const day = String(
                date.getDate()
            ).padStart(2, "0");
            const hours = String(
                date.getHours()
            ).padStart(2, "0");
            const minutes = String(
                date.getMinutes()
            ).padStart(2, "0");
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        },
        []
    );

    // datetime-local input 값을 ISO 문자열로 변환
    const formatInputToDateTime = useCallback(
        (inputValue: string) => {
            return new Date(inputValue).toISOString();
        },
        []
    );

    const handleTimeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({
                ...prev,
                checkInTime: formatInputToDateTime(
                    e.target.value
                ),
            }));
        },
        [formatInputToDateTime]
    );

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex justify-center items-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* EditModal */}
            <div
                className={
                    "relative mx-5 w-full "
                    + "max-w-[350px] "
                    + "bg-rh-bg-surface "
                    + "rounded-2xl p-6 "
                    + "flex flex-col gap-5"
                }
            >
                {/* ModalHeader */}
                <div
                    className={
                        "flex items-center "
                        + "justify-between"
                    }
                >
                    <h2
                        className={
                            "text-lg font-semibold "
                            + "text-white"
                        }
                    >
                        출석 수정
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={
                            "text-rh-text-secondary "
                            + "hover:text-white "
                            + "transition-colors"
                        }
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* ModalBody */}
                <div className="flex flex-col gap-4">
                    {/* TimeField - 참여시간 */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            className={
                                "text-xs font-medium "
                                + "text-rh-text-secondary"
                            }
                        >
                            참여시간
                        </label>
                        <div className="relative">
                            <input
                                type="datetime-local"
                                value={formatDateTimeForInput(
                                    formData.checkInTime
                                )}
                                onChange={handleTimeChange}
                                className={
                                    "w-full h-12 px-4 "
                                    + "text-sm text-white "
                                    + "bg-rh-bg-surface "
                                    + "rounded-lg "
                                    + "border "
                                    + "border-rh-border "
                                    + "focus:outline-none "
                                    + "focus:ring-2 "
                                    + "focus:ring-rh-accent"
                                }
                            />
                        </div>
                    </div>

                    {/* HostField - 벙주여부 */}
                    <div
                        className={
                            "relative flex flex-col "
                            + "gap-1.5 "
                            + "host-dropdown-container"
                        }
                    >
                        <label
                            className={
                                "text-xs font-medium "
                                + "text-rh-text-secondary"
                            }
                        >
                            벙주여부
                        </label>
                        <button
                            type="button"
                            onClick={() =>
                                setShowHostDropdown(
                                    !showHostDropdown
                                )
                            }
                            className={
                                "flex items-center "
                                + "justify-between "
                                + "w-full h-12 px-4 "
                                + "bg-rh-bg-surface "
                                + "rounded-lg border "
                                + "border-rh-border "
                                + "text-left"
                            }
                        >
                            <span
                                className={
                                    "text-sm text-white"
                                }
                            >
                                {formData.isHost
                                    ? "벙주"
                                    : "일반 참여"}
                            </span>
                            <ChevronDown
                                size={18}
                                className={
                                    "text-rh-text-muted"
                                }
                            />
                        </button>

                        {showHostDropdown && (
                            <div
                                className={
                                    "absolute z-10 "
                                    + "top-full mt-1 "
                                    + "w-full "
                                    + "bg-rh-bg-primary "
                                    + "rounded-lg border "
                                    + "border-rh-border "
                                    + "shadow-lg "
                                    + "overflow-hidden"
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleHostSelect(
                                            true
                                        )
                                    }
                                    className={
                                        "w-full px-4 "
                                        + "py-3 "
                                        + "text-left "
                                        + "text-sm "
                                        + "text-white "
                                        + "hover:bg-rh-bg-muted "
                                        + "border-b "
                                        + "border-rh-border/50"
                                    }
                                >
                                    벙주
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleHostSelect(
                                            false
                                        )
                                    }
                                    className={
                                        "w-full px-4 "
                                        + "py-3 "
                                        + "text-left "
                                        + "text-sm "
                                        + "text-white "
                                        + "hover:bg-rh-bg-muted"
                                    }
                                >
                                    일반 참여
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PlaceField - 참여장소 */}
                    <div
                        className={
                            "relative flex flex-col "
                            + "gap-1.5 "
                            + "location-dropdown-container"
                        }
                    >
                        <label
                            className={
                                "text-xs font-medium "
                                + "text-rh-text-secondary"
                            }
                        >
                            참여장소
                        </label>
                        <button
                            type="button"
                            onClick={() =>
                                setShowLocationDropdown(
                                    !showLocationDropdown
                                )
                            }
                            className={
                                "flex items-center "
                                + "justify-between "
                                + "w-full h-12 px-4 "
                                + "bg-rh-bg-surface "
                                + "rounded-lg border "
                                + "border-rh-border "
                                + "text-left"
                            }
                        >
                            <span
                                className={
                                    formData.location
                                        ? "text-sm "
                                          + "text-white"
                                        : "text-sm "
                                          + "text-rh-text-muted"
                                }
                            >
                                {formData.location ||
                                    "선택해주세요"}
                            </span>
                            <ChevronDown
                                size={18}
                                className={
                                    "text-rh-text-muted"
                                }
                            />
                        </button>

                        {showLocationDropdown && (
                            <div
                                className={
                                    "absolute z-10 "
                                    + "top-full mt-1 "
                                    + "w-full "
                                    + "max-h-60 "
                                    + "overflow-y-auto "
                                    + "bg-rh-bg-primary "
                                    + "rounded-lg "
                                    + "border "
                                    + "border-rh-border "
                                    + "shadow-lg"
                                }
                            >
                                {locations.length > 0 ? (
                                    locations.map(
                                        (location) => (
                                            <button
                                                key={
                                                    location.id
                                                }
                                                type="button"
                                                onClick={() =>
                                                    handleLocationSelect(
                                                        location
                                                    )
                                                }
                                                className={
                                                    "w-full "
                                                    + "px-4 "
                                                    + "py-3 "
                                                    + "text-left "
                                                    + "text-sm "
                                                    + "text-white "
                                                    + "hover:bg-rh-bg-muted "
                                                    + "border-b "
                                                    + "border-rh-border/50 "
                                                    + "last:border-b-0"
                                                }
                                            >
                                                {
                                                    location.name
                                                }
                                            </button>
                                        )
                                    )
                                ) : (
                                    <div
                                        className={
                                            "px-4 py-3 "
                                            + "text-sm "
                                            + "text-rh-text-tertiary"
                                        }
                                    >
                                        등록된 장소가
                                        없습니다
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div
                    className="h-px bg-rh-border"
                />

                {/* ModalFooter - 가로 배치 */}
                <div className="flex gap-2">
                    {onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isLoading}
                            className={
                                "flex-1 h-11 "
                                + "rounded-xl "
                                + "text-sm "
                                + "font-semibold "
                                + "text-white "
                                + "transition-colors "
                                + "disabled:opacity-50"
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
                            "flex-1 h-11 "
                            + "rounded-xl "
                            + "text-sm "
                            + "font-semibold "
                            + "text-white "
                            + "bg-rh-accent "
                            + "hover:bg-rh-accent-hover "
                            + "transition-colors "
                            + "disabled:opacity-50"
                        }
                    >
                        {isLoading
                            ? "저장 중..."
                            : "저장"}
                    </button>
                </div>
            </div>
        </div>
    );
});

AttendanceEditModal.displayName =
    "AttendanceEditModal";

export default AttendanceEditModal;
