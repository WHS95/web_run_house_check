"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useGeocoding } from "@/hooks/useGeocoding";
import { NaverMapPosition } from "@/lib/types/naver-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Loader2 } from "lucide-react";
import SectionLabel from "@/components/atoms/SectionLabel";

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
  const saveToHistory = useCallback(
    (query: string) => {
      const newHistory = [
        query,
        ...searchHistory.filter((item) => item !== query),
      ].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem(
        "address-search-history",
        JSON.stringify(newHistory)
      );
    },
    [searchHistory]
  );

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
        console.log("error1231", errorMessage);
        //검색 결과가 없습니다. 다른 키워드로 검색해 보세요.( ex.도로명 주소 )
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
      <div className='flex gap-2'>
        <Input
          type='text'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className='flex-1 text-white placeholder-rh-text-secondary border-rh-border bg-rh-bg-surface focus:border-rh-accent'
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          className='text-white bg-rh-accent hover:bg-rh-accent-hover/80'
        >
          {loading ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : (
            <Search className='w-4 h-4' />
          )}
        </Button>
      </div>

      {/* 검색 결과 / 검색 기록 드롭다운 */}
      {isOpen && (
        <Card className='absolute left-0 right-0 z-50 mt-1 border-rh-border shadow-lg top-full bg-rh-bg-surface'>
          <CardContent className='p-0'>
            {loading && (
              <div className='p-4 text-center'>
                <Loader2 className='w-5 h-5 mx-auto mb-2 animate-spin text-rh-accent' />
                <p className='text-sm text-rh-text-secondary'>주소 검색 중...</p>
              </div>
            )}

            {error && (
              <div className='p-4 text-center'>
                <p className='text-sm text-red-400'>
                  검색 중 오류가 발생했습니다
                </p>
                <p className='mt-1 text-xs text-rh-text-tertiary'>{error}</p>
              </div>
            )}

            {!loading && !error && searchResults.length > 0 && (
              <div>
                <div className='p-2 border-b border-rh-border'>
                  <SectionLabel>검색 결과</SectionLabel>
                </div>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleResultSelect(result)}
                    className='w-full p-3 text-left transition-colors hover:bg-rh-bg-primary'
                  >
                    <div className='flex items-start gap-3'>
                      <MapPin className='flex-shrink-0 w-4 h-4 mt-1 text-rh-accent' />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-white truncate'>
                          {result.roadAddress || result.address}
                        </p>
                        {result.roadAddress &&
                          result.address !== result.roadAddress && (
                            <p className='mt-1 text-xs text-rh-text-secondary'>
                              지번: {result.address}
                            </p>
                          )}
                        <p className='mt-1 text-xs text-rh-text-tertiary'>
                          좌표: {result.position.lat.toFixed(6)},{" "}
                          {result.position.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading &&
              !error &&
              searchResults.length === 0 &&
              searchQuery && (
                <div className='p-4 text-center'>
                  <p className='text-sm text-rh-text-secondary'>검색 결과가 없습니다</p>
                  <p className='mt-1 text-xs text-rh-text-tertiary'>
                    다른 키워드로 검색해보세요
                  </p>
                </div>
              )}

            {!loading && !error && !searchQuery && searchHistory.length > 0 && (
              <div>
                <div className='p-2 border-b border-rh-border'>
                  <SectionLabel>최근 검색</SectionLabel>
                </div>
                {searchHistory.map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistorySelect(historyItem)}
                    className='w-full p-3 text-left transition-colors hover:bg-rh-bg-primary'
                  >
                    <div className='flex items-center gap-3'>
                      <Search className='flex-shrink-0 w-4 h-4 text-rh-text-secondary' />
                      <span className='text-sm text-rh-text-secondary truncate'>
                        {historyItem}
                      </span>
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
