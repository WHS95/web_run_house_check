"use client";

import React from "react";
import { CrewLocation } from "@/lib/types/crew-locations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Edit, Trash2, Eye, EyeOff } from "lucide-react";

interface LocationListProps {
  locations: CrewLocation[];
  selectedLocation?: CrewLocation | null;
  onLocationSelect?: (location: CrewLocation) => void;
  onLocationEdit?: (location: CrewLocation) => void;
  onLocationDelete?: (location: CrewLocation) => void;
  onLocationToggle?: (location: CrewLocation) => void;
  loading?: boolean;
}

export default function LocationList({
  locations,
  selectedLocation,
  onLocationSelect,
  onLocationEdit,
  onLocationDelete,
  onLocationToggle,
  loading = false,
}: LocationListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-basic-black-gray border-gray-600">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-600 rounded w-16"></div>
                  <div className="h-8 bg-gray-600 rounded w-16"></div>
                  <div className="h-8 bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <Card className="bg-basic-black-gray border-gray-600">
        <CardContent className="p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            등록된 활동장소가 없습니다
          </h3>
          <p className="text-gray-400">
            새 활동장소를 추가하여 시작해보세요
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {locations.map((location) => {
        const isSelected = selectedLocation?.id === location.id;
        
        return (
          <Card
            key={location.id}
            className={`bg-basic-black-gray border-gray-600 transition-all cursor-pointer hover:border-basic-blue/50 ${
              isSelected ? "border-basic-blue ring-1 ring-basic-blue/30" : ""
            }`}
            onClick={() => onLocationSelect?.(location)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white text-base mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-basic-blue" />
                    {location.name}
                    <Badge
                      variant={location.is_active ? "default" : "secondary"}
                      className={
                        location.is_active
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-gray-200"
                      }
                    >
                      {location.is_active ? "활성" : "비활성"}
                    </Badge>
                  </CardTitle>
                  {location.description && (
                    <p className="text-sm text-gray-400 mb-2">
                      {location.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    좌표: {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocationEdit?.(location);
                  }}
                  className="border-gray-600 hover:border-basic-blue text-white hover:bg-basic-blue/10"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  수정
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocationToggle?.(location);
                  }}
                  className={`border-gray-600 text-white hover:bg-opacity-10 ${
                    location.is_active
                      ? "hover:border-yellow-500 hover:bg-yellow-500"
                      : "hover:border-green-500 hover:bg-green-500"
                  }`}
                >
                  {location.is_active ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      비활성화
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      활성화
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocationDelete?.(location);
                  }}
                  className="border-gray-600 hover:border-red-500 text-white hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  삭제
                </Button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                등록일: {new Date(location.created_at).toLocaleDateString("ko-KR")}
                {location.updated_at !== location.created_at && (
                  <span className="ml-2">
                    수정일: {new Date(location.updated_at).toLocaleDateString("ko-KR")}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}