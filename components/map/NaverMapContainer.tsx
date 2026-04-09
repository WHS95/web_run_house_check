"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { CrewLocation } from "@/lib/types/crew-locations";
import { NaverMapPosition } from "@/lib/types/naver-maps";
import { useNaverMapReady } from "./NaverMapLoader";

interface NaverMapContainerProps {
    locations: CrewLocation[];
    selectedLocation?: CrewLocation | null;
    onLocationClick?: (
        location: CrewLocation,
    ) => void;
    onMapClick?: (
        position: NaverMapPosition,
    ) => void;
    center?: NaverMapPosition;
    zoom?: number;
    height?: string;
    showControls?: boolean;
    clickable?: boolean;
}

export default function NaverMapContainer({
    locations,
    selectedLocation,
    onLocationClick,
    onMapClick,
    center = { lat: 37.5665, lng: 126.978 },
    zoom = 15,
    height = "400px",
    showControls = false,
    clickable = false,
}: NaverMapContainerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const isNaverReady = useNaverMapReady();

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<
        string | null
    >(null);

    // 지도 초기화 — API ready + DOM mount 시 1회만
    useEffect(() => {
        if (!isNaverReady || !mapRef.current) return;
        if (mapInstanceRef.current) return;

        try {
            if (!window.naver?.maps) {
                setError(
                    "네이버 지도 API가 "
                    + "로드되지 않았습니다.",
                );
                return;
            }

            const naverMap =
                new window.naver.maps.Map(
                    mapRef.current!,
                    {
                        center:
                            new window.naver.maps.LatLng(
                                center.lat,
                                center.lng,
                            ),
                        zoom,
                        mapTypeControl: showControls,
                        scaleControl: showControls,
                        logoControl: false,
                        zoomControl: showControls,
                        copyrightControl: false,
                        mapDataControl: false,
                    },
                );

            mapInstanceRef.current = naverMap;
            setIsLoaded(true);

            // z-index 조정
            setTimeout(() => {
                const el = mapRef.current;
                if (!el) return;
                const ctrls = el.querySelectorAll(
                    '[class*="naver"],'
                    + ' [class*="control"],'
                    + " .gmnoprint",
                );
                ctrls.forEach((c) => {
                    if (c instanceof HTMLElement) {
                        c.style.zIndex = "100";
                    }
                });
                el.style.position = "relative";
                el.style.zIndex = "1";
            }, 100);
        } catch {
            setError(
                "지도 초기화 중 오류가 "
                + "발생했습니다.",
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNaverReady]);

    // center 변경 시 panTo로 이동 (재초기화 X)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !window.naver?.maps) return;
        map.setCenter(
            new window.naver.maps.LatLng(
                center.lat,
                center.lng,
            ),
        );
    }, [center]);

    // 마커 생성 함수
    const createMarker = useCallback(
        (
            position: { lat: number; lng: number },
            options: any,
        ) => {
            const map = mapInstanceRef.current;
            if (!map || !window.naver?.maps)
                return null;

            return new window.naver.maps.Marker({
                position:
                    new window.naver.maps.LatLng(
                        position.lat,
                        position.lng,
                    ),
                map,
                ...options,
            });
        },
        [isLoaded],
    );

    // 모든 마커 제거
    const removeAllMarkers = useCallback(() => {
        markersRef.current.forEach((marker) => {
            if (marker.setMap) {
                marker.setMap(null);
            }
        });
        markersRef.current = [];
    }, []);

    // 마커 업데이트
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isLoaded) return;

        removeAllMarkers();

        locations.forEach((location) => {
            if (
                !location.latitude ||
                !location.longitude
            )
                return;

            const position = {
                lat: location.latitude,
                lng: location.longitude,
            };
            const isSelected =
                selectedLocation?.id === location.id;

            const marker = createMarker(position, {
                title: location.name,
                icon: {
                    content: `
                        <div class="relative">
                          <div class="w-8 h-8 bg-rh-accent rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                              isSelected
                                  ? "ring-2 ring-rh-accent ring-offset-2"
                                  : ""
                          }">
                            <div class="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                          ${
                              isSelected
                                  ? '<div class="absolute -bottom-1 left-1/2 w-0 h-0 border-t-4 border-r-2 border-l-2 border-transparent transform -translate-x-1/2 border-t-rh-accent"></div>'
                                  : ""
                          }
                        </div>
                    `,
                },
            });

            if (
                onLocationClick &&
                window.naver?.maps?.Event
            ) {
                window.naver.maps.Event.addListener(
                    marker,
                    "click",
                    () => {
                        onLocationClick(location);
                    },
                );
            }

            markersRef.current.push(marker);
        });
    }, [
        isLoaded,
        locations,
        selectedLocation,
        createMarker,
        removeAllMarkers,
        onLocationClick,
    ]);

    // 지도 클릭 이벤트
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !clickable || !onMapClick)
            return;

        const clickHandler = (e: any) => {
            const position = {
                lat: e.coord.lat(),
                lng: e.coord.lng(),
            };
            onMapClick(position);
        };

        let listener: any = null;
        if (window.naver?.maps?.Event) {
            listener =
                window.naver.maps.Event.addListener(
                    map,
                    "click",
                    clickHandler,
                );
        }

        return () => {
            if (
                listener &&
                (
                    window.naver?.maps
                        ?.Event as any
                )?.removeListener
            ) {
                (
                    window.naver.maps
                        .Event as any
                ).removeListener(listener);
            }
        };
    }, [isLoaded, clickable, onMapClick]);

    // 선택된 위치로 이동
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (
            !map ||
            !selectedLocation?.latitude ||
            !selectedLocation?.longitude ||
            !window.naver?.maps
        )
            return;
        map.setCenter(
            new window.naver.maps.LatLng(
                selectedLocation.latitude,
                selectedLocation.longitude,
            ),
        );
    }, [selectedLocation, isLoaded]);

    if (error) {
        return (
            <div
                className={
                    "flex justify-center "
                    + "items-center rounded-lg "
                    + "border border-rh-border "
                    + "bg-rh-bg-surface"
                }
                style={{ height }}
            >
                <div className="text-center">
                    <p className="mb-2 text-rh-status-error">
                        지도 로딩 실패
                    </p>
                    <p className="text-sm text-rh-text-secondary">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className={
                "overflow-hidden relative "
                + "w-full rounded-lg border "
                + "border-rh-border"
            }
            style={{ height, zIndex: 1 }}
        />
    );
}
