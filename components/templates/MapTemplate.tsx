"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LocateFixed } from "lucide-react";
import { CrewLocation } from "@/lib/types/crew-locations";
import NaverMapLoader from "@/components/map/NaverMapLoader";
import MapBottomSheet from "@/components/molecules/MapBottomSheet";
import { useGeolocation } from "@/hooks/useGeolocation";

export default function MapTemplate() {
    const router = useRouter();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const myLocationMarkerRef = useRef<any>(null);

    const [locations, setLocations] = useState<CrewLocation[]>([]);
    const [selectedLocation, setSelectedLocation] =
        useState<CrewLocation | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { location: myLocation, getCurrentLocation } = useGeolocation();

    // 장소 데이터 fetch
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch("/api/crew-locations");
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
        // 현재 위치도 함께 요청
        getCurrentLocation();
    }, []);

    // 지도 초기화
    const initMap = useCallback(() => {
        if (!mapRef.current || !window.naver?.maps || mapInstanceRef.current)
            return;

        const map = new window.naver.maps.Map(mapRef.current, {
            center: new window.naver.maps.LatLng(37.5665, 126.978),
            zoom: 14,
            mapTypeControl: false,
            scaleControl: false,
            logoControl: false,
            zoomControl: false,
            copyrightControl: false,
            mapDataControl: false,
        });

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

        const timeout = setTimeout(() => clearInterval(checkAPI), 15000);
        return () => {
            clearInterval(checkAPI);
            clearTimeout(timeout);
        };
    }, [initMap]);

    // 마커 렌더링
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isMapReady || locations.length === 0) return;

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

            const isSelected = selectedLocation?.id === loc.id;

            const marker = new window.naver.maps.Marker({
                position,
                map,
                icon: {
                    content: `
                        <div style="
                            width: ${isSelected ? "40px" : "32px"};
                            height: ${isSelected ? "40px" : "32px"};
                            background: ${isSelected ? "#669FF2" : "#669FF2"};
                            border-radius: 50%;
                            border: 3px solid white;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                            ${isSelected ? "transform: scale(1.15);" : ""}
                        ">
                            <div style="
                                width: ${isSelected ? "14px" : "10px"};
                                height: ${isSelected ? "14px" : "10px"};
                                background: white;
                                border-radius: 50%;
                            "></div>
                        </div>
                    `,
                    anchor: new window.naver.maps.Point(
                        isSelected ? 20 : 16,
                        isSelected ? 20 : 16
                    ),
                },
            });

            window.naver.maps.Event.addListener(marker, "click", () => {
                setSelectedLocation(loc);
                setIsSheetOpen(true);
                map.panTo(position);
            });

            markersRef.current.push(marker);
        });

        // 선택된 장소가 없을 때만 bounds 조정
        if (!selectedLocation && locations.length > 0) {
            map.fitBounds(bounds, {
                top: 80,
                right: 40,
                bottom: 40,
                left: 40,
            });
        }
    }, [isMapReady, locations, selectedLocation]);

    // 내 위치 마커
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isMapReady || !myLocation) return;

        // 기존 내 위치 마커 제거
        if (myLocationMarkerRef.current) {
            myLocationMarkerRef.current.setMap(null);
        }

        const position = new window.naver.maps.LatLng(
            myLocation.latitude,
            myLocation.longitude
        );

        myLocationMarkerRef.current = new window.naver.maps.Marker({
            position,
            map,
            icon: {
                content: `
                    <div style="position: relative; width: 40px; height: 40px;">
                        <div style="
                            position: absolute;
                            top: 50%; left: 50%;
                            transform: translate(-50%, -50%);
                            width: 36px; height: 36px;
                            background: rgba(102, 159, 242, 0.15);
                            border-radius: 50%;
                            animation: pulse 2s ease-out infinite;
                        "></div>
                        <div style="
                            position: absolute;
                            top: 50%; left: 50%;
                            transform: translate(-50%, -50%);
                            width: 14px; height: 14px;
                            background: #669FF2;
                            border-radius: 50%;
                            border: 3px solid white;
                            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                        "></div>
                    </div>
                `,
                anchor: new window.naver.maps.Point(20, 20),
            },
            zIndex: 200,
        });
    }, [isMapReady, myLocation]);

    // 내 위치로 이동
    const handleMoveToMyLocation = useCallback(async () => {
        try {
            const coords = await getCurrentLocation(true);
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

    // 바텀시트 닫기
    const handleCloseSheet = useCallback(() => {
        setIsSheetOpen(false);
        setSelectedLocation(null);
    }, []);

    return (
        <NaverMapLoader>
            <div className="relative flex flex-col h-full w-full bg-rh-bg-primary overflow-hidden">
                {/* 헤더 */}
                <div className="sticky top-0 z-20 flex items-center h-14 px-4 pt-safe bg-rh-bg-surface">
                    <button
                        onClick={() => router.back()}
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                    >
                        <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    <h1 className="ml-3 text-[17px] font-bold text-white">
                        러닝 장소
                    </h1>
                </div>

                {/* 지도 영역 */}
                <div ref={mapRef} className="flex-1 w-full" />

                {/* 로딩 */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-rh-bg-primary">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rh-accent border-t-transparent" />
                    </div>
                )}

                {/* 내 위치 FAB */}
                <button
                    onClick={handleMoveToMyLocation}
                    className="absolute right-4 bottom-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-rh-bg-surface shadow-lg border border-rh-border active:scale-95 transition-transform mb-bottom-inset"
                >
                    <LocateFixed className="h-5 w-5 text-rh-accent" />
                </button>

                {/* 바텀시트 */}
                <MapBottomSheet
                    location={selectedLocation}
                    isOpen={isSheetOpen}
                    onClose={handleCloseSheet}
                />
            </div>
        </NaverMapLoader>
    );
}
