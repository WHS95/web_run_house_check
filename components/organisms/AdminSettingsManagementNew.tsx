"use client";

import React, { useState, useTransition } from "react";
import {
  MapPin,
  Plus,
  Edit,
  Save,
  X,
  Search,
  Trash2,
  Users,
  Loader2,
  Ticket,
} from "lucide-react";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";
import AdminCrewMembersManagement from "@/components/organisms/AdminCrewMembersManagement";
import AdminInviteCodesManagement from "@/components/organisms/AdminInviteCodesManagement";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";
import {
  CrewLocation,
  createCrewLocation,
  updateCrewLocation,
  deleteCrewLocation,
} from "@/lib/supabase/admin";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptic";

interface AdminSettingsManagementProps {
  initialLocations: CrewLocation[];
  crewId: string;
}

export default function AdminSettingsManagementNew({
  initialLocations,
  crewId,
}: AdminSettingsManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<
    "locations" | "members" | "invites"
  >("locations");

  // 활동장소 관련 상태
  const [locations, setLocations] = useState<CrewLocation[]>(initialLocations);
  const [searchTerm, setSearchTerm] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<number | null>(null);
  const [editLocationName, setEditLocationName] = useState("");

  // 로딩 상태
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

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

  // 검색된 장소 목록
  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 로딩 상태 설정 헬퍼
  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };

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

  // 활동장소 추가
  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) return;

    setLoading("create", true);
    haptic.medium();

    try {
      const { data, error } = await createCrewLocation(crewId, {
        name: newLocationName.trim(),
      });

      if (error) {
        //console.error("장소 추가 오류:", error);
        haptic.error();
        showNotification("장소 추가 중 오류가 발생했습니다.", "error");
        return;
      }

      if (data) {
        setLocations((prev) => [...prev, data]);
        setNewLocationName("");
        setIsCreatingLocation(false);
        haptic.success();

        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      //console.error("장소 추가 오류:", error);
      haptic.error();
      showNotification("장소 추가 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading("create", false);
    }
  };

  // 장소 수정 시작
  const handleStartEdit = (location: CrewLocation) => {
    haptic.light();
    setEditingLocation(location.id);
    setEditLocationName(location.name);
  };

  // 장소 수정 저장
  const handleSaveEdit = async () => {
    if (!editLocationName.trim() || editingLocation === null) return;

    setLoading(`edit-${editingLocation}`, true);
    haptic.medium();

    try {
      const { data, error } = await updateCrewLocation(editingLocation, {
        name: editLocationName.trim(),
      });

      if (error) {
        //console.error("장소 수정 오류:", error);
        haptic.error();
        showNotification("장소 수정 중 오류가 발생했습니다.", "error");
        return;
      }

      if (data) {
        setLocations((prev) =>
          prev.map((location) =>
            location.id === editingLocation ? data : location
          )
        );
        setEditingLocation(null);
        setEditLocationName("");
        haptic.success();

        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      //console.error("장소 수정 오류:", error);
      haptic.error();
      showNotification("장소 수정 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(`edit-${editingLocation}`, false);
    }
  };

  // 장소 수정 취소
  const handleCancelEdit = () => {
    haptic.light();
    setEditingLocation(null);
    setEditLocationName("");
  };

  // 장소 삭제
  const handleDeleteLocation = async (
    locationId: number,
    locationName: string
  ) => {
    if (!confirm(`정말로 "${locationName}" 장소를 삭제하시겠습니까?`)) return;

    setLoading(`delete-${locationId}`, true);
    haptic.medium();

    try {
      const { success, error } = await deleteCrewLocation(locationId);

      if (error) {
        //console.error("장소 삭제 오류:", error);
        haptic.error();
        showNotification("장소 삭제 중 오류가 발생했습니다.", "error");
        return;
      }

      if (success) {
        setLocations((prev) =>
          prev.filter((location) => location.id !== locationId)
        );
        haptic.success();

        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      //console.error("장소 삭제 오류:", error);
      haptic.error();
      showNotification("장소 삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(`delete-${locationId}`, false);
    }
  };

  return (
    <div className='flex flex-col h-screen bg-basic-black'>
      {/* 메인 컨텐츠 */}
      <div className='flex-1 px-[4vw] py-[3vh] pb-[20vh] space-y-[3vh] overflow-y-auto'>
        {/* 탭 네비게이션 */}
        <div className='bg-basic-black-gray rounded-[0.75rem] p-[1vw] shadow-sm'>
          <div className='flex rounded-[0.5rem] bg-basic-gray/30 p-[0.5vw]'>
            <button
              onClick={() => {
                haptic.light();
                setActiveTab("locations");
              }}
              className={`flex-1 py-[2vh] px-[2vw] rounded-[0.5rem] text-[0.875rem] font-medium transition-all ${
                activeTab === "locations"
                  ? "bg-basic-blue text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <MapPin className='w-[1rem] h-[1rem] mr-[1vw] inline' />
              장소
            </button>
            <button
              onClick={() => {
                haptic.light();
                setActiveTab("members");
              }}
              className={`flex-1 py-[2vh] px-[2vw] rounded-[0.5rem] text-[0.875rem] font-medium transition-all ${
                activeTab === "members"
                  ? "bg-basic-blue text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Users className='w-[1rem] h-[1rem] mr-[1vw] inline' />
              운영진
            </button>
            <button
              onClick={() => {
                haptic.light();
                setActiveTab("invites");
              }}
              className={`flex-1 py-[2vh] px-[2vw] rounded-[0.5rem] text-[0.875rem] font-medium transition-all ${
                activeTab === "invites"
                  ? "bg-basic-blue text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Ticket className='w-[1rem] h-[1rem] mr-[1vw] inline' />
              초대코드
            </button>
          </div>
        </div>

        {/* 활동장소 관리 */}
        {activeTab === "locations" && (
          <div className='bg-basic-black-gray rounded-[0.75rem] shadow-sm overflow-hidden'>
            {/* 헤더 */}
            <div className='p-[4vw] border-b border-basic-gray'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center space-x-[2vw]'>
                  <MapPin className='w-[1.25rem] h-[1.25rem] text-basic-blue' />
                  <span className='text-[1.125rem] font-bold text-white'>
                    활동장소 관리
                  </span>
                  <div className='ml-[1vw] px-[2vw] py-[0.5vh] bg-basic-gray rounded-full text-[0.75rem] font-medium text-gray-300'>
                    {locations.length}개
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptic.light();
                    setIsCreatingLocation(true);
                  }}
                  className='px-[3vw] py-[3vw] bg-basic-blue hover:bg-basic-blue/80 text-white rounded-[0.75rem] text-[0.875rem] font-medium transition-colors active:scale-95 disabled:opacity-50'
                  disabled={isCreatingLocation}
                >
                  <Plus className='w-[1rem] h-[1rem]' />
                </button>
              </div>
            </div>

            <div className='p-[4vw] space-y-[3vh]'>
              {/* 장소 추가 폼 */}
              {isCreatingLocation && (
                <div className='border border-basic-blue bg-basic-blue/20 rounded-[0.75rem] p-[4vw] space-y-[2vh]'>
                  <div>
                    <label className='block mb-[1vh] text-[0.875rem] font-medium text-white'>
                      장소명 *
                    </label>
                    <input
                      type='text'
                      placeholder='예: 한강공원 반포지구'
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateLocation();
                        }
                      }}
                      className='w-full px-[3vw] py-[2vh] border-0 bg-basic-black-gray text-white rounded-[0.75rem] text-[1rem] focus:ring-2 focus:ring-basic-blue focus:border-transparent placeholder:text-gray-400'
                      autoFocus
                    />
                  </div>
                  <div className='flex space-x-[2vw]'>
                    <button
                      onClick={handleCreateLocation}
                      disabled={loadingStates.create || !newLocationName.trim()}
                      className='px-[4vw] py-[2vh] bg-basic-blue hover:bg-basic-blue/80 text-white rounded-[0.75rem] text-[0.875rem] font-medium transition-colors active:scale-95 disabled:opacity-50'
                    >
                      {loadingStates.create ? (
                        <Loader2 className='w-[1rem] h-[1rem] mr-[1vw] animate-spin' />
                      ) : (
                        <Save className='w-[1rem] h-[1rem] mr-[1vw]' />
                      )}
                      추가
                    </button>
                    <button
                      onClick={() => {
                        haptic.light();
                        setIsCreatingLocation(false);
                        setNewLocationName("");
                      }}
                      disabled={loadingStates.create}
                      className='px-[4vw] py-[2vh] bg-basic-gray hover:bg-basic-gray/80 text-white rounded-[0.75rem] text-[0.875rem] font-medium transition-colors active:scale-95 disabled:opacity-50'
                    >
                      <X className='w-[1rem] h-[1rem] mr-[1vw]' />
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* 검색 */}
              <div className='relative'>
                <Search className='absolute left-[3vw] top-1/2 transform -translate-y-1/2 w-[1.25rem] h-[1.25rem] text-gray-400' />
                <input
                  type='text'
                  placeholder='장소명으로 검색'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full pl-[10vw] pr-[4vw] py-[3vh] bg-basic-black text-white border border-basic-gray rounded-[0.75rem] text-[1rem] placeholder-gray-400 focus:ring-2 focus:ring-basic-blue focus:border-transparent'
                />
              </div>

              {/* 장소 목록 */}
              <div className='space-y-[2vh]'>
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((location) => (
                    <div
                      key={location.id}
                      className='bg-basic-gray/20 rounded-[0.75rem] p-[4vw]'
                    >
                      {editingLocation === location.id ? (
                        <div className='space-y-[2vh]'>
                          <input
                            type='text'
                            value={editLocationName}
                            onChange={(e) =>
                              setEditLocationName(e.target.value)
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            className='w-full px-[3vw] py-[2vh] border-0 bg-basic-black-gray text-white rounded-[0.75rem] text-[1rem] focus:ring-2 focus:ring-basic-blue focus:border-transparent'
                            autoFocus
                          />
                          <div className='flex space-x-[2vw]'>
                            <button
                              onClick={handleSaveEdit}
                              disabled={loadingStates[`edit-${location.id}`]}
                              className='px-[3vw] py-[1.5vh] bg-basic-blue hover:bg-basic-blue/80 text-white rounded-[0.75rem] text-[0.875rem] font-medium transition-colors active:scale-95 disabled:opacity-50'
                            >
                              {loadingStates[`edit-${location.id}`] ? (
                                <Loader2 className='w-[1rem] h-[1rem] animate-spin' />
                              ) : (
                                <Save className='w-[1rem] h-[1rem]' />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={loadingStates[`edit-${location.id}`]}
                              className='px-[3vw] py-[1.5vh] bg-basic-gray hover:bg-basic-gray/80 text-white rounded-[0.75rem] text-[0.875rem] font-medium transition-colors active:scale-95 disabled:opacity-50'
                            >
                              <X className='w-[1rem] h-[1rem]' />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className='flex justify-between items-center'>
                          <span className='text-[1rem] font-medium text-white'>
                            {location.name}
                          </span>
                          <div className='flex space-x-[1vw]'>
                            <button
                              onClick={() => handleStartEdit(location)}
                              className='p-[2vw] text-basic-blue hover:bg-basic-blue/20 rounded-[0.5rem] transition-colors active:scale-95'
                            >
                              <Edit className='w-[1.25rem] h-[1.25rem]' />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteLocation(location.id, location.name)
                              }
                              disabled={loadingStates[`delete-${location.id}`]}
                              className='p-[2vw] text-red-400 hover:bg-red-500/20 rounded-[0.5rem] transition-colors active:scale-95 disabled:opacity-50'
                            >
                              {loadingStates[`delete-${location.id}`] ? (
                                <Loader2 className='w-[1.25rem] h-[1.25rem] animate-spin' />
                              ) : (
                                <Trash2 className='w-[1.25rem] h-[1.25rem]' />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className='py-[8vh] text-center'>
                    <MapPin className='w-[4rem] h-[4rem] text-gray-500 mx-auto mb-[2vh]' />
                    <p className='text-[1rem] font-medium text-gray-300 mb-[1vh]'>
                      {searchTerm
                        ? "검색 결과가 없습니다"
                        : "등록된 활동장소가 없습니다"}
                    </p>
                    <p className='text-[0.875rem] text-gray-400 mb-[3vh]'>
                      {searchTerm
                        ? "다른 검색어를 시도해보세요"
                        : "첫 번째 활동장소를 추가해보세요"}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => {
                          haptic.light();
                          setIsCreatingLocation(true);
                        }}
                        className='px-[4vw] py-[2vh] bg-basic-blue hover:bg-basic-blue/80 text-white rounded-[0.75rem] text-[0.875rem] font-medium transition-colors active:scale-95'
                      >
                        <Plus className='w-[1rem] h-[1rem] mr-[1vw]' />첫 번째
                        장소 추가하기
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 크루 관리 */}
        {activeTab === "members" && (
          <AdminCrewMembersManagement crewId={crewId} />
        )}

        {/* 초대코드 관리 */}
        {activeTab === "invites" && (
          <AdminInviteCodesManagement crewId={crewId} />
        )}
      </div>

      {/* 하단 네비게이션 */}
      <AdminBottomNavigation />

      {/* 팝업 알림 */}
      <PopupNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        duration={2000}
        onClose={closeNotification}
      />
    </div>
  );
}
