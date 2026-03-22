"use client";

import React, { useState, useEffect } from "react";
import { CrewLocation, CrewLocationForm } from "@/lib/validators/crewLocationSchema";
import { NaverMapPosition } from "@/lib/types/naver-maps";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import AddressSearch from "@/components/map/AddressSearch";
import { useGeocoding } from "@/hooks/useGeocoding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { MapPin, Save } from "lucide-react";
import RadiusSlider from "./RadiusSlider";

interface LocationFormProps {
  initialData?: CrewLocation | null;
  onSubmit: (data: CrewLocationForm) => Promise<void>;
  onCancel: () => void;
  onDelete?: (location: CrewLocation) => Promise<void>;
  onToggleStatus?: (location: CrewLocation) => Promise<void>;
  loading?: boolean;
  title?: string;
}

export default function LocationForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  onToggleStatus,
  loading = false,
  title = "활동장소 추가",
}: LocationFormProps) {
  const [formData, setFormData] = useState<CrewLocationForm>({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    address: "",
    allowed_radius: 50,
  });

  const [mapCenter, setMapCenter] = useState<NaverMapPosition>({
    lat: 37.5665,
    lng: 126.978,
  });

  const [selectedPosition, setSelectedPosition] =
    useState<NaverMapPosition | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        allowed_radius: initialData.allowed_radius || 50,
      });

      setIsActive(initialData.is_active);

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
      newErrors.name = "장소 이름을 입력해주세요.";
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
    // console.log("🗺️ [LocationForm] 지도 클릭:", position);

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
        allowed_radius: formData.allowed_radius,
      });
    } catch (error) {
      console.error("활동장소 저장 오류:", error);
    }
  };

  // 삭제 확인 핸들러
  const handleDeleteConfirm = async () => {
    if (onDelete && initialData) {
      try {
        await onDelete(initialData);
        setShowDeleteConfirm(false);
        onCancel();
      } catch (error) {
        console.error("삭제 오류:", error);
        setShowDeleteConfirm(false);
      }
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
    <div className='bg-rh-bg-primary'>
      <form onSubmit={handleSubmit} className='space-y-5 px-4 py-5'>
        {/* 활동장소 이름 */}
        <div className='space-y-2'>
          <Label htmlFor='name' className='text-sm font-semibold text-white'>
            모임 장소명
          </Label>
          <Input
            id='name'
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder='예: 한강공원'
            className='placeholder-rh-text-muted text-white border-rh-border bg-rh-bg-surface focus:border-rh-accent'
          />
          {errors.name && (
            <p className='text-xs text-rh-status-error mt-1'>
              {errors.name}
            </p>
          )}
        </div>

        {/* 주소 검색 */}
        <div className='space-y-2'>
          <Label className='text-sm font-semibold text-white'>
            주소 검색
          </Label>
          <AddressSearch
            onAddressSelect={handleAddressSelect}
            placeholder='도로명 주소 입력'
          />
        </div>

        {/* 좌표 및 주소 정보 */}
        {formData.latitude !== 0 && formData.longitude !== 0 && (
          <div className='p-3 rounded-xl border border-rh-border bg-rh-bg-surface'>
            <div className='space-y-1.5 text-sm'>
              <div className='flex items-center gap-2 text-rh-text-secondary'>
                <MapPin className='w-3.5 h-3.5 text-rh-accent flex-shrink-0' />
                <span className='truncate'>
                  {formData.address || `${formData.latitude?.toFixed(6)}, ${formData.longitude?.toFixed(6)}`}
                </span>
              </div>
              {reverseGeocoding && (
                <div className='text-xs text-rh-accent pl-5.5'>
                  주소 가져오는 중...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 지도 */}
        <div className='space-y-2'>
          <Label className='text-sm font-semibold text-white'>
            위치 선택
          </Label>
          <div className='rounded-xl overflow-hidden border border-rh-border'>
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
              height='220px'
            />
          </div>
          {errors.position && (
            <p className='text-xs text-rh-status-error mt-1'>
              {errors.position}
            </p>
          )}
        </div>

        {/* 허용 반경 슬라이더 */}
        <div className='bg-rh-bg-surface rounded-xl p-4 border border-rh-border'>
          <RadiusSlider
            value={formData.allowed_radius}
            onChange={(radius) =>
              setFormData((prev) => ({
                ...prev,
                allowed_radius: radius,
              }))
            }
          />
        </div>

        {/* 하단 액션 버튼 영역 */}
        <div className='pt-2 pb-safe space-y-3'>
          {/* 저장/추가 버튼 */}
          <Button
            type='submit'
            disabled={loading}
            className='w-full h-12 text-white bg-rh-accent hover:bg-rh-accent-hover/80 rounded-xl text-base font-medium'
          >
            {loading ? (
              <div className='flex gap-2 items-center'>
                <div className='w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent' />
                저장 중...
              </div>
            ) : (
              <div className='flex gap-2 items-center'>
                <Save className='w-4 h-4' />
                {initialData ? "수정하기" : "추가하기"}
              </div>
            )}
          </Button>

          {/* 편집 모드: 삭제 버튼 */}
          {initialData && (
            <button
              type='button'
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className='w-full py-3 text-sm text-rh-status-error hover:text-rh-status-error/80 transition-colors'
            >
              장소 삭제
            </button>
          )}
        </div>
      </form>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="장소 삭제"
        description="이 작업은 되돌릴 수 없습니다."
        itemName={initialData?.name}
        loading={loading}
      />
    </div>
  );
}

