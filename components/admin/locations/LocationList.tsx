"use client";

import React, { memo, useCallback } from "react";
import { CrewLocation } from "@/lib/validators/crewLocationSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, CheckCircle, XCircle } from "lucide-react";

// 개별 LocationItem 컴포넌트 - 최적화를 위해 분리
interface LocationItemProps {
  location: CrewLocation;
  isSelected: boolean;
  onLocationSelect?: (location: CrewLocation) => void;
  onLocationEdit?: (location: CrewLocation) => void;
  onLocationToggle?: (location: CrewLocation) => void;
}

const LocationItem = memo(function LocationItem({
  location,
  onLocationSelect,
  onLocationEdit,
}: LocationItemProps) {
  const handleSelect = useCallback(() => {
    onLocationSelect?.(location);
  }, [onLocationSelect, location]);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onLocationEdit?.(location);
    },
    [onLocationEdit, location]
  );

  return (
    <Card
      className={`flex justify-between items-center border-rh-border transition-all cursor-pointer bg-rh-bg-surface hover:border-rh-accent/50`}
      onClick={handleSelect}
    >
      <CardContent>
        <div className='flex justify-between items-center'>
          <div className='flex flex-1 gap-3 items-center'>
            <div className='flex-1 min-w-0'>
              <div className='flex gap-2 items-center mb-1'>
                <h3 className='font-medium text-white truncate'>
                  {location.name}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <Button
        variant='ghost'
        size='sm'
        onClick={handleEdit}
        className='flex-shrink-0 text-rh-text-secondary hover:text-white hover:bg-rh-accent-hover/20'
      >
        <MoreVertical className='w-4 h-4' />
      </Button>
    </Card>
  );
});

interface LocationListProps {
  locations: CrewLocation[];
  selectedLocation?: CrewLocation | null;
  onLocationSelect?: (location: CrewLocation) => void;
  onLocationEdit?: (location: CrewLocation) => void;
  onLocationDelete?: (location: CrewLocation) => void;
  onLocationToggle?: (location: CrewLocation) => void;
  loading?: boolean;
}

function LocationList({
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
      <div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='border-rh-border bg-rh-bg-surface'>
            <CardContent className='p-1'>
              <div className='animate-pulse'>
                <div className='mb-2 w-3/4 h-4 bg-rh-bg-surface rounded'></div>
                <div className='mb-3 w-1/2 h-3 bg-rh-bg-surface rounded'></div>
                <div className='flex space-x-2'>
                  <div className='w-16 h-8 bg-rh-bg-surface rounded'></div>
                  <div className='w-16 h-8 bg-rh-bg-surface rounded'></div>
                  <div className='w-16 h-8 bg-rh-bg-surface rounded'></div>
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
      <Card className='border-rh-border bg-rh-bg-surface'>
        <CardContent className='p-8 text-center'>
          <h3 className='mb-2 text-lg font-medium text-white'>
            등록된 활동장소가 없습니다
          </h3>
          <p className='text-rh-text-secondary'>새 활동장소를 추가하여 시작해보세요</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-3'>
      {locations.map((location) => (
        <LocationItem
          key={`${location.id}-${location.updated_at}`}
          location={location}
          isSelected={selectedLocation?.id === location.id}
          onLocationSelect={onLocationSelect}
          onLocationEdit={onLocationEdit}
          onLocationToggle={onLocationToggle}
        />
      ))}
    </div>
  );
}

// React.memo로 최적화 - locations, selectedLocation, loading이 변경될 때만 리렌더링
export default memo(LocationList);
