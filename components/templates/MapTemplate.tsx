"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    List,
    LocateFixed,
    MapPin,
    Minus,
    Navigation,
    Plus,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CrewLocation } from "@/lib/types/crew-locations";
import NaverMapLoader from "@/components/map/NaverMapLoader";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getCrewLocationsAction } from "@/app/map/actions";

/**
 * 지도 화면의 하단 UI 상태
 * - collapsed: "장소 목록 보기" 버튼만 표시
 * - expanded: 장소 목록 패널 펼침
 * - detail: 특정 장소 선택 → 상세 BottomSheet
 */
type BottomUIState =
    | { type: "collapsed" }
    | { type: "expanded" }
    | { type: "detail"; location: CrewLocation };

// v2 라임 카토그래픽 토큰 (인라인 SVG 마커용 — Tailwind 클래스가 적용되지 않는 영역)
// globals.css 의 --rh-* 변수와 동기화 유지
const RH_ACCENT_HEX = "#B8D964"; // --rh-accent
const RH_TEXT_MUTED_HEX = "#5F6573"; // --rh-text-muted
const RH_TEXT_INVERTED_HEX = "#1a1e0a"; // --rh-text-inverted (라임 위 텍스트)
const RH_TEXT_PRIMARY_HEX = "#F4F5F7"; // --rh-text-primary
const RH_BG_PRIMARY_HEX = "#15181E"; // --rh-bg-primary (마커 보더)

// 인라인 객체 호이스팅 (매 렌더마다 재생성 방지)
const DRAG_CONSTRAINTS_TOP = { top: 0 };
const SPRING_FAST = {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
};
const SPRING_MEDIUM = {
    type: "spring" as const,
    damping: 28,
    stiffness: 300,
};
const FADE_TRANSITION = { duration: 0.2 };

