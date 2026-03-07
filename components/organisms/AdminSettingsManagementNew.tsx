"use client";

import { useState, useCallback } from "react";
import { MapPin, Users, Ticket, Megaphone } from "lucide-react";
import AdminCrewMembersManagement from "@/components/organisms/AdminCrewMembersManagement";
import AdminInviteCodesManagement from "@/components/organisms/AdminInviteCodesManagement";
import AdminNoticeManagement from "@/components/organisms/AdminNoticeManagement";
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
    "locations" | "members" | "invites" | "notices"
  >("locations");

  const [localLocationBasedAttendance, setLocalLocationBasedAttendance] = useState(locationBasedAttendance);

  // 탭 변경 핸들러 최적화
  const handleTabChange = useCallback((tab: "locations" | "members" | "invites" | "notices") => {
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
        <div className='sticky top-4 z-30 p-2 rounded-lg shadow-sm bg-rh-bg-surface lg:top-6'>
          <div className='flex p-1 rounded-lg bg-rh-bg-muted/30'>
            <button
              onClick={() => handleTabChange("locations")}
              className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === "locations"
                  ? "bg-rh-accent text-white shadow-sm"
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
                  ? "bg-rh-accent text-white shadow-sm"
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
                  ? "bg-rh-accent text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Ticket className='w-4 h-4' />
              <span className='hidden sm:inline'>초대코드</span>
            </button>
            <button
              onClick={() => handleTabChange("notices")}
              className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === "notices"
                  ? "bg-rh-accent text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Megaphone className='w-4 h-4' />
              <span className='hidden sm:inline'>공지</span>
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
          </AdminPageContainer>
        </InviteCodeProvider>
      </CrewMemberProvider>
    </CrewLocationProvider>
  );
}
