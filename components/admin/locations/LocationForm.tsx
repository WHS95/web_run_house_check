"use client";

import React, { useState, useEffect } from "react";
import { CrewLocation, CrewLocationForm } from "@/lib/validators/crewLocationSchema";
import { NaverMapPosition } from "@/lib/types/naver-maps";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import AddressSearch from "@/components/map/AddressSearch";
import { useGeocoding } from "@/hooks/useGeocoding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  MapPin,
  Save,
  X,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

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
    <Card className='border-gray-600 bg-rh-bg-surface'>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* 활동장소 이름 */}
          <div className='space-y-2'>
            <Label htmlFor='name' className='font-semibold text-white'>
              모임 장소명
            </Label>
            <Input
              id='name'
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder='예: 한강공원 정기런닝 장소'
              className='placeholder-gray-400 text-white border-gray-600 bg-rh-bg-primary focus:border-rh-accent'
            />
            {errors.name && (
              <p className='text-sm text-red-400'>{errors.name}</p>
            )}
          </div>

          {/* 주소 검색 */}
          <div className='space-y-2'>
            <Label className='font-semibold text-white'>주소 검색</Label>
            <AddressSearch
              onAddressSelect={handleAddressSelect}
              placeholder='도로명 주소 입력'
            />
          </div>
          {/* 좌표 및 주소 정보 */}
          {formData.latitude !== 0 && formData.longitude !== 0 && (
            <div className='p-3 rounded-lg border border-gray-600 bg-rh-bg-primary'>
              <div className='flex justify-between items-center mb-2'>
                <Label className='text-sm text-white'>선택된 위치 정보</Label>
              </div>

              <div className='space-y-2 text-sm'>
                <div className='text-gray-300'>
                  <span className='font-medium text-white'>좌표:</span>{" "}
                  {formData.latitude?.toFixed(6)},{" "}
                  {formData.longitude?.toFixed(6)}
                </div>

                {formData.address && (
                  <div className='text-gray-300'>
                    <span className='font-medium text-white'>주소:</span>{" "}
                    {formData.address}
                  </div>
                )}

                {reverseGeocoding && (
                  <div className='text-rh-accent'>주소 정보 가져오는 중</div>
                )}
              </div>
            </div>
          )}

          {/* 지도 */}
          <div className='space-y-2'>
            <Label className='font-semibold text-white'>위치 선택</Label>
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

          {/* 편집 모드 전용 컨트롤 */}
          {initialData && (
            <div className='pt-4 space-y-4'>
              {/* 삭제 버튼 */}
              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className='text-white bg-rh-bg-primary border-rh-border hover:bg-rh-bg-primary/20'
                >
                  <Trash2 className='mr-2 w-4 h-4 text-red-400' />
                  장소 삭제
                </Button>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className='flex gap-3 pt-4'>
            <Button
              type='submit'
              disabled={loading}
              className='flex-1 text-white bg-rh-accent hover:bg-rh-accent-hover/80'
            >
              {loading ? (
                <div className='flex gap-2 items-center'>
                  <div className='w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent'></div>
                  저장 중...
                </div>
              ) : (
                <div className='flex gap-2 items-center'>
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
              className='flex-1 text-white bg-rh-bg-primary border-rh-border hover:bg-rh-bg-primary/20'
            >
              <X className='mr-2 w-4 h-4 text-white' />
              취소
            </Button>
          </div>
        </form>
      </CardContent>

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
    </Card>
  );
}

{
  /* <Button
type='button'
variant='outline'
size='sm'
onClick={() =>
  handleReverseGeocode(formData.latitude, formData.longitude)
}
disabled={reverseGeocoding}
className='text-xs text-gray-400 border-gray-600 hover:bg-gray-600/20'
>
{reverseGeocoding ? (
  <RefreshCw className='mr-1 w-3 h-3 animate-spin' />
) : (
  <RefreshCw className='mr-1 w-3 h-3' />
)}
주소 가져오기
</Button> */
}
