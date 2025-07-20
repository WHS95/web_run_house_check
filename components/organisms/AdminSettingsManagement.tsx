"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plus,
  Edit,
  Save,
  X,
  Search,
  MoreVertical,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";
import {
  CrewLocation,
  createCrewLocation,
  updateCrewLocation,
  deleteCrewLocation,
} from "@/lib/supabase/admin";
import { useRouter } from "next/navigation";

interface AdminSettingsManagementProps {
  initialLocations: CrewLocation[];
  crewId: string;
}

export default function AdminSettingsManagement({
  initialLocations,
  crewId,
}: AdminSettingsManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [locations, setLocations] = useState<CrewLocation[]>(initialLocations);
  const [searchTerm, setSearchTerm] = useState("");

  // 활동장소 관련 상태
  const [newLocationName, setNewLocationName] = useState("");
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<number | null>(null);
  const [editLocationName, setEditLocationName] = useState("");

  // 로딩 상태
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  // 검색된 장소 목록
  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 로딩 상태 설정 헬퍼
  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };

  // 활동장소 추가
  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) return;

    setLoading("create", true);

    try {
      const { data, error } = await createCrewLocation(crewId, {
        name: newLocationName.trim(),
      });

      if (error) {
        console.error("장소 추가 오류:", error);
        alert("장소 추가 중 오류가 발생했습니다.");
        return;
      }

      if (data) {
        setLocations((prev) => [...prev, data]);
        setNewLocationName("");
        setIsCreatingLocation(false);

        // 페이지 새로고침으로 최신 데이터 반영
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("장소 추가 오류:", error);
      alert("장소 추가 중 오류가 발생했습니다.");
    } finally {
      setLoading("create", false);
    }
  };

  // 장소 수정 시작
  const handleStartEdit = (location: CrewLocation) => {
    setEditingLocation(location.id);
    setEditLocationName(location.name);
  };

  // 장소 수정 저장
  const handleSaveEdit = async () => {
    if (!editLocationName.trim() || editingLocation === null) return;

    setLoading(`edit-${editingLocation}`, true);

    try {
      const { data, error } = await updateCrewLocation(editingLocation, {
        name: editLocationName.trim(),
      });

      if (error) {
        console.error("장소 수정 오류:", error);
        alert("장소 수정 중 오류가 발생했습니다.");
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

        // 페이지 새로고침으로 최신 데이터 반영
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("장소 수정 오류:", error);
      alert("장소 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(`edit-${editingLocation}`, false);
    }
  };

  // 장소 수정 취소
  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditLocationName("");
  };

  // 장소 삭제
  const handleDeleteLocation = async (locationId: number) => {
    if (!confirm("정말로 이 장소를 삭제하시겠습니까?")) return;

    setLoading(`delete-${locationId}`, true);

    try {
      const { success, error } = await deleteCrewLocation(locationId);

      if (error) {
        console.error("장소 삭제 오류:", error);
        alert("장소 삭제 중 오류가 발생했습니다.");
        return;
      }

      if (success) {
        setLocations((prev) =>
          prev.filter((location) => location.id !== locationId)
        );

        // 페이지 새로고침으로 최신 데이터 반영
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("장소 삭제 오류:", error);
      alert("장소 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(`delete-${locationId}`, false);
    }
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 메인 컨텐츠 */}
      <div className='overflow-y-auto flex-1 px-4 py-6 pb-24 space-y-6'>
        {/* 활동장소 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <MapPin className='w-5 h-5 text-green-600' />
                <span>활동장소 관리</span>
                <Badge variant='secondary' className='ml-2'>
                  {locations.length}개
                </Badge>
              </div>
              <Button
                onClick={() => setIsCreatingLocation(true)}
                size='sm'
                className='bg-green-600 hover:bg-green-700'
                disabled={isCreatingLocation}
              >
                <Plus className='mr-1 w-4 h-4' />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* 장소 추가 폼 */}
            {isCreatingLocation && (
              <Card className='bg-green-50 border-green-200'>
                <CardContent className='p-4 space-y-3'>
                  <div>
                    <label
                      htmlFor='locationName'
                      className='block mb-1 text-sm font-medium text-gray-700'
                    >
                      장소명 *
                    </label>
                    <Input
                      id='locationName'
                      placeholder='예: 한강공원 반포지구'
                      value={newLocationName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewLocationName(e.target.value)
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateLocation();
                        }
                      }}
                    />
                  </div>
                  <div className='flex space-x-2'>
                    <Button
                      onClick={handleCreateLocation}
                      size='sm'
                      disabled={loadingStates.create || !newLocationName.trim()}
                    >
                      {loadingStates.create ? (
                        <Loader2 className='mr-1 w-4 h-4 animate-spin' />
                      ) : (
                        <Save className='mr-1 w-4 h-4' />
                      )}
                      추가
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setIsCreatingLocation(false);
                        setNewLocationName("");
                      }}
                      size='sm'
                      disabled={loadingStates.create}
                    >
                      <X className='mr-1 w-4 h-4' />
                      취소
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 검색 */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
              <Input
                placeholder='장소명으로 검색'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-white border-gray-200'
              />
            </div>

            {/* 테이블 */}
            <div className='overflow-hidden bg-white rounded-lg border border-gray-200'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 border-b border-gray-200'>
                    <tr>
                      <th className='px-4 py-3 text-sm font-medium text-left text-gray-700'>
                        장소명
                      </th>
                      <th className='px-4 py-3 text-sm font-medium text-center text-gray-700'>
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {filteredLocations.map((location) => (
                      <tr key={location.id} className='hover:bg-gray-50'>
                        <td className='px-4 py-3'>
                          {editingLocation === location.id ? (
                            <Input
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
                              className='text-sm'
                              autoFocus
                            />
                          ) : (
                            <span className='font-medium text-gray-900'>
                              {location.name}
                            </span>
                          )}
                        </td>
                        <td className='px-4 py-3'>
                          {editingLocation === location.id ? (
                            <div className='flex justify-center items-center space-x-1'>
                              <Button
                                size='sm'
                                onClick={handleSaveEdit}
                                className='px-2'
                                disabled={loadingStates[`edit-${location.id}`]}
                              >
                                {loadingStates[`edit-${location.id}`] ? (
                                  <Loader2 className='w-3 h-3 animate-spin' />
                                ) : (
                                  <Save className='w-3 h-3' />
                                )}
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={handleCancelEdit}
                                className='px-2'
                                disabled={loadingStates[`edit-${location.id}`]}
                              >
                                <X className='w-3 h-3' />
                              </Button>
                            </div>
                          ) : (
                            <div className='flex justify-center'>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='w-8 h-8'
                                    disabled={
                                      loadingStates[`delete-${location.id}`]
                                    }
                                  >
                                    {loadingStates[`delete-${location.id}`] ? (
                                      <Loader2 className='w-4 h-4 animate-spin' />
                                    ) : (
                                      <MoreVertical className='w-4 h-4' />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    onClick={() => handleStartEdit(location)}
                                  >
                                    <Edit className='mr-2 w-4 h-4' />
                                    수정
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteLocation(location.id)
                                    }
                                    className='text-red-600'
                                  >
                                    <Trash2 className='mr-2 w-4 h-4' />
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 검색 결과 없음 */}
              {filteredLocations.length === 0 && (
                <div className='py-8 text-center'>
                  <p className='text-gray-500'>
                    {searchTerm
                      ? "검색 결과가 없습니다."
                      : "등록된 활동장소가 없습니다."}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setIsCreatingLocation(true)}
                      size='sm'
                      className='mt-2 bg-green-600 hover:bg-green-700'
                    >
                      <Plus className='mr-1 w-4 h-4' />첫 번째 장소 추가하기
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 하단 네비게이션 */}
      <AdminBottomNavigation />
    </div>
  );
}
