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
    Navigation,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CrewLocation } from "@/lib/types/crew-locations";
import NaverMapLoader from "@/components/map/NaverMapLoader";
import { useGeolocation } from "@/hooks/useGeolocation";

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

    const { location: myLocation, getCurrentLocation } =
        useGeolocation();

    // 장소 데이터 fetch
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch(
                    "/api/crew-locations"
                );
                const json = await res.json();
                if (json.success && json.data) {
                    setLocations(json.data);
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

    // 마커 렌더링
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

            const isSelected =
                selectedLocation?.id === loc.id;
            const size = isSelected ? 40 : 32;
            const dotSize = isSelected ? 14 : 10;

            const marker = new window.naver.maps.Marker({
                position,
                map,
                icon: {
                    content: `
                        <div style="
                            width: ${size}px;
                            height: ${size}px;
                            background: #669FF2;
                            border-radius: 50%;
                            border: 3px solid white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                            ${isSelected ? "box-shadow: 0 2px 12px #669FF266;" : "box-shadow: 0 2px 8px rgba(0,0,0,0.3);"}
                        ">
                            <div style="
                                width: ${dotSize}px;
                                height: ${dotSize}px;
                                background: white;
                                border-radius: 50%;
                            "></div>
                        </div>
                    `,
                    anchor: new window.naver.maps.Point(
                        size / 2,
                        size / 2
                    ),
                },
            });

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

        // 선택된 장소가 없을 때만 bounds 조정
        if (!selectedLocation && locations.length > 0) {
            map.fitBounds(bounds, {
                top: 80,
                right: 40,
                bottom: 80,
                left: 40,
            });
        }
    }, [isMapReady, locations, selectedLocation]);

    // 내 위치 마커
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
                            background: #669FF226;
                            border-radius: 50%;
                            animation: mapPulse 2s ease-out infinite;
                        "></div>
                        <div style="
                            position: absolute;
                            top: 50%; left: 50%;
                            transform: translate(-50%, -50%);
                            width: 14px; height: 14px;
                            background: #669FF2;
                            border-radius: 50%;
                            border: 3px solid white;
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

    // FAB 하단 위치 계산
    const fabBottom =
        bottomUI.type === "expanded"
            ? 306
            : bottomUI.type === "detail"
              ? 250
              : 72;

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
                {/* TranslucentHeader */}
                <div
                    className="absolute top-0 left-0 right-0 z-20 flex items-center h-14 px-4 gap-3"
                    style={{
                        backgroundColor: "#2B364480",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                    }}
                >
                    <button
                        onClick={() => router.back()}
                        className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
                        style={{
                            backgroundColor: "#2B364499",
                        }}
                    >
                        <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    <h1 className="text-[17px] font-bold text-white">
                        러닝 장소
                    </h1>
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
                            "linear-gradient(to top, #1D2530 60%, transparent 100%)",
                    }}
                />

                {/* MyLocation FAB */}
                <button
                    onClick={handleMoveToMyLocation}
                    className="absolute flex items-center justify-center active:scale-95 transition-all duration-300 ease-in-out"
                    style={{
                        zIndex: 2000,
                        width: 48,
                        height: 48,
                        right: 16,
                        bottom: fabBottom,
                        borderRadius: 100,
                        backgroundColor: "#2B3644",
                        border: "1px solid #374151",
                        boxShadow:
                            "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                >
                    <LocateFixed
                        className="text-rh-accent"
                        style={{ width: 22, height: 22 }}
                    />
                </button>

                {/* ===== 하단 UI: 3가지 상태를 하나의 AnimatePresence로 관리 ===== */}

                {/* Collapsed: "장소 목록 보기" 버튼 */}
                <AnimatePresence>
                    {bottomUI.type === "collapsed" && (
                        <motion.button
                            key="collapsed-btn"
                            initial={{ y: 60 }}
                            animate={{ y: 0 }}
                            exit={{ y: 60 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                            }}
                            onClick={() =>
                                setBottomUI({
                                    type: "expanded",
                                })
                            }
                            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2"
                            style={{
                                zIndex: 2000,
                                padding: "14px 20px",
                                backgroundColor: "#2B3644",
                                borderRadius:
                                    "16px 16px 0 0",
                                boxShadow:
                                    "0 -2px 12px rgba(0,0,0,0.19)",
                            }}
                        >
                            <List
                                className="text-rh-accent"
                                style={{
                                    width: 18,
                                    height: 18,
                                }}
                            />
                            <span className="text-[15px] font-semibold text-white">
                                장소 목록 보기
                            </span>
                            <ChevronUp
                                className="text-rh-text-tertiary"
                                style={{
                                    width: 16,
                                    height: 16,
                                }}
                            />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Expanded: LocationListPanel */}
                <AnimatePresence>
                    {bottomUI.type === "expanded" && (
                        <motion.div
                            key="expanded-panel"
                            initial={{ y: 300 }}
                            animate={{ y: 0 }}
                            exit={{ y: 300 }}
                            transition={{
                                type: "spring",
                                damping: 28,
                                stiffness: 300,
                            }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.1}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 80) {
                                    setBottomUI({
                                        type: "collapsed",
                                    });
                                }
                            }}
                            className="absolute bottom-0 left-0 right-0 flex flex-col"
                            style={{
                                zIndex: 2000,
                                backgroundColor:
                                    "#1D2530",
                                borderRadius:
                                    "20px 20px 0 0",
                                boxShadow:
                                    "0 -4px 16px rgba(0,0,0,0.25)",
                                padding:
                                    "16px 16px 20px 16px",
                                maxHeight: "50%",
                            }}
                        >
                            {/* Handle Bar */}
                            <div className="flex justify-center mb-2">
                                <div
                                    className="rounded-full"
                                    style={{
                                        width: 36,
                                        height: 4,
                                        backgroundColor:
                                            "#475569",
                                    }}
                                />
                            </div>

                            {/* Section Header */}
                            <div className="flex items-center justify-between py-2 px-0 mb-1">
                                <span className="text-[15px] font-bold text-white">
                                    장소 목록
                                </span>
                                <span className="text-[13px] text-rh-text-tertiary">
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
                                                key={
                                                    loc.id
                                                }
                                                onClick={() =>
                                                    {
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
                                                    }
                                                }
                                                className="flex items-center justify-between w-full text-left active:opacity-80 transition-opacity"
                                                style={{
                                                    padding:
                                                        "12px 16px",
                                                    backgroundColor:
                                                        "#2B3644",
                                                    borderRadius: 12,
                                                }}
                                            >
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                    <span className="text-sm font-medium text-white truncate">
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
                                                <ChevronRight
                                                    className="text-rh-text-muted shrink-0 ml-2"
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                    }}
                                                />
                                            </button>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <MapPin
                                        className="text-rh-text-muted"
                                        style={{
                                            width: 32,
                                            height: 32,
                                        }}
                                    />
                                    <span className="text-sm text-rh-text-tertiary">
                                        등록된 장소가
                                        없습니다
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
                                transition={{
                                    duration: 0.2,
                                }}
                                className="absolute inset-0"
                                style={{
                                    zIndex: 2001,
                                    backgroundColor:
                                        "#1D253066",
                                }}
                                onClick={() =>
                                    setBottomUI({
                                        type: "collapsed",
                                    })
                                }
                            />

                            {/* 시트 */}
                            <motion.div
                                key="detail-sheet"
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{
                                    type: "spring",
                                    damping: 28,
                                    stiffness: 300,
                                }}
                                drag="y"
                                dragConstraints={{
                                    top: 0,
                                }}
                                dragElastic={0.1}
                                onDragEnd={(_, info) => {
                                    if (
                                        info.offset.y >
                                        100
                                    )
                                        setBottomUI({
                                            type: "collapsed",
                                        });
                                }}
                                className="absolute bottom-0 left-0 right-0 flex flex-col pb-safe"
                                style={{
                                    zIndex: 2002,
                                    backgroundColor:
                                        "#2B3644",
                                    borderRadius:
                                        "16px 16px 0 0",
                                    padding:
                                        "12px 20px 32px 20px",
                                    gap: 16,
                                }}
                            >
                                {/* Handle */}
                                <div className="flex justify-center">
                                    <div
                                        className="rounded-full"
                                        style={{
                                            width: 40,
                                            height: 4,
                                            backgroundColor:
                                                "#4C525E",
                                        }}
                                    />
                                </div>

                                {/* Title Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <h3 className="text-lg font-bold text-white truncate">
                                            {
                                                bottomUI
                                                    .location
                                                    .name
                                            }
                                        </h3>
                                        {bottomUI
                                            .location
                                            .is_active && (
                                            <span
                                                className="shrink-0 text-[11px] font-medium rounded-full"
                                                style={{
                                                    padding:
                                                        "2px 8px",
                                                    backgroundColor:
                                                        "#669FF233",
                                                    color: "#669FF2",
                                                }}
                                            >
                                                활성
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() =>
                                            setBottomUI({
                                                type: "collapsed",
                                            })
                                        }
                                        className="shrink-0 flex items-center justify-center"
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 100,
                                            backgroundColor:
                                                "#4C525E",
                                        }}
                                    >
                                        <X
                                            className="text-rh-text-secondary"
                                            style={{
                                                width: 16,
                                                height: 16,
                                            }}
                                        />
                                    </button>
                                </div>

                                {/* Description */}
                                {bottomUI.location
                                    .description && (
                                    <p
                                        className="text-sm text-rh-text-secondary"
                                        style={{
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {
                                            bottomUI
                                                .location
                                                .description
                                        }
                                    </p>
                                )}

                                {/* Directions Button */}
                                <button
                                    onClick={
                                        handleDirections
                                    }
                                    className="flex items-center justify-center gap-2 w-full active:opacity-90 transition-opacity"
                                    style={{
                                        height: 48,
                                        borderRadius: 12,
                                        backgroundColor:
                                            "#669FF2",
                                    }}
                                >
                                    <Navigation
                                        className="text-white"
                                        style={{
                                            width: 18,
                                            height: 18,
                                        }}
                                    />
                                    <span className="text-[15px] font-semibold text-white">
                                        네이버 지도에서
                                        길찾기
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
