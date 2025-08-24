"use client";

import React, { useState, useEffect } from "react";
import { CrewLocation, CrewLocationForm } from "@/lib/types/crew-locations";
import { NaverMapPosition } from "@/lib/types/naver-maps";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import AddressSearch from "@/components/map/AddressSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Save, X } from "lucide-react";

interface LocationFormProps {
  initialData?: CrewLocation | null;
  onSubmit: (data: CrewLocationForm) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
}

export default function LocationForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  title = "활동장소 추가",
}: LocationFormProps) {
  const [formData, setFormData] = useState<CrewLocationForm>({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    address: "",
  });

  const [mapCenter, setMapCenter] = useState<NaverMapPosition>({
    lat: 37.5665,
    lng: 126.978,
  });

  const [selectedPosition, setSelectedPosition] =
    useState<NaverMapPosition | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        address: "",
      });

      const position = {
        lat: initialData.latitude,
        lng: initialData.longitude,
      };

      setMapCenter(position);
      setSelectedPosition(position);
    }
  }, [initialData]);

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "활동장소 이름을 입력해주세요.";
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      newErrors.position = "지도에서 위치를 선택하거나 주소를 검색해주세요.";
    }

    if (formData.latitude < -90 || formData.latitude > 90) {
      newErrors.position = "유효하지 않은 위도값입니다.";
    }

    if (formData.longitude < -180 || formData.longitude > 180) {
      newErrors.position = "유효하지 않은 경도값입니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 주소 검색 결과 처리
  const handleAddressSelect = (result: {
    address: string;
    position: NaverMapPosition;
  }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: result.position.lat,
      longitude: result.position.lng,
      address: result.address,
    }));

    setMapCenter(result.position);
    setSelectedPosition(result.position);

    // 위치 관련 에러 제거
    if (errors.position) {
      setErrors((prev) => ({
        ...prev,
        position: "",
      }));
    }
  };

  // 지도 클릭 처리
  const handleMapClick = (position: NaverMapPosition) => {
    setFormData((prev) => ({
      ...prev,
      latitude: position.lat,
      longitude: position.lng,
    }));

    setSelectedPosition(position);

    // 위치 관련 에러 제거
    if (errors.position) {
      setErrors((prev) => ({
        ...prev,
        position: "",
      }));
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
    } catch (error) {
      console.error("활동장소 저장 오류:", error);
    }
  };

  // 입력값 변경 처리
  const handleInputChange = (
    field: keyof CrewLocationForm,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 해당 필드 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <Card className='border-gray-600 bg-basic-black-gray'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-white'>
          <MapPin className='w-5 h-5 text-basic-blue' />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* 활동장소 이름 */}
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-white'>
              활동장소 이름 *
            </Label>
            <Input
              id='name'
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder='예: 한강공원 잠실대교 남단'
              className='text-white placeholder-gray-400 border-gray-600 bg-basic-black focus:border-basic-blue'
            />
            {errors.name && (
              <p className='text-sm text-red-400'>{errors.name}</p>
            )}
          </div>

          {/* 설명 */}
          <div className='space-y-2'>
            <Label htmlFor='description' className='text-white'>
              설명 (선택사항)
            </Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder='활동장소에 대한 추가 설명을 입력하세요'
              rows={3}
              className='text-white placeholder-gray-400 border-gray-600 resize-none bg-basic-black focus:border-basic-blue'
            />
          </div>

          {/* 주소 검색 */}
          <div className='space-y-2'>
            <Label className='text-white'>주소 검색</Label>
            <AddressSearch
              onAddressSelect={handleAddressSelect}
              placeholder='주소를 입력하여 위치를 찾으세요'
            />
          </div>

          {/* 지도 */}
          <div className='space-y-2'>
            <Label className='text-white'>
              위치 선택 *
              <span className='ml-2 text-sm font-normal text-gray-400'>
                지도를 클릭하여 정확한 위치를 선택하세요
              </span>
            </Label>
            <NaverMapContainer
              locations={[]}
              center={mapCenter}
              onMapClick={handleMapClick}
              clickable={true}
              height='300px'
            />

            {/* 임시 마커 표시 (선택된 위치가 있을 때) */}
            {selectedPosition && (
              <NaverMapContainer
                locations={[]}
                center={mapCenter}
                onMapClick={handleMapClick}
                clickable={true}
                height='300px'
              />
            )}

            {errors.position && (
              <p className='text-sm text-red-400'>{errors.position}</p>
            )}
          </div>

          {/* 좌표 정보 */}
          {formData.latitude !== 0 && formData.longitude !== 0 && (
            <div className='p-3 border border-gray-600 rounded-lg bg-basic-black'>
              <Label className='text-sm text-white'>선택된 좌표</Label>
              <div className='mt-1 text-sm text-gray-300'>
                위도: {formData.latitude?.toFixed(6)} / 경도:{" "}
                {formData.longitude?.toFixed(6)}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className='flex gap-3 pt-4'>
            <Button
              type='submit'
              disabled={loading}
              className='flex-1 text-white bg-basic-blue hover:bg-basic-blue/80'
            >
              {loading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin'></div>
                  저장 중...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Save className='w-4 h-4' />
                  {initialData ? "수정" : "추가"}
                </div>
              )}
            </Button>

            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={loading}
              className='flex-1 text-white border-gray-600 hover:bg-gray-600/20'
            >
              <X className='w-4 h-4 mr-2' />
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