export default function MapTemplate() {
    const router = useRouter();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const myLocationMarkerRef = useRef<any>(null);

    const [locations, setLocations] = useState<
        CrewLocation[]
    >([]);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 단일 상태로 하단 UI 관리
    const [bottomUI, setBottomUI] =
        useState<BottomUIState>({ type: "collapsed" });
    const bottomUIRef = useRef(bottomUI);
    bottomUIRef.current = bottomUI;

    const selectedLocation =
        bottomUI.type === "detail" ? bottomUI.location : null;
    const selectedLocationIdRef = useRef<number | null>(null);

    const { location: myLocation, getCurrentLocation } =
        useGeolocation();

    // 장소 데이터 fetch
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const result = await getCrewLocationsAction();
                if (result.success && result.data) {
                    setLocations(result.data as unknown as CrewLocation[]);
                }
            } catch (err) {
                console.error("장소 조회 실패:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocations();
        getCurrentLocation();
    }, []);

    // 지도 초기화
    const initMap = useCallback(() => {
        if (
            !mapRef.current ||
            !window.naver?.maps ||
            mapInstanceRef.current
        )
            return;

        const map = new window.naver.maps.Map(
            mapRef.current,
            {
                center: new window.naver.maps.LatLng(
                    37.5665,
                    126.978
                ),
                zoom: 14,
                mapTypeControl: false,
                scaleControl: false,
                logoControl: false,
                zoomControl: false,
                copyrightControl: false,
                mapDataControl: false,
            }
        );

        mapInstanceRef.current = map;
        setIsMapReady(true);
    }, []);

    // 네이버 지도 API 로딩 감지 후 초기화
    useEffect(() => {
        if (window.naver?.maps) {
            initMap();
            return;
        }

        const checkAPI = setInterval(() => {
            if (window.naver?.maps) {
                clearInterval(checkAPI);
                initMap();
            }
        }, 200);

        const timeout = setTimeout(
            () => clearInterval(checkAPI),
            15000
        );
        return () => {
            clearInterval(checkAPI);
            clearTimeout(timeout);
        };
    }, [initMap]);

    // 지도 클릭 → 하단 UI 닫기
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isMapReady) return;

        window.naver.maps.Event.addListener(
            map,
            "click",
            () => {
                const ui = bottomUIRef.current;
                if (
                    ui.type === "detail" ||
                    ui.type === "expanded"
                ) {
                    setBottomUI({ type: "collapsed" });
                }
            }
        );
    }, [isMapReady]);

    // 마커 아이콘 생성 헬퍼
    // v2 라임 카토그래픽: 활성 = 라임(--rh-accent), 비활성/dim = muted
    const createMarkerIcon = useCallback(
        (isSelected: boolean) => {
            const size = isSelected ? 40 : 30;
            const dotSize = isSelected ? 14 : 9;
            const bg = isSelected
                ? RH_ACCENT_HEX
                : RH_TEXT_MUTED_HEX;
            const dotColor = isSelected
                ? RH_TEXT_INVERTED_HEX
                : RH_TEXT_PRIMARY_HEX;
            const shadow = isSelected
                ? `0 2px 12px ${RH_ACCENT_HEX}66`
                : "0 1px 4px rgba(0,0,0,0.35)";
            return {
                content: `
                    <div style="
                        width: ${size}px;
                        height: ${size}px;
                        background: ${bg};
                        border-radius: 50%;
                        border: 2.5px solid ${RH_BG_PRIMARY_HEX};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                        box-shadow: ${shadow};
                    ">
                        <div style="
                            width: ${dotSize}px;
                            height: ${dotSize}px;
                            background: ${dotColor};
                            border-radius: 50%;
                        "></div>
                    </div>
                `,
                anchor: new window.naver.maps.Point(
                    size / 2,
                    size / 2
                ),
            };
        },
        []
    );

    // 마커 생성 (locations 변경 시에만)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isMapReady || locations.length === 0)
            return;

        // 기존 마커 제거
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new window.naver.maps.LatLngBounds(
            new window.naver.maps.LatLng(90, 180),
            new window.naver.maps.LatLng(-90, -180)
        );

        locations.forEach((loc) => {
            if (!loc.latitude || !loc.longitude) return;

            const position = new window.naver.maps.LatLng(
                loc.latitude,
                loc.longitude
            );
            bounds.extend(position);

            const marker = new window.naver.maps.Marker({
                position,
                map,
                icon: createMarkerIcon(false),
            });

            (marker as any)._locationId = loc.id;

            window.naver.maps.Event.addListener(
                marker,
                "click",
                () => {
                    setBottomUI({
                        type: "detail",
                        location: loc,
                    });
                    map.panTo(position);
                }
            );

            markersRef.current.push(marker);
        });

        map.fitBounds(bounds, {
            top: 80,
            right: 40,
            bottom: 80,
            left: 40,
        });
    }, [isMapReady, locations, createMarkerIcon]);

    // 선택 상태 변경 시 아이콘만 업데이트 (마커 재생성 없음)
    useEffect(() => {
        const selectedId = selectedLocation?.id ?? null;
        const prevId = selectedLocationIdRef.current;
        if (selectedId === prevId) return;

        markersRef.current.forEach((marker) => {
            const id = (marker as any)._locationId;
            if (id === prevId || id === selectedId) {
                marker.setIcon(
                    createMarkerIcon(id === selectedId)
                );
            }
        });

        selectedLocationIdRef.current = selectedId;
    }, [selectedLocation, createMarkerIcon]);

    // 내 위치 마커 (라임 펄스)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isMapReady || !myLocation) return;

        if (myLocationMarkerRef.current) {
            myLocationMarkerRef.current.setMap(null);
        }

        const position = new window.naver.maps.LatLng(
            myLocation.latitude,
            myLocation.longitude
        );

        myLocationMarkerRef.current =
            new window.naver.maps.Marker({
                position,
                map,
                icon: {
                    content: `
                    <div style="
                        position: relative;
                        width: 40px; height: 40px;
                    ">
                        <div style="
                            position: absolute;
                            top: 50%; left: 50%;
                            transform: translate(-50%, -50%);
                            width: 40px; height: 40px;
                            background: ${RH_ACCENT_HEX}33;
                            border-radius: 50%;
                            animation: mapPulse 2s ease-out infinite;
                        "></div>
                        <div style="
                            position: absolute;
                            top: 50%; left: 50%;
                            transform: translate(-50%, -50%);
                            width: 14px; height: 14px;
                            background: ${RH_ACCENT_HEX};
                            border-radius: 50%;
                            border: 2.5px solid ${RH_BG_PRIMARY_HEX};
                        "></div>
                    </div>
                `,
                    anchor: new window.naver.maps.Point(
                        20,
                        20
                    ),
                },
                zIndex: 200,
            });
    }, [isMapReady, myLocation]);

    // 내 위치로 이동
    const handleMoveToMyLocation =
        useCallback(async () => {
            try {
                const coords =
                    await getCurrentLocation(true);
                const map = mapInstanceRef.current;
                if (map && coords) {
                    map.panTo(
                        new window.naver.maps.LatLng(
                            coords.latitude,
                            coords.longitude
                        )
                    );
                    map.setZoom(16);
                }
            } catch {
                // useGeolocation이 에러 처리
            }
        }, [getCurrentLocation]);

    // 줌 컨트롤
    const handleZoomIn = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const z = map.getZoom();
        map.setZoom(Math.min(z + 1, 21), true);
    }, []);

    const handleZoomOut = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const z = map.getZoom();
        map.setZoom(Math.max(z - 1, 6), true);
    }, []);

    // 네이버 지도 길찾기
    const handleDirections = useCallback(() => {
        if (!selectedLocation) return;
        const loc = selectedLocation;
        const naverMapUrl = `nmap://route/walk?dlat=${loc.latitude}&dlng=${loc.longitude}&dname=${encodeURIComponent(loc.name)}`;
        const webFallback = `https://map.naver.com/v5/directions/-/-/-/walk?c=${loc.longitude},${loc.latitude},15,0,0,0,dh`;

        const timeout = setTimeout(() => {
            window.location.href = webFallback;
        }, 1500);

        window.location.href = naverMapUrl;

        window.addEventListener(
            "blur",
            () => clearTimeout(timeout),
            { once: true }
        );
    }, [selectedLocation]);

    // 우측 컨트롤 stack 의 하단 위치 — 하단 카드 상태에 따라 위로 밀어 올림
    const controlsBottom =
        bottomUI.type === "expanded"
            ? 320
            : bottomUI.type === "detail"
              ? 260
              : 88;

    return (
        <NaverMapLoader>
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes mapPulse {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
                }
            `,
                }}
            />
            <div
                className="relative flex flex-col w-full bg-rh-bg-primary overflow-hidden"
                style={{ height: "100%" }}
            >
                {/* Floating 뒤로가기 버튼 (헤더 대신 — sc-map 사양: 검색바 없음) */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center h-14 px-4 gap-3 pointer-events-none">
                    <button
                        onClick={() => router.back()}
                        aria-label="뒤로가기"
                        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-rh-full bg-rh-bg-surface/90 border border-rh-border backdrop-blur-md shrink-0 active:scale-95 transition-transform"
                    >
                        <ChevronLeft className="h-5 w-5 text-rh-text-primary" />
                    </button>
                    <div className="pointer-events-auto rh-eye rh-eye-lime px-3 py-1.5 rounded-rh-full bg-rh-bg-surface/90 border border-rh-border backdrop-blur-md">
                        러닝 장소
                    </div>
                </div>

                {/* 지도 영역 */}
                <div
                    ref={mapRef}
                    className="flex-1 w-full"
                />

                {/* 로딩 */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-rh-bg-primary">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rh-accent border-t-transparent" />
                    </div>
                )}

                {/* 하단 커버: 네이버 로고 가리기 + 스크롤 시 지도 배경 안 보이게 */}
                <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                        zIndex: 1000,
                        height: 56,
                        background:
                            "linear-gradient(to top, var(--rh-bg-primary) 60%, transparent 100%)",
                    }}
                />

                {/* ===== 우측 컨트롤: +, -, 타겟(내위치) ===== */}
                <div
                    className="absolute right-4 flex flex-col gap-2"
                    style={{
                        zIndex: 2000,
                        bottom: controlsBottom,
                        transition: "bottom 250ms cubic-bezier(0.32, 0.72, 0, 1)",
                    }}
                >
                    <button
                        onClick={handleZoomIn}
                        aria-label="확대"
                        className="flex h-11 w-11 items-center justify-center rounded-rh-md bg-rh-bg-surface border border-rh-border shadow-md active:scale-95 transition-transform"
                    >
                        <Plus className="h-5 w-5 text-rh-text-primary" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        aria-label="축소"
                        className="flex h-11 w-11 items-center justify-center rounded-rh-md bg-rh-bg-surface border border-rh-border shadow-md active:scale-95 transition-transform"
                    >
                        <Minus className="h-5 w-5 text-rh-text-primary" />
                    </button>
                    <button
                        onClick={handleMoveToMyLocation}
                        aria-label="내 위치"
                        className="flex h-11 w-11 items-center justify-center rounded-rh-md bg-rh-accent border border-transparent shadow-md active:scale-95 transition-transform"
                    >
                        <LocateFixed className="h-5 w-5 text-rh-text-inverted" />
                    </button>
                </div>

                {/* ===== 하단 UI: 3가지 상태를 하나의 AnimatePresence로 관리 ===== */}

                {/* Collapsed: "장소 목록 보기" floating 카드 */}
                <AnimatePresence>
                    {bottomUI.type === "collapsed" && (
                        <motion.button
                            key="collapsed-btn"
                            initial={{ y: 80 }}
                            animate={{ y: 0 }}
                            exit={{ y: 80 }}
                            transition={SPRING_FAST}
                            onClick={() =>
                                setBottomUI({
                                    type: "expanded",
                                })
                            }
                            className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rh-box rh-box-tight"
                            style={{
                                zIndex: 2000,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-rh-md bg-rh-accent shrink-0">
                                <List className="h-5 w-5 text-rh-text-inverted" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="text-[15px] font-semibold text-rh-text-primary">
                                    장소 목록 보기
                                </div>
                                <div className="text-[12px] text-rh-text-tertiary mt-0.5">
                                    {locations.length}개 등록됨
                                </div>
                            </div>
                            <ChevronUp className="h-5 w-5 text-rh-text-tertiary shrink-0" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Expanded: 장소 목록 패널 */}
                <AnimatePresence>
                    {bottomUI.type === "expanded" && (
                        <motion.div
                            key="expanded-panel"
                            initial={{ y: 320 }}
                            animate={{ y: 0 }}
                            exit={{ y: 320 }}
                            transition={SPRING_MEDIUM}
                            drag="y"
                            dragConstraints={DRAG_CONSTRAINTS_TOP}
                            dragElastic={0.1}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 80) {
                                    setBottomUI({
                                        type: "collapsed",
                                    });
                                }
                            }}
                            className="absolute bottom-0 left-0 right-0 flex flex-col bg-rh-bg-inset border-t border-rh-border"
                            style={{
                                zIndex: 2000,
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                boxShadow:
                                    "0 -4px 16px rgba(0,0,0,0.35)",
                                padding:
                                    "12px 16px 24px 16px",
                                maxHeight: "55%",
                            }}
                        >
                            {/* Handle Bar */}
                            <div className="flex justify-center mb-2">
                                <div className="h-1 w-9 rounded-full bg-rh-bg-muted" />
                            </div>

                            {/* Section Header */}
                            <div className="flex items-center justify-between py-2 px-1 mb-2">
                                <span className="rh-eye rh-eye-lime">
                                    LOCATIONS
                                </span>
                                <span className="text-[12px] text-rh-text-tertiary">
                                    {locations.length}개
                                </span>
                            </div>

                            {/* Location List or Empty State */}
                            {locations.length > 0 ? (
                                <div
                                    className="flex flex-col gap-2 overflow-y-auto"
                                    style={{
                                        overscrollBehavior:
                                            "contain",
                                    }}
                                >
                                    {locations.map(
                                        (loc) => (
                                            <button
                                                key={loc.id}
                                                onClick={() => {
                                                    setBottomUI(
                                                        {
                                                            type: "detail",
                                                            location:
                                                                loc,
                                                        }
                                                    );
                                                    const map =
                                                        mapInstanceRef.current;
                                                    if (
                                                        map &&
                                                        loc.latitude &&
                                                        loc.longitude
                                                    ) {
                                                        map.panTo(
                                                            new window.naver.maps.LatLng(
                                                                loc.latitude,
                                                                loc.longitude
                                                            )
                                                        );
                                                    }
                                                }}
                                                className="flex items-center gap-3 w-full text-left rh-box rh-box-tight active:opacity-80 transition-opacity"
                                                style={{
                                                    flexDirection:
                                                        "row",
                                                    alignItems:
                                                        "center",
                                                    gap: 12,
                                                    background:
                                                        "var(--rh-bg-surface)",
                                                }}
                                            >
                                                <div className="flex h-9 w-9 items-center justify-center rounded-rh-md bg-rh-bg-muted shrink-0">
                                                    <MapPin className="h-4 w-4 text-rh-accent" />
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <span className="text-sm font-semibold text-rh-text-primary truncate">
                                                        {
                                                            loc.name
                                                        }
                                                    </span>
                                                    {loc.description && (
                                                        <span className="text-xs text-rh-text-tertiary truncate">
                                                            {
                                                                loc.description
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-rh-text-muted shrink-0" />
                                            </button>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-rh-full bg-rh-bg-surface">
                                        <MapPin className="h-6 w-6 text-rh-text-muted" />
                                    </div>
                                    <span className="text-sm text-rh-text-tertiary">
                                        등록된 장소가 없습니다
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Detail: BottomSheet */}
                <AnimatePresence>
                    {bottomUI.type === "detail" && (
                        <>
                            {/* 오버레이 */}
                            <motion.div
                                key="overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={FADE_TRANSITION}
                                className="absolute inset-0 bg-rh-bg-primary/60"
                                style={{ zIndex: 2001 }}
                                onClick={() =>
                                    setBottomUI({
                                        type: "collapsed",
                                    })
                                }
                            />

                            {/* 시트 — sc-map 하단 floating 카드 */}
                            <motion.div
                                key="detail-sheet"
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={SPRING_MEDIUM}
                                drag="y"
                                dragConstraints={DRAG_CONSTRAINTS_TOP}
                                dragElastic={0.1}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 100)
                                        setBottomUI({
                                            type: "collapsed",
                                        });
                                }}
                                className="absolute bottom-0 left-0 right-0 flex flex-col bg-rh-bg-surface border-t border-rh-border pb-safe"
                                style={{
                                    zIndex: 2002,
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20,
                                    boxShadow:
                                        "0 -4px 16px rgba(0,0,0,0.35)",
                                    padding:
                                        "12px 20px 28px 20px",
                                    gap: 14,
                                }}
                            >
                                {/* Handle */}
                                <div className="flex justify-center">
                                    <div className="h-1 w-10 rounded-full bg-rh-bg-muted" />
                                </div>

                                {/* Top Row: thumbnail + info + close */}
                                <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-rh-lg bg-rh-bg-inset border border-rh-border shrink-0">
                                        <MapPin className="h-6 w-6 text-rh-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-bold text-rh-text-primary truncate">
                                                {
                                                    bottomUI
                                                        .location
                                                        .name
                                                }
                                            </h3>
                                            {bottomUI
                                                .location
                                                .is_active && (
                                                <span className="rh-chip is-on shrink-0">
                                                    활성
                                                </span>
                                            )}
                                        </div>
                                        {bottomUI.location
                                            .description && (
                                            <p className="mt-1 text-sm text-rh-text-secondary leading-snug line-clamp-2">
                                                {
                                                    bottomUI
                                                        .location
                                                        .description
                                                }
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() =>
                                            setBottomUI({
                                                type: "collapsed",
                                            })
                                        }
                                        aria-label="닫기"
                                        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-rh-full bg-rh-bg-muted active:scale-95 transition-transform"
                                    >
                                        <X className="h-4 w-4 text-rh-text-secondary" />
                                    </button>
                                </div>

                                {/* Directions Button — 라임 위 텍스트는 text-rh-text-inverted */}
                                <button
                                    onClick={
                                        handleDirections
                                    }
                                    className="flex items-center justify-center gap-2 w-full h-12 rounded-rh-lg bg-rh-accent active:bg-rh-accent-hover transition-colors"
                                >
                                    <Navigation className="h-[18px] w-[18px] text-rh-text-inverted" />
                                    <span className="text-[15px] font-semibold text-rh-text-inverted">
                                        네이버 지도에서 길찾기
                                    </span>
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </NaverMapLoader>
    );
}
