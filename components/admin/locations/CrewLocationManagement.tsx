"use client";

import React, { useState, useCallback, memo } from "react";
import {
  CrewLocation,
  CrewLocationForm,
} from "@/lib/validators/crewLocationSchema";
import { useCrewLocationContext } from "@/contexts/CrewLocationContext";
import LocationList from "./LocationList";
import LocationModal from "./LocationModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Plus, Settings } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface CrewLocationManagementProps {
  crewId: string;
  locationBasedAttendance?: boolean;
}

function CrewLocationManagement({
  crewId,
  locationBasedAttendance = false,
}: CrewLocationManagementProps) {
  // 전역 상태 사용
  const { state, actions } = useCrewLocationContext();
  const { locations, selectedLocation, loading, error } = state;
  const {
    addLocation,
    updateLocation,
    deleteLocation,
    setSelectedLocation,
    setLoading,
    setError,
  } = actions;

  const [isLocationBasedEnabled, setIsLocationBasedEnabled] = useState(
    locationBasedAttendance,
  );

  // 모달 상태
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "add" | "edit" | "delete";
    location?: CrewLocation | null;
  }>({
    isOpen: false,
    mode: "add",
    location: null,
  });

  // 모달 열기
  const openModal = useCallback(
    (mode: "add" | "edit" | "delete", location?: CrewLocation) => {
      haptic.light();
      setModalState({
        isOpen: true,
        mode,
        location: location || null,
      });
    },
    [],
  );

  // 모달 닫기
  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: "add",
      location: null,
    });
  }, []);

  // 위치 기반 출석 토글
  const handleLocationBasedToggle = async (enabled: boolean) => {
    setLoading(true);
    haptic.medium();

    try {
      const response = await fetch(
        "/api/admin/crew-settings/location-attendance",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            crew_id: crewId,
            location_based_attendance: enabled,
          }),
        },
      );

      if (response.ok) {
        setIsLocationBasedEnabled(enabled);
        haptic.success();
        // onLocationUpdate 제거 - 팝업 없이 내부 상태만 업데이트
      } else {
        throw new Error("위치 기반 출석 설정 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("위치 기반 출석 설정 오류:", error);
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  // 활동장소 추가/수정
  const handleLocationSubmit = async (data: CrewLocationForm) => {
    console.log("🚀 [CrewLocationManagement] 활동장소 저장 시작");
    console.log("📝 데이터:", data);
    console.log("👥 크루 ID:", crewId);
    console.log("✏️ 편집 모드:", modalState.mode);

    setLoading(true);

    try {
      const isEditing = modalState.mode === "edit" && modalState.location;
      const url = isEditing
        ? `/api/admin/crew-locations/${modalState.location!.id}`
        : "/api/admin/crew-locations";

      const method = isEditing ? "PUT" : "POST";
      const requestBody = isEditing ? data : { crew_id: crewId, ...data };

      console.log("🌐 API 요청:");
      console.log("  URL:", url);
      console.log("  Method:", method);
      console.log("  Body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 응답 상태:", response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ API 응답 성공:", result);

        if (isEditing) {
          updateLocation(result.data);
        } else {
          addLocation(result.data);
        }

        haptic.success();
        console.log("🎉 활동장소 저장 완료");
      } else {
        const errorData = await response.text();
        console.error("❌ API 응답 오류:");
        console.error("  상태:", response.status, response.statusText);
        console.error("  응답:", errorData);
        throw new Error(`활동장소 저장에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error("💥 활동장소 저장 오류:", error);
      if (error instanceof Error) {
        console.error("  에러 메시지:", error.message);
        console.error("  스택 트레이스:", error.stack);
      }
      haptic.error();
      throw error;
    } finally {
      setLoading(false);
      console.log("🏁 활동장소 저장 프로세스 종료");
    }
  };

  // 활동장소 삭제 - 최적화
  const handleLocationDelete = useCallback(
    async (location: CrewLocation) => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/admin/crew-locations/${location.id}`,
          {
            method: "DELETE",
          },
        );

        console.log("📡 응답 상태:", response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log("📡 응답 데이터:", result);

          // 전역 상태에서 삭제
          deleteLocation(location.id);

          // 삭제 완료 후 모달 닫기
          closeModal();

          haptic.success();
        } else {
          const errorData = await response.json();
          console.log("📡 에러 데이터:", errorData);
          throw new Error(errorData.error || "활동장소 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("활동장소 삭제 오류:", error);
        haptic.error();
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [selectedLocation?.id, closeModal, deleteLocation, setLoading],
  );

  // 활동장소 상태 토글 - 개별 항목만 업데이트
  const handleLocationToggle = useCallback(
    async (location: CrewLocation) => {
      try {
        const response = await fetch(
          `/api/admin/crew-locations/${location.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              is_active: !location.is_active,
            }),
          },
        );

        if (response.ok) {
          const result = await response.json();

          // 전역 상태에서 업데이트
          const updatedLocation = {
            ...result.data,
            updated_at: new Date().toISOString(),
          };
          updateLocation(updatedLocation);

          haptic.success();
        } else {
          throw new Error("활동장소 상태 변경에 실패했습니다.");
        }
      } catch (error) {
        console.error("활동장소 상태 변경 오류:", error);
        haptic.error();
      }
    },
    [updateLocation],
  );

  return (
    <div className='space-y-6'>
      {/* 위치 기반 출석 설정 */}
      <Card className='border-rh-border bg-rh-bg-surface'>
        <CardHeader>
          <CardTitle className='flex gap-2 items-center text-white'>
            <Settings className='w-5 h-5 text-rh-accent' />
            위치 기반 출석 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex justify-between items-center'>
            <div className='space-y-1'>
              <p className='text-sm text-rh-text-secondary'>
                등록된 주소의 위경도 기준
                <br />약 300m 이내에서 출석 가능
              </p>
            </div>
            <Switch
              id='location-based'
              checked={isLocationBasedEnabled}
              onCheckedChange={handleLocationBasedToggle}
              disabled={loading}
              className='data-[state=checked]:bg-rh-accent'
            />
          </div>
        </CardContent>
      </Card>

      {/* 활동장소 관리 */}
      <Card className='border-rh-border bg-rh-bg-surface'>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle className='flex gap-2 items-center text-white'>
              <MapPin className='w-5 h-5 text-rh-accent' />
              장소
            </CardTitle>
            <Button
              onClick={() => openModal("add")}
              className='text-white bg-rh-accent hover:bg-rh-accent-hover/80'
              disabled={loading}
            >
              <Plus className='w-2 h-2' />
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-3'>
          <div className='grid grid-cols-1 gap-6'>
            {/* 활동장소 목록 */}
            <div className='space-y-4'>
              {/* <h3 className='text-lg font-semibold text-white'>등록된 장소</h3> */}
              <LocationList
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                onLocationEdit={(location) => openModal("edit", location)}
                onLocationDelete={(location) => openModal("delete", location)}
                onLocationToggle={handleLocationToggle}
                loading={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 모달 */}
      <LocationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        mode={modalState.mode}
        location={modalState.location}
        onSubmit={handleLocationSubmit}
        onDelete={handleLocationDelete}
        onToggleStatus={handleLocationToggle}
        loading={loading}
      />
    </div>
  );
}

// React.memo로 컴포넌트 최적화 - props가 변경될 때만 리렌더링
export default memo(CrewLocationManagement);
