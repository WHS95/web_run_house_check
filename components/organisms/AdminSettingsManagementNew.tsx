"use client";

import { useState, useCallback, useMemo } from "react";
import { MapPin, Users, Ticket } from "lucide-react";
import AdminCrewMembersManagement from "@/components/organisms/AdminCrewMembersManagement";
import AdminInviteCodesManagement from "@/components/organisms/AdminInviteCodesManagement";
import CrewLocationManagement from "@/components/admin/locations/CrewLocationManagement";
import NaverMapLoader from "@/components/map/NaverMapLoader";

import AdminPageContainer from "@/components/layouts/AdminPageContainer";
import { CrewLocation } from "@/lib/types/crew-locations";
import { haptic } from "@/lib/haptic";

interface AdminSettingsManagementProps {
  initialLocations: CrewLocation[];
  crewId: string;
  locationBasedAttendance?: boolean;
}

export default function AdminSettingsManagementNew({
  initialLocations,
  crewId,
  locationBasedAttendance = false,
}: AdminSettingsManagementProps) {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<
    "locations" | "members" | "invites"
  >("locations");

  // 로컬 locations 상태 관리
  const [locations, setLocations] = useState<CrewLocation[]>(initialLocations);
  const [localLocationBasedAttendance, setLocalLocationBasedAttendance] = useState(locationBasedAttendance);

  // 위치 업데이트 콜백 (팝업 없이 내부 상태만 업데이트)
  const handleLocationUpdate = useCallback(() => {
    // 아무것도 하지 않음 - CrewLocationManagement가 내부 상태를 관리함
  }, []);

  // 위치 기반 출석 설정 변경 콜백
  const handleLocationBasedAttendanceUpdate = useCallback((enabled: boolean) => {
    setLocalLocationBasedAttendance(enabled);
  }, []);

  // 탭 변경 핸들러 최적화
  const handleTabChange = useCallback((tab: "locations" | "members" | "invites") => {
    haptic.light();
    setActiveTab(tab);
  }, []);

  return (
    <AdminPageContainer>
      {/* 탭 네비게이션 */}
      <div className='sticky top-4 z-30 p-2 rounded-lg shadow-sm bg-basic-black-gray lg:top-6'>
        <div className='flex p-1 rounded-lg bg-basic-gray/30'>
          <button
            onClick={() => handleTabChange("locations")}
            className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "locations"
                ? "bg-basic-blue text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MapPin className='w-4 h-4' />
            <span className='hidden sm:inline'>장소</span>
          </button>
          <button
            onClick={() => handleTabChange("members")}
            className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "members"
                ? "bg-basic-blue text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className='w-4 h-4' />
            <span className='hidden sm:inline'>운영진</span>
          </button>
          <button
            onClick={() => handleTabChange("invites")}
            className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "invites"
                ? "bg-basic-blue text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Ticket className='w-4 h-4' />
            <span className='hidden sm:inline'>초대코드</span>
          </button>
        </div>
      </div>

      {/* 활동장소 관리 */}
      {activeTab === "locations" && (
        <NaverMapLoader>
          <CrewLocationManagement
            crewId={crewId}
            initialLocations={locations}
            locationBasedAttendance={localLocationBasedAttendance}
            onLocationUpdate={handleLocationUpdate}
          />
        </NaverMapLoader>
      )}

      {/* 크루 관리 */}
      {activeTab === "members" && (
        <AdminCrewMembersManagement crewId={crewId} />
      )}

      {/* 초대코드 관리 */}
      {activeTab === "invites" && (
        <AdminInviteCodesManagement crewId={crewId} />
      )}
    </AdminPageContainer>
  );
}
