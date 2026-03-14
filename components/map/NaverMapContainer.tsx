"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CrewLocation } from "@/lib/types/crew-locations";
import { NaverMapPosition } from "@/lib/types/naver-maps";

interface NaverMapContainerProps {
  locations: CrewLocation[];
  selectedLocation?: CrewLocation | null;
  onLocationClick?: (location: CrewLocation) => void;
  onMapClick?: (position: NaverMapPosition) => void;
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
  center = { lat: 37.5665, lng: 126.978 }, // 서울 시청 기본값
  zoom = 15,
  height = "400px",
  showControls = false,
  clickable = false,
}: NaverMapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      try {
        // console.log("🗺️ [NaverMapContainer] 지도 초기화 시작");
        // console.log(
        //   "🔑 Client ID:",
        //   process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
        // );
        console.log("🌐 Naver API 상태:", !!window.naver?.maps);

        if (!window.naver?.maps) {
          console.error("❌ 네이버 지도 API가 로드되지 않았습니다.");
          setError("네이버 지도 API가 로드되지 않았습니다.");
          return;
        }

        const naverMap = new window.naver.maps.Map(mapRef.current!, {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom,
          mapTypeControl: showControls,
          scaleControl: showControls,
          logoControl: false,
          zoomControl: showControls,
          copyrightControl: false,
          mapDataControl: false,
        });

        setMap(naverMap);
        setIsLoaded(true);

        // 네이버 지도 컨트롤 요소들의 z-index 조정
        setTimeout(() => {
          const mapElement = mapRef.current;
          if (mapElement) {
            // 모든 네이버 지도 컨트롤 요소들의 z-index를 낮춤
            const controls = mapElement.querySelectorAll(
              '[class*="naver"], [class*="control"], .gmnoprint'
            );
            controls.forEach((control) => {
              if (control instanceof HTMLElement) {
                control.style.zIndex = "100";
              }
            });

            // 지도 컨테이너 자체의 z-index도 설정
            mapElement.style.position = "relative";
            mapElement.style.zIndex = "1";
          }
        }, 100);

        // console.log("✅ [NaverMapContainer] 지도 초기화 완료");/
      } catch (err) {
        // console.error("❌ [NaverMapContainer] 지도 초기화 오류:", err);
        setError("지도 초기화 중 오류가 발생했습니다.");
      }
    };

    // console.log("⏳ [NaverMapContainer] 네이버 지도 API 로딩 상태 확인");
    // console.log("window", window);
    // console.log("window.naver", window.naver);
    // console.log("window.naver.map", window.naver?.maps);

    if (window.naver?.maps) {
      initMap();
    } else {
      initMap();
      console.log("⏳ [NaverMapContainer] 네이버 지도 API 로딩 대기 중...");

      // API 로딩 대기
      const checkAPI = setInterval(() => {
        if (window.naver?.maps) {
          console.log("✅ [NaverMapContainer] 네이버 지도 API 로딩 완료");
          clearInterval(checkAPI);
          initMap();
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkAPI);
        if (!window.naver?.maps) {
          console.error(
            "❌ [NaverMapContainer] 네이버 지도 API 로딩 시간 초과"
          );
          setError("네이버 지도 API 로딩 시간이 초과되었습니다.");
        }
      }, 10000);
    }
  }, [center, zoom, showControls]);

  // 마커 생성 함수
  const createMarker = useCallback(
    (position: { lat: number; lng: number }, options: any) => {
      if (!map || !window.naver?.maps) return null;

      return new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(position.lat, position.lng),
        map: map,
        ...options,
      });
    },
    [map]
  );

  // 모든 마커 제거 함수
  const removeAllMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      console.log("Removing marker:", marker);

      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
  }, []);

  // 지도 중심 이동 함수
  const panTo = useCallback(
    (position: { lat: number; lng: number }) => {
      if (!map || !window.naver?.maps) return;
      map.setCenter(new window.naver.maps.LatLng(position.lat, position.lng));
    },
    [map]
  );

  // 마커 생성 및 관리
  const updateMarkers = useCallback(() => {
    if (!map || !isLoaded) return;

    // 기존 마커 제거
    removeAllMarkers();
    markersRef.current = [];

    // 새 마커 생성
    locations.forEach((location) => {
      if (!location.latitude || !location.longitude) return;

      const position = { lat: location.latitude, lng: location.longitude };
      const isSelected = selectedLocation?.id === location.id;

      const marker = createMarker(position, {
        title: location.name,
        icon: {
          content: `
            <div class="relative">
              <div class="w-8 h-8 bg-rh-accent rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                isSelected ? "ring-2 ring-rh-accent ring-offset-2" : ""
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
          // size와 anchor는 자동으로 처리됨
        },
      });

      // 마커 클릭 이벤트
      if (onLocationClick && window.naver?.maps?.Event) {
        window.naver.maps.Event.addListener(marker, "click", () => {
          onLocationClick(location);
        });
      }

      markersRef.current.push(marker);
    });
  }, [
    map,
    isLoaded,
    locations,
    selectedLocation,
    createMarker,
    removeAllMarkers,
    onLocationClick,
  ]);

  // 지도 클릭 이벤트
  useEffect(() => {
    if (!map || !clickable || !onMapClick) return;

    const clickHandler = (e: any) => {
      const position = {
        lat: e.coord.lat(),
        lng: e.coord.lng(),
      };
      onMapClick(position);
    };

    let listener: any = null;
    if (window.naver?.maps?.Event) {
      listener = window.naver.maps.Event.addListener(
        map,
        "click",
        clickHandler
      );
    }

    return () => {
      if (listener && (window.naver?.maps?.Event as any)?.removeListener) {
        (window.naver.maps.Event as any).removeListener(listener);
      }
    };
  }, [map, clickable, onMapClick]);

  // 마커 업데이트
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // 선택된 위치로 지도 이동
  useEffect(() => {
    if (
      selectedLocation &&
      selectedLocation.latitude &&
      selectedLocation.longitude
    ) {
      panTo({
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
      });
    }
  }, [selectedLocation, panTo]);

  console.log("Map State:", { map, isLoaded, error });

  if (error) {
    return (
      <div
        className='flex justify-center items-center rounded-lg border border-rh-border bg-rh-bg-surface'
        style={{ height }}
      >
        <div className='text-center'>
          <p className='mb-2 text-red-400'>지도 로딩 실패</p>
          <p className='text-sm text-rh-text-secondary'>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoaded) {
    // return (
    //   // <div
    //   //   className='flex justify-center items-center rounded-lg border border-rh-border bg-rh-bg-surface'
    //   //   style={{ height }}
    //   // >
    //   //   <div className='text-center'>
    //   //     <div className='mb-2 w-8 h-8 rounded-full border-2 animate-spin border-rh-accent border-t-transparent'></div>
    //   //     <p className='text-rh-text-secondary'>지도 로딩 중...</p>
    //   //   </div>
    //   // </div>
    // );
  }

  return (
    <div
      ref={mapRef}
      className='overflow-hidden relative w-full rounded-lg border border-rh-border'
      style={{ height, zIndex: 1 }}
    />
  );
}
