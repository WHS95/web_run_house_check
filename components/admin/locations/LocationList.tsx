"use client";

import React from "react";
import { CrewLocation } from "@/lib/types/crew-locations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Edit, CheckCircle, XCircle } from "lucide-react";

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
      <div className='space-y-3'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='border-gray-600 bg-basic-black-gray'>
            <CardContent className='p-4'>
              <div className='animate-pulse'>
                <div className='mb-2 w-3/4 h-4 bg-gray-600 rounded'></div>
                <div className='mb-3 w-1/2 h-3 bg-gray-700 rounded'></div>
                <div className='flex space-x-2'>
                  <div className='w-16 h-8 bg-gray-600 rounded'></div>
                  <div className='w-16 h-8 bg-gray-600 rounded'></div>
                  <div className='w-16 h-8 bg-gray-600 rounded'></div>
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
      <Card className='border-gray-600 bg-basic-black-gray'>
        <CardContent className='p-8 text-center'>
          <h3 className='mb-2 text-lg font-medium text-white'>
            등록된 활동장소가 없습니다
          </h3>
          <p className='text-gray-400'>새 활동장소를 추가하여 시작해보세요</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-3'>
      {locations.map((location) => {
        const isSelected = selectedLocation?.id === location.id;

        return (
          <Card
            key={location.id}
            className={`bg-basic-black-gray border-gray-600 transition-all cursor-pointer hover:border-basic-blue/50 ${
              isSelected ? "ring-1 border-basic-blue ring-basic-blue/30" : ""
            }`}
            onClick={() => onLocationSelect?.(location)}
          >
            <CardContent className='p-4'>
              <div className='flex justify-between items-center'>
                <div className='flex flex-1 gap-3 items-center'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex gap-2 items-center mb-1'>
                      <h3 className='font-medium text-white truncate'>
                        {location.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocationToggle?.(location);
                        }}
                        className='flex-shrink-0 transition-colors hover:scale-110'
                        title={
                          location.is_active
                            ? "활성 상태 (클릭하여 비활성화)"
                            : "비활성 상태 (클릭하여 활성화)"
                        }
                      >
                        {location.is_active ? (
                          <CheckCircle className='w-4 h-4 text-green-500 hover:text-green-400' />
                        ) : (
                          <XCircle className='w-4 h-4 text-gray-500 hover:text-green-500' />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocationEdit?.(location);
                  }}
                  className='flex-shrink-0 text-gray-400 hover:text-white hover:bg-basic-blue/20'
                >
                  <Edit className='w-4 h-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
