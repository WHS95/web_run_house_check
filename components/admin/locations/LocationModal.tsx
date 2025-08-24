"use client";

import React, { useState } from "react";
import { CrewLocation, CrewLocationForm } from "@/lib/types/crew-locations";
import LocationForm from "./LocationForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "delete";
  location?: CrewLocation | null;
  onSubmit?: (data: CrewLocationForm) => Promise<void>;
  onDelete?: (location: CrewLocation) => Promise<void>;
  loading?: boolean;
}

export default function LocationModal({
  isOpen,
  onClose,
  mode,
  location,
  onSubmit,
  onDelete,
  loading = false,
}: LocationModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 삭제 확인 처리
  const handleDeleteConfirm = async () => {
    if (!location || !onDelete) return;
    
    try {
      await onDelete(location);
      setDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      console.error("활동장소 삭제 오류:", error);
    }
  };

  // 폼 제출 처리
  const handleFormSubmit = async (data: CrewLocationForm) => {
    if (!onSubmit) return;
    
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("활동장소 저장 오류:", error);
    }
  };

  // 삭제 모달인 경우
  if (mode === "delete") {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="bg-basic-black-gray border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              활동장소 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {location && (
                <>
                  <strong className="text-white">&quot;{location.name}&quot;</strong>
                  활동장소를 삭제하시겠습니까?
                  <br />
                  <br />
                  이 작업은 되돌릴 수 없으며, 해당 위치와 관련된 모든 데이터가 삭제됩니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-gray-600 text-white hover:bg-gray-600/20"
              disabled={loading}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  삭제 중...
                </div>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // 추가/수정 모달
  const getTitle = () => {
    switch (mode) {
      case "add":
        return "새 활동장소 추가";
      case "edit":
        return "활동장소 수정";
      default:
        return "활동장소 관리";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "add":
        return "새로운 크루 활동장소를 등록하세요. 주소 검색 또는 지도 클릭으로 정확한 위치를 선택할 수 있습니다.";
      case "edit":
        return "활동장소 정보를 수정하세요. 위치나 이름, 설명을 변경할 수 있습니다.";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-basic-black-gray border-gray-600">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-basic-blue" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-120px)] overflow-auto">
          <LocationForm
            initialData={location}
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            loading={loading}
            title=""
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}