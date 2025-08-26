import { useState, useCallback, RefObject } from "react";
import { NaverMap, Marker, NaverClickEvent } from "@/types/naver-maps";

export const useNaverMap = (mapRef: RefObject<HTMLDivElement | null>) => {
  const [map, setMap] = useState<NaverMap | null>(null);
  const [marker, setMarker] = useState<Marker | null>(null);
  const [latitude, setLatitude] = useState<number>(37.5665);
  const [longitude, setLongitude] = useState<number>(126.978);

  const initMap = useCallback(() => {
    if (window.naver && mapRef.current) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울시청
        zoom: 15,
        mapTypeControl: true,
      };

      const naverMap = new window.naver.maps.Map(mapRef.current, mapOptions);

      // 마커 생성
      const naverMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(37.5665, 126.978),
        map: naverMap,
      });

      setMap(naverMap);
      setMarker(naverMarker);

      // 지도 클릭 이벤트 리스너 (클릭한 곳에 마커 이동)
      window.naver.maps.Event.addListener(
        naverMap,
        "click",
        (e: NaverClickEvent) => {
          const clickedLatLng = e.coord;
          setLatitude(clickedLatLng.lat());
          setLongitude(clickedLatLng.lng());
          naverMarker.setPosition(clickedLatLng);
        }
      );

      // 지도 중앙 변경 시에도 좌표 업데이트 (주소 검색 등)
      window.naver.maps.Event.addListener(naverMap, "center_changed", () => {
        const center = naverMap.getCenter();
        setLatitude(center.lat());
        setLongitude(center.lng());
      });
    } else {
      // 네이버 지도 API 로딩 대기
      setTimeout(() => {
        if (window.naver && window.naver.maps) {
          initMap();
        }
      }, 100);
    }
  }, [mapRef]);

  const updateMapLocation = useCallback(
    (lat: number, lng: number) => {
      if (map && marker) {
        const latlng = new window.naver.maps.LatLng(lat, lng);
        map.setCenter(latlng);
        marker.setPosition(latlng);
        setLatitude(lat);
        setLongitude(lng);
      }
    },
    [map, marker]
  );

  return {
    map,
    marker,
    latitude,
    longitude,
    initMap,
    updateMapLocation,
  };
};
