"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useGeocoding } from "@/hooks/useGeocoding";
import { NaverMapPosition } from "@/lib/types/naver-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Loader2 } from "lucide-react";

interface SearchResult {
  address: string;
  position: NaverMapPosition;
  roadAddress?: string;
}

interface AddressSearchProps {
  onAddressSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

export default function AddressSearch({
  onAddressSelect,
  placeholder = "주소를 입력하세요",
  className = "",
  defaultValue = "",
}: AddressSearchProps) {
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const { searchAddress, searchHistory: hookHistory } = useGeocoding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색 기록 로드
  useEffect(() => {
    setSearchHistory(hookHistory);
  }, [hookHistory]);

  // 검색 기록 저장
  const saveToHistory = useCallback((query: string) => {
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem("address-search-history", JSON.stringify(newHistory));
  }, [searchHistory]);

  // 주소 검색 실행
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    searchAddress(
      searchQuery,
      (lat: number, lng: number) => {
        const searchResult: SearchResult = {
          address: searchQuery,
          position: { lat, lng },
          roadAddress: searchQuery,
        };
        
        setSearchResults([searchResult]);
        setIsOpen(true);
        saveToHistory(searchQuery);
        setLoading(false);
      },
      (errorMessage: string) => {
        setError(errorMessage);
        setSearchResults([]);
        setIsOpen(true);
        setLoading(false);
      }
    );
  }, [searchQuery, searchAddress, saveToHistory]);

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // 검색 결과 선택
  const handleResultSelect = (result: SearchResult) => {
    setSearchQuery(result.roadAddress || result.address);
    setIsOpen(false);
    onAddressSelect(result);
  };

  // 검색 기록 선택
  const handleHistorySelect = (historyItem: string) => {
    setSearchQuery(historyItem);
    setIsOpen(false);
    handleSearch();
  };

  // 입력 포커스 시 드롭다운 표시
  const handleFocus = () => {
    if (searchHistory.length > 0 && !searchQuery) {
      setIsOpen(true);
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".address-search-container")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className={`relative address-search-container ${className}`}>
      <div className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="flex-1 bg-basic-black-gray border-gray-600 text-white placeholder-gray-400 focus:border-basic-blue"
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          className="bg-basic-blue hover:bg-basic-blue/80 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 검색 결과 / 검색 기록 드롭다운 */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-basic-black-gray border-gray-600 shadow-lg">
          <CardContent className="p-0">
            {loading && (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-basic-blue" />
                <p className="text-sm text-gray-400">주소 검색 중...</p>
              </div>
            )}

            {error && (
              <div className="p-4 text-center">
                <p className="text-sm text-red-400">검색 중 오류가 발생했습니다</p>
                <p className="text-xs text-gray-500 mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && searchResults.length > 0 && (
              <div>
                <div className="p-2 border-b border-gray-600">
                  <p className="text-xs font-medium text-gray-400 uppercase">검색 결과</p>
                </div>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleResultSelect(result)}
                    className="w-full p-3 text-left hover:bg-basic-black transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-1 text-basic-blue flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {result.roadAddress || result.address}
                        </p>
                        {result.roadAddress && result.address !== result.roadAddress && (
                          <p className="text-xs text-gray-400 mt-1">
                            지번: {result.address}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          좌표: {result.position.lat.toFixed(6)}, {result.position.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && !error && searchResults.length === 0 && searchQuery && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-400">검색 결과가 없습니다</p>
                <p className="text-xs text-gray-500 mt-1">다른 키워드로 검색해보세요</p>
              </div>
            )}

            {!loading && !error && !searchQuery && searchHistory.length > 0 && (
              <div>
                <div className="p-2 border-b border-gray-600">
                  <p className="text-xs font-medium text-gray-400 uppercase">최근 검색</p>
                </div>
                {searchHistory.map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistorySelect(historyItem)}
                    className="w-full p-3 text-left hover:bg-basic-black transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 truncate">{historyItem}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}