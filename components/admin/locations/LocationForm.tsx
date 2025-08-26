"use client";

import React, { useState, useEffect } from "react";
import { CrewLocation, CrewLocationForm } from "@/lib/types/crew-locations";
import { NaverMapPosition } from "@/lib/types/naver-maps";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import AddressSearch from "@/components/map/AddressSearch";
import { useGeocoding } from "@/hooks/useGeocoding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Save, X, RefreshCw } from "lucide-react";

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
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  const { reverseGeocode } = useGeocoding();

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
  const handleMapClick = async (position: NaverMapPosition) => {
    console.log("🗺️ [LocationForm] 지도 클릭:", position);
    
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

    // 자동으로 역지오코딩 실행
    await handleReverseGeocode(position.lat, position.lng);
  };

  // 역지오코딩 실행
  const handleReverseGeocode = async (lat: number, lng: number) => {
    console.log("🔄 [LocationForm] 역지오코딩 시작:", { lat, lng });
    setReverseGeocoding(true);

    reverseGeocode(
      lat,
      lng,
      (roadAddress: string, jibunAddress: string) => {
        console.log("✅ [LocationForm] 역지오코딩 성공:", { roadAddress, jibunAddress });
        setFormData((prev) => ({
          ...prev,
          address: roadAddress || jibunAddress,
        }));
        setReverseGeocoding(false);
      },
      (error: string) => {
        console.error("❌ [LocationForm] 역지오코딩 실패:", error);
        setReverseGeocoding(false);
      }
    );
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
              locations={
                selectedPosition
                  ? [
                      {
                        id: 0,
                        crew_id: "",
                        name: "선택된 위치",
                        description: "",
                        latitude: selectedPosition.lat,
                        longitude: selectedPosition.lng,
                        is_active: true,
                        created_at: "",
                        updated_at: "",
                      },
                    ]
                  : []
              }
              center={mapCenter}
              onMapClick={handleMapClick}
              clickable={true}
              height='300px'
            />

            {errors.position && (
              <p className='text-sm text-red-400'>{errors.position}</p>
            )}
          </div>

          {/* 좌표 및 주소 정보 */}
          {formData.latitude !== 0 && formData.longitude !== 0 && (
            <div className='p-3 border border-gray-600 rounded-lg bg-basic-black'>
              <div className='flex items-center justify-between mb-2'>
                <Label className='text-sm text-white'>선택된 위치 정보</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => handleReverseGeocode(formData.latitude, formData.longitude)}
                  disabled={reverseGeocoding}
                  className='text-xs text-gray-400 border-gray-600 hover:bg-gray-600/20'
                >
                  {reverseGeocoding ? (
                    <RefreshCw className='w-3 h-3 mr-1 animate-spin' />
                  ) : (
                    <RefreshCw className='w-3 h-3 mr-1' />
                  )}
                  주소 가져오기
                </Button>
              </div>
              
              <div className='space-y-2 text-sm'>
                <div className='text-gray-300'>
                  <span className='font-medium text-white'>좌표:</span> {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                </div>
                
                {formData.address && (
                  <div className='text-gray-300'>
                    <span className='font-medium text-white'>주소:</span> {formData.address}
                  </div>
                )}
                
                {reverseGeocoding && (
                  <div className='text-basic-blue'>
                    주소 정보를 가져오는 중...
                  </div>
                )}
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
