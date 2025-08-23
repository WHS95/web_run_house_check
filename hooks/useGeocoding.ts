import { useState, useEffect } from "react";
import { GeocodeResponse } from "@/lib/types/naver-maps";

// 타입 정의 추가
interface CacheItem {
  lat: number;
  lng: number;
  timestamp: number;
}

interface SearchResult {
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
  x: string;
  y: string;
  distance: number;
}

export const useGeocoding = () => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedHistory = sessionStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 사용량 제한 체크
  const checkRateLimit = () => {
    const now = Date.now();
    const requests = JSON.parse(sessionStorage.getItem("requests") || "[]");
    const oneMinuteAgo = now - 60000;

    const recentRequests = requests.filter(
      (time: number) => time > oneMinuteAgo
    );

    if (recentRequests.length >= 20) {
      return false;
    }

    recentRequests.push(now);
    sessionStorage.setItem("requests", JSON.stringify(recentRequests));
    return true;
  };

  // 주소 캐시 관리
  const getAddressCache = (): Record<string, CacheItem> => {
    try {
      const cache = localStorage.getItem("addressCache");
      return cache ? JSON.parse(cache) : {};
    } catch {
      return {};
    }
  };

  const setAddressCache = (address: string, lat: number, lng: number) => {
    try {
      const cache = getAddressCache();
      cache[address] = { lat, lng, timestamp: Date.now() };

      const entries = Object.entries(cache);
      if (entries.length > 100) {
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const newCache: Record<string, CacheItem> = {};
        entries.slice(-100).forEach(([key, value]) => {
          newCache[key] = value;
        });
        localStorage.setItem("addressCache", JSON.stringify(newCache));
      } else {
        localStorage.setItem("addressCache", JSON.stringify(cache));
      }
    } catch (error) {
      console.error("캐시 저장 실패:", error);
    }
  };

  // 주소 검색
  const searchAddress = async (
    address: string,
    onSuccess: (lat: number, lng: number) => void,
    onError: (message: string) => void
  ) => {
    if (!address.trim()) {
      onError("주소를 입력해주세요.");
      return;
    }

    if (!checkRateLimit()) {
      onError(
        "1분에 20회 이상 요청하실 수 없습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    // 캐시 확인
    const cache = getAddressCache();
    if (cache[address]) {
      const { lat, lng } = cache[address];
      onSuccess(lat, lng);

      // 검색 이력 저장
      const newHistory = [
        address,
        ...searchHistory.filter((item) => item !== address),
      ].slice(0, 5);
      setSearchHistory(newHistory);
      sessionStorage.setItem("searchHistory", JSON.stringify(newHistory));
      return;
    }

    // API 호출
    if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
      onError("네이버 지도 API가 로드되지 않았습니다.");
      return;
    }

    window.naver.maps.Service.geocode(
      { query: address },
      (status: string, response: GeocodeResponse) => {
        if (status === window.naver.maps.Service.Status.ERROR) {
          onError(
            "주소를 찾을 수 없습니다. 정확한 주소를 입력해 주세요.( ex.도로명 주소 )"
          );
          return;
        }

        if (
          !response.v2 ||
          !response.v2.addresses ||
          response.v2.addresses.length === 0
        ) {
          onError(
            "검색 결과가 없습니다. 다른 키워드로 검색해 보세요.( ex.도로명 주소 )"
          );
          return;
        }

        const result = response.v2.addresses[0];

        if (!result.x || !result.y) {
          onError(
            "해당 주소의 정확한 위치를 찾을 수 없습니다.( ex.도로명 주소 )"
          );
          return;
        }

        if (!result.addressElements || result.addressElements.length === 0) {
          onError(
            "불완전한 주소 정보입니다. 더 구체적인 주소를 입력해 주세요.( ex.도로명 주소 )"
          );
          return;
        }

        const lat = parseFloat(result.y);
        const lng = parseFloat(result.x);

        if (isNaN(lat) || isNaN(lng)) {
          onError("좌표 정보가 올바르지 않습니다.");
          return;
        }

        // 캐시에 저장
        setAddressCache(address, lat, lng);

        // 검색 이력 저장
        const newHistory = [
          address,
          ...searchHistory.filter((item) => item !== address),
        ].slice(0, 5);
        setSearchHistory(newHistory);
        sessionStorage.setItem("searchHistory", JSON.stringify(newHistory));

        onSuccess(lat, lng);
      }
    );
  };

  // 다중 주소 검색 (검색 결과 리스트 반환)
  const searchAddressMultiple = async (
    address: string,
    onSuccess: (results: SearchResult[]) => void,
    onError: (message: string) => void
  ) => {
    if (!address.trim()) {
      onError("주소를 입력해주세요.");
      return;
    }

    if (!checkRateLimit()) {
      onError(
        "1분에 20회 이상 요청하실 수 없습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    // API 호출
    if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
      onError("네이버 지도 API가 로드되지 않았습니다.");
      return;
    }

    window.naver.maps.Service.geocode(
      { query: address },
      (status: string, response: GeocodeResponse) => {
        if (status === window.naver.maps.Service.Status.ERROR) {
          onError("주소를 찾을 수 없습니다. 정확한 주소를 입력해 주세요.");
          return;
        }

        if (
          !response.v2 ||
          !response.v2.addresses ||
          response.v2.addresses.length === 0
        ) {
          onError("검색 결과가 없습니다. 다른 키워드로 검색해 보세요.");
          return;
        }

        const results: SearchResult[] = response.v2.addresses.map((result) => ({
          roadAddress: result.roadAddress || result.jibunAddress || "",
          jibunAddress: result.jibunAddress || "",
          englishAddress: result.englishAddress || "",
          x: result.x,
          y: result.y,
          distance: result.distance || 0,
        }));

        // 검색 이력 저장
        const newHistory = [
          address,
          ...searchHistory.filter((item) => item !== address),
        ].slice(0, 5);
        setSearchHistory(newHistory);
        sessionStorage.setItem("searchHistory", JSON.stringify(newHistory));

        onSuccess(results);
      }
    );
  };

  return {
    searchHistory,
    setSearchHistory,
    searchAddress,
    searchAddressMultiple,
    getAddressCache,
    setAddressCache,
  };
};
