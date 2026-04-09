"use client";

import {
    memo,
    useState,
    useCallback,
    useEffect,
} from "react";
import {
    X,
    MapPin,
    Loader2,
    LocateFixed,
} from "lucide-react";
import {
    motion,
    AnimatePresence,
} from "framer-motion";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import NaverMapLoader from "@/components/map/NaverMapLoader";
import { useGeocoding } from "@/hooks/useGeocoding";
import { NaverMapPosition } from "@/lib/types/naver-maps";
import { CrewLocation } from "@/lib/types/crew-locations";
import { haptic } from "@/lib/haptic";

interface MapPickerSheetProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (pos: {
        lat: number;
        lng: number;
    }) => void;
    initialPosition?: {
        lat: number;
        lng: number;
    } | null;
}

const DEFAULT_CENTER: NaverMapPosition = {
    lat: 37.5665,
    lng: 126.978,
};

const MapPickerSheet = memo(function MapPickerSheet({
    open,
    onClose,
    onConfirm,
    initialPosition,
}: MapPickerSheetProps) {
    const [position, setPosition] =
        useState<NaverMapPosition | null>(
            initialPosition ?? null
        );
    const [center, setCenter] =
        useState<NaverMapPosition>(
            initialPosition ?? DEFAULT_CENTER
        );
    const [searchQuery, setSearchQuery] =
        useState("");
    const [searching, setSearching] =
        useState(false);
    const [locating, setLocating] =
        useState(false);
    const [error, setError] = useState<
        string | null
    >(null);

    const { searchAddress } = useGeocoding();

    /* open될 때마다 초기 상태 재설정 */
    useEffect(() => {
        if (!open) return;
        if (initialPosition) {
            setPosition(initialPosition);
            setCenter(initialPosition);
        } else {
            setPosition(null);
            setCenter(DEFAULT_CENTER);
        }
        setSearchQuery("");
        setError(null);
    }, [open, initialPosition]);

    const handleMapClick = useCallback(
        (pos: NaverMapPosition) => {
            haptic.light();
            setPosition(pos);
            setError(null);
        },
        []
    );

    const handleSearch = useCallback(() => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        setError(null);
        searchAddress(
            searchQuery,
            (lat, lng) => {
                const next = { lat, lng };
                setPosition(next);
                setCenter(next);
                setSearching(false);
            },
            (msg) => {
                setError(msg);
                setSearching(false);
            }
        );
    }, [searchQuery, searchAddress]);

    const handleConfirm = useCallback(() => {
        if (!position) return;
        haptic.success();
        onConfirm(position);
        onClose();
    }, [position, onConfirm, onClose]);

    /* 현재 위치로 이동 */
    const handleLocateMe = useCallback(() => {
        if (!navigator.geolocation) {
            setError(
                "이 기기에서 위치 서비스를 " +
                "사용할 수 없습니다."
            );
            return;
        }
        setLocating(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                haptic.light();
                setPosition(next);
                setCenter(next);
                setLocating(false);
            },
            () => {
                setError(
                    "현재 위치를 가져올 수 " +
                    "없습니다."
                );
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
            }
        );
    }, []);

    const markers: CrewLocation[] = position
        ? [
              {
                  id: 0,
                  crew_id: "",
                  name: "선택된 위치",
                  description: "",
                  latitude: position.lat,
                  longitude: position.lng,
                  is_active: true,
                  created_at: "",
                  updated_at: "",
              } as CrewLocation,
          ]
        : [];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="absolute inset-0 z-[150] flex flex-col bg-rh-bg-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <NaverMapLoader>
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-4 h-14 bg-rh-bg-surface shrink-0">
                            <button
                                onClick={onClose}
                                className="text-rh-text-secondary"
                                aria-label="닫기"
                            >
                                <X size={22} />
                            </button>
                            <h3 className="text-[15px] font-semibold text-white">
                                지도에서 위치 선택
                            </h3>
                            <div className="w-[22px]" />
                        </div>

                        {/* 주소 검색 */}
                        <div className="px-4 py-3 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key ===
                                            "Enter"
                                        ) {
                                            e.preventDefault();
                                            handleSearch();
                                        }
                                    }}
                                    placeholder="시/구/동 단위로 검색 (예: 강남구 역삼동)"
                                    className="flex-1 h-11 rounded-xl bg-rh-bg-surface px-4 text-sm text-white placeholder:text-[10px] placeholder:text-rh-text-tertiary border border-rh-border focus:border-rh-accent outline-none"
                                />
                                <button
                                    onClick={
                                        handleSearch
                                    }
                                    disabled={
                                        searching ||
                                        !searchQuery.trim()
                                    }
                                    className="h-11 min-w-[56px] px-4 rounded-xl bg-rh-accent text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center"
                                >
                                    {searching ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        "검색"
                                    )}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 text-xs text-rh-status-error">
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* 지도 */}
                        <div className="relative flex-1 px-4 min-h-0">
                            <NaverMapContainer
                                locations={markers}
                                center={center}
                                onMapClick={
                                    handleMapClick
                                }
                                clickable={true}
                                height="100%"
                            />
                            {/* 현재 위치 버튼 */}
                            <button
                                type="button"
                                onClick={handleLocateMe}
                                disabled={locating}
                                className="absolute right-7 bottom-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-rh-bg-surface shadow-lg border border-rh-border disabled:opacity-50"
                                aria-label="내 위치로 이동"
                            >
                                {locating ? (
                                    <Loader2
                                        size={18}
                                        className="animate-spin text-rh-accent"
                                    />
                                ) : (
                                    <LocateFixed
                                        size={18}
                                        className="text-rh-accent"
                                    />
                                )}
                            </button>
                        </div>

                        {/* 하단 확인 영역 */}
                        <div className="px-4 pt-3 pb-4 shrink-0 space-y-3 bg-rh-bg-primary">
                            <div className="rounded-xl bg-rh-bg-surface px-4 py-3 flex items-start gap-2">
                                <MapPin
                                    size={18}
                                    color="#8BB5F5"
                                    className="mt-0.5 shrink-0"
                                />
                                <div className="min-w-0">
                                    {position ? (
                                        <>
                                            <p className="text-[13px] font-medium text-white">
                                                선택된 위치
                                            </p>
                                            <p className="text-xs text-rh-text-secondary mt-0.5">
                                                {position.lat.toFixed(
                                                    6
                                                )}
                                                {", "}
                                                {position.lng.toFixed(
                                                    6
                                                )}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-[13px] text-rh-text-secondary">
                                            지도를
                                            클릭하거나
                                            주소를
                                            검색해 주세요
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleConfirm}
                                disabled={!position}
                                className="w-full h-12 rounded-xl bg-rh-accent text-[15px] font-semibold text-white disabled:opacity-50"
                            >
                                이 위치로 선택
                            </button>
                        </div>
                    </NaverMapLoader>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default MapPickerSheet;
