"use client";

import { useState, useCallback } from "react";
import AdminCrewMembersManagement from "@/components/organisms/AdminCrewMembersManagement";
import AdminInviteCodesManagement from "@/components/organisms/AdminInviteCodesManagement";
import AdminNoticeManagement from "@/components/organisms/AdminNoticeManagement";
import AdminGradeManagement from "@/components/organisms/AdminGradeManagement";
import CrewLocationManagement from "@/components/admin/locations/CrewLocationManagement";
import NaverMapLoader from "@/components/map/NaverMapLoader";

import AdminPageContainer from "@/components/layouts/AdminPageContainer";
import { CrewLocation } from "@/lib/validators/crewLocationSchema";
import { CrewMember } from "@/lib/validators/crewMemberSchema";
import { InviteCode } from "@/lib/validators/inviteCodeSchema";
import { CrewLocationProvider } from "@/contexts/CrewLocationContext";
import { CrewMemberProvider } from "@/contexts/CrewMemberContext";
import { InviteCodeProvider } from "@/contexts/InviteCodeContext";
import { haptic } from "@/lib/haptic";

interface AdminSettingsManagementProps {
  initialLocations: CrewLocation[];
  initialMembers?: CrewMember[];
  initialInviteCodes?: InviteCode[];
  crewId: string;
  locationBasedAttendance?: boolean;
}

export default function AdminSettingsManagementNew({
  initialLocations,
  initialMembers = [],
  initialInviteCodes = [],
  crewId,
  locationBasedAttendance = false,
}: AdminSettingsManagementProps) {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<
    "locations" | "members" | "invites" | "notices" | "grades"
  >("locations");

  const [localLocationBasedAttendance, setLocalLocationBasedAttendance] = useState(locationBasedAttendance);

  // 탭 변경 핸들러 최적화
  const handleTabChange = useCallback((tab: "locations" | "members" | "invites" | "notices" | "grades") => {
    haptic.light();
    setActiveTab(tab);
    
    // 장소 탭으로 돌아올 때 설정값 초기화
    if (tab === "locations") {
      setLocalLocationBasedAttendance(locationBasedAttendance);
    }
  }, [locationBasedAttendance]);

  return (
    <CrewLocationProvider initialLocations={initialLocations}>
      <CrewMemberProvider initialMembers={initialMembers}>
        <InviteCodeProvider initialInviteCodes={initialInviteCodes}>
          <AdminPageContainer>
        {/* 탭 네비게이션 */}
        <div className='sticky top-4 z-30 lg:top-6'>
          <div className='bg-rh-bg-surface rounded-lg p-1 flex'>
            <button
              onClick={() => handleTabChange("locations")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all text-center ${
                activeTab === "locations"
                  ? "bg-rh-accent text-white"
                  : "text-rh-text-secondary hover:text-white"
              }`}
            >
              장소
            </button>
            <button
              onClick={() => handleTabChange("members")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all text-center ${
                activeTab === "members"
                  ? "bg-rh-accent text-white"
                  : "text-rh-text-secondary hover:text-white"
              }`}
            >
              운영진
            </button>
            <button
              onClick={() => handleTabChange("invites")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all text-center ${
                activeTab === "invites"
                  ? "bg-rh-accent text-white"
                  : "text-rh-text-secondary hover:text-white"
              }`}
            >
              초대코드
            </button>
            <button
              onClick={() => handleTabChange("grades")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all text-center ${
                activeTab === "grades"
                  ? "bg-rh-accent text-white"
                  : "text-rh-text-secondary hover:text-white"
              }`}
            >
              등급
            </button>
          </div>
        </div>

        {/* 활동장소 관리 */}
        {activeTab === "locations" && (
          <NaverMapLoader>
            <CrewLocationManagement
              crewId={crewId}
              locationBasedAttendance={localLocationBasedAttendance}
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

        {/* 공지 관리 */}
        {activeTab === "notices" && (
          <AdminNoticeManagement crewId={crewId} />
        )}

        {/* 등급 관리 */}
        {activeTab === "grades" && (
          <AdminGradeManagement crewId={crewId} />
        )}
          </AdminPageContainer>
        </InviteCodeProvider>
      </CrewMemberProvider>
    </CrewLocationProvider>
  );
}
