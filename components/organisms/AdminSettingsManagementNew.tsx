"use client";

import React, { useState, useTransition } from "react";
import { MapPin, Users, Ticket } from "lucide-react";
import AdminCrewMembersManagement from "@/components/organisms/AdminCrewMembersManagement";
import AdminInviteCodesManagement from "@/components/organisms/AdminInviteCodesManagement";
import CrewLocationManagement from "@/components/admin/locations/CrewLocationManagement";
import NaverMapLoader from "@/components/map/NaverMapLoader";
import AdminPageContainer from "@/components/layouts/AdminPageContainer";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";
import { CrewLocation } from "@/lib/types/crew-locations";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<
    "locations" | "members" | "invites"
  >("locations");

  // 알림 상태
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    message: string;
    type: NotificationType;
  }>({
    isVisible: false,
    message: "",
    type: "success",
  });

  // 알림 표시 헬퍼
  const showNotification = (message: string, type: NotificationType) => {
    setNotification({
      isVisible: true,
      message,
      type,
    });
  };

  // 알림 닫기 헬퍼
  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  // 위치 업데이트 콜백
  const handleLocationUpdate = () => {
    startTransition(() => {
      router.refresh();
    });
    showNotification("변경사항이 저장되었습니다.", "success");
  };


  return (
    <AdminPageContainer>
      {/* 탭 네비게이션 */}
      <div className='bg-basic-black-gray rounded-lg p-2 shadow-sm sticky top-4 lg:top-6 z-30'>
        <div className='flex rounded-lg bg-basic-gray/30 p-1'>
          <button
            onClick={() => {
              haptic.light();
              setActiveTab("locations");
            }}
            className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "locations"
                ? "bg-basic-blue text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MapPin className='w-4 h-4' />
            <span className="hidden sm:inline">장소</span>
          </button>
          <button
            onClick={() => {
              haptic.light();
              setActiveTab("members");
            }}
            className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "members"
                ? "bg-basic-blue text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className='w-4 h-4' />
            <span className="hidden sm:inline">운영진</span>
          </button>
          <button
            onClick={() => {
              haptic.light();
              setActiveTab("invites");
            }}
            className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "invites"
                ? "bg-basic-blue text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Ticket className='w-4 h-4' />
            <span className="hidden sm:inline">초대코드</span>
          </button>
        </div>
      </div>

      {/* 활동장소 관리 */}
      {activeTab === "locations" && (
        <NaverMapLoader>
          <CrewLocationManagement
            crewId={crewId}
            initialLocations={initialLocations}
            locationBasedAttendance={locationBasedAttendance}
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
      {/* 팝업 알림 */}
      <PopupNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        duration={2000}
        onClose={closeNotification}
      />
    </AdminPageContainer>
  );
}
