"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "선택해주세요",
  disabled = false,
  className = "",
  maxHeight = "200px",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 필터링된 옵션들
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 선택된 옵션 찾기
  const selectedOption = options.find((option) => option.value === value);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleOptionSelect(filteredOptions[highlightedIndex].value);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearchTerm("");
          setHighlightedIndex(0);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions, highlightedIndex]);

  // 드롭다운이 열릴 때 검색 입력에 포커스
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // 하이라이트된 항목을 뷰포트에 유지
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
      setHighlightedIndex(0);
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 메인 버튼 */}
      <button
        type='button'
        onClick={handleToggle}
        disabled={disabled}
        className={`
                    w-full flex items-center justify-between
                    p-3 bg-basic-black border border-basic-gray rounded-md
                    text-white text-left transition-colors
                    ${
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-gray-400 focus:border-basic-blue focus:outline-none"
                    }
                    ${isOpen ? "border-basic-blue" : ""}`}
      >
        <span className={selectedOption ? "text-white" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className='flex items-center space-x-2'>
          {selectedOption && !disabled && (
            <X
              className='w-4 h-4 text-gray-400 transition-colors hover:text-white'
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className='absolute z-50 mt-1 w-full rounded-md border shadow-lg bg-basic-black-gray border-basic-gray'>
          {/* 검색 입력 */}
          <div className='p-3 border-b border-basic-gray'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
              <input
                ref={searchInputRef}
                type='text'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder='크루 검색...'
                className='py-2 pr-3 pl-10 w-full text-white rounded border bg-basic-black border-basic-gray placeholder:text-gray-400 focus:border-basic-blue focus:outline-none'
              />
            </div>
          </div>

          {/* 옵션 리스트 */}
          <div
            ref={listRef}
            className='overflow-y-auto max-h-48'
            style={{ maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <div className='p-3 text-center text-gray-400'>
                {searchTerm ? "검색 결과가 없습니다" : "옵션이 없습니다"}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleOptionSelect(option.value)}
                  className={`
                                        w-full text-left px-3 py-3 transition-colors
                                        ${
                                          index === highlightedIndex
                                            ? "bg-basic-blue text-white"
                                            : "text-gray-300 hover:bg-basic-gray hover:text-white"
                                        }
                                        ${
                                          option.value === value
                                            ? "bg-basic-blue/20 text-basic-blue"
                                            : ""
                                        }
                                    `}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
