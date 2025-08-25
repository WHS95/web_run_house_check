"use client";

import React, { useState, useCallback, useEffect } from "react";
import { CrewLocation, CrewLocationForm } from "@/lib/types/crew-locations";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import LocationList from "./LocationList";
import LocationModal from "./LocationModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Settings } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface CrewLocationManagementProps {
  crewId: string;
  initialLocations: CrewLocation[];
  locationBasedAttendance?: boolean;
  onLocationUpdate?: () => void;
}

export default function CrewLocationManagement({
  crewId,
  initialLocations,
  locationBasedAttendance = false,
  onLocationUpdate,
}: CrewLocationManagementProps) {
  const [locations, setLocations] = useState<CrewLocation[]>(initialLocations);
  const [selectedLocation, setSelectedLocation] = useState<CrewLocation | null>(null);
  const [isLocationBasedEnabled, setIsLocationBasedEnabled] = useState(locationBasedAttendance);
  
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

  const [loading, setLoading] = useState(false);

  // 초기 locations 업데이트
  useEffect(() => {
    setLocations(initialLocations);
  }, [initialLocations]);

  // 모달 열기
  const openModal = useCallback((mode: "add" | "edit" | "delete", location?: CrewLocation) => {
    haptic.light();
    setModalState({
      isOpen: true,
      mode,
      location: location || null,
    });
  }, []);

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
      const response = await fetch("/api/admin/crew-settings/location-attendance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crew_id: crewId,
          location_based_attendance: enabled,
        }),
      });

      if (response.ok) {
        setIsLocationBasedEnabled(enabled);
        haptic.success();
        onLocationUpdate?.();
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
          setLocations(prev => 
            prev.map(loc => loc.id === modalState.location!.id ? result.data : loc)
          );
        } else {
          setLocations(prev => [...prev, result.data]);
        }
        
        haptic.success();
        onLocationUpdate?.();
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

  // 활동장소 삭제
  const handleLocationDelete = async (location: CrewLocation) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/crew-locations/${location.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLocations(prev => prev.filter(loc => loc.id !== location.id));
        
        if (selectedLocation?.id === location.id) {
          setSelectedLocation(null);
        }
        
        haptic.success();
        onLocationUpdate?.();
      } else {
        throw new Error("활동장소 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("활동장소 삭제 오류:", error);
      haptic.error();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 활동장소 상태 토글
  const handleLocationToggle = async (location: CrewLocation) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/crew-locations/${location.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !location.is_active,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLocations(prev => 
          prev.map(loc => loc.id === location.id ? result.data : loc)
        );
        
        haptic.success();
        onLocationUpdate?.();
      } else {
        throw new Error("활동장소 상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("활동장소 상태 변경 오류:", error);
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 위치 기반 출석 설정 */}
      <Card className="bg-basic-black-gray border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-basic-blue" />
            출석 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="location-based" className="text-white font-medium">
                위치 기반 출석
              </Label>
              <p className="text-sm text-gray-400">
                등록된 활동장소 근처에서만 출석을 허용합니다
              </p>
            </div>
            <Switch
              id="location-based"
              checked={isLocationBasedEnabled}
              onCheckedChange={handleLocationBasedToggle}
              disabled={loading}
              className="data-[state=checked]:bg-basic-blue"
            />
          </div>
        </CardContent>
      </Card>

      {/* 활동장소 관리 */}
      <Card className="bg-basic-black-gray border-gray-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-basic-blue" />
              활동장소 관리
            </CardTitle>
            <Button
              onClick={() => openModal("add")}
              className="bg-basic-blue hover:bg-basic-blue/80 text-white"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              장소 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 활동장소 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">등록된 장소</h3>
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

            {/* 지도 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">위치 보기</h3>
              <NaverMapContainer
                locations={locations.filter(loc => loc.is_active)}
                selectedLocation={selectedLocation}
                onLocationClick={setSelectedLocation}
                height="400px"
                showControls={true}
              />
              {selectedLocation && (
                <Card className="bg-basic-black border-gray-600">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-2">
                      {selectedLocation.name}
                    </h4>
                    {selectedLocation.description && (
                      <p className="text-sm text-gray-300 mb-2">
                        {selectedLocation.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      좌표: {selectedLocation.latitude?.toFixed(6)}, {selectedLocation.longitude?.toFixed(6)}
                    </p>
                  </CardContent>
                </Card>
              )}
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
        loading={loading}
      />
    </div>
  );
}