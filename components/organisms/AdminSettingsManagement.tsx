"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  MapPin,
  Plus,
  Edit,
  Save,
  X,
  Search,
  ArrowUpDown,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";

// 임시 데이터 (간소화)
const mockLocations = [
  {
    id: "1",
    name: "한강공원 반포지구",
  },
  {
    id: "2",
    name: "올림픽공원",
  },
  {
    id: "3",
    name: "여의도공원",
  },
  {
    id: "4",
    name: "선유도공원",
  },
  {
    id: "5",
    name: "남산공원",
  },
];

export default function AdminSettingsManagement() {
  const [locations, setLocations] = useState(mockLocations);
  const [searchTerm, setSearchTerm] = useState("");

  // 활동장소 관련 상태
  const [newLocationName, setNewLocationName] = useState("");
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editLocationName, setEditLocationName] = useState("");

  // 검색된 장소 목록
  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 활동장소 추가
  const handleCreateLocation = () => {
    if (!newLocationName.trim()) return;

    const newLocation = {
      id: Date.now().toString(),
      name: newLocationName.trim(),
      isDefault: false,
    };

    setLocations([...locations, newLocation]);
    setNewLocationName("");
    setIsCreatingLocation(false);
  };

  // 장소 수정 시작
  const handleStartEdit = (location: { id: string; name: string }) => {
    setEditingLocation(location.id);
    setEditLocationName(location.name);
  };

  // 장소 수정 저장
  const handleSaveEdit = () => {
    if (!editLocationName.trim()) return;

    setLocations(
      locations.map((location) =>
        location.id === editingLocation
          ? { ...location, name: editLocationName.trim() }
          : location
      )
    );
    setEditingLocation(null);
    setEditLocationName("");
  };

  // 장소 수정 취소
  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditLocationName("");
  };

  // 장소 삭제
  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter((location) => location.id !== id));
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 헤더 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-4'>
          <div className='flex items-center space-x-3'>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>크루 설정</h1>
              <p className='text-sm text-gray-500'>
                크루 운영을 위한 기본 설정
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className='flex-1 px-4 py-4 pb-24 space-y-6 overflow-y-auto'>
        {/* 활동장소 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <MapPin className='w-5 h-5 text-green-600' />
                <span>활동장소 관리</span>
              </div>
              <Button
                onClick={() => setIsCreatingLocation(true)}
                size='sm'
                className='bg-green-600 hover:bg-green-700'
              >
                <Plus className='w-4 h-4 mr-1' />
                장소 추가
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* 장소 추가 폼 */}
            {isCreatingLocation && (
              <Card className='border-green-200 bg-green-50'>
                <CardContent className='p-4 space-y-3'>
                  <div>
                    <label
                      htmlFor='locationName'
                      className='block mb-1 text-sm font-medium text-gray-700'
                    >
                      장소명
                    </label>
                    <Input
                      id='locationName'
                      placeholder='예: 한강공원 반포지구'
                      value={newLocationName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewLocationName(e.target.value)
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleCreateLocation();
                        }
                      }}
                    />
                  </div>
                  <div className='flex space-x-2'>
                    <Button onClick={handleCreateLocation} size='sm'>
                      <Save className='w-4 h-4 mr-1' />
                      추가
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setIsCreatingLocation(false);
                        setNewLocationName("");
                      }}
                      size='sm'
                    >
                      <X className='w-4 h-4 mr-1' />
                      취소
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 검색 */}
            <div className='relative'>
              <Search className='absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2' />
              <Input
                placeholder='장소명으로 검색'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-white border-gray-200'
              />
            </div>

            {/* 테이블 */}
            <div className='overflow-hidden bg-white border border-gray-200 rounded-lg'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
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
                            <div className='flex items-center space-x-2'>
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
                              <Button
                                size='sm'
                                onClick={handleSaveEdit}
                                className='px-2'
                              >
                                <Save className='w-3 h-3' />
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={handleCancelEdit}
                                className='px-2'
                              >
                                <X className='w-3 h-3' />
                              </Button>
                            </div>
                          ) : (
                            <div className='flex items-center justify-between'>
                              <span className='font-medium text-gray-900'>
                                {location.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className='px-4 py-3'>
                          {editingLocation === location.id ? null : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='w-8 h-8'
                                >
                                  <MoreVertical className='w-4 h-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuItem
                                  onClick={() => handleStartEdit(location)}
                                >
                                  <Edit className='w-4 h-4 mr-2' />
                                  수정
                                </DropdownMenuItem>
                                {
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteLocation(location.id)
                                    }
                                    className='text-red-600'
                                  >
                                    <Trash2 className='w-4 h-4 mr-2' />
                                    삭제
                                  </DropdownMenuItem>
                                }
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                  <p className='text-gray-500'>검색 결과가 없습니다.</p>
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
