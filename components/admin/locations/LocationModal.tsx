"use client";

import React, { useState, memo } from "react";
import { CrewLocation, CrewLocationForm } from "@/lib/validators/crewLocationSchema";
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
import { MapPin, AlertTriangle } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "delete";
  location?: CrewLocation | null;
  onSubmit?: (data: CrewLocationForm) => Promise<void>;
  onDelete?: (location: CrewLocation) => Promise<void>;
  onToggleStatus?: (location: CrewLocation) => Promise<void>;
  loading?: boolean;
}

function LocationModal({
  isOpen,
  onClose,
  mode,
  location,
  onSubmit,
  onDelete,
  onToggleStatus,
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
        <AlertDialogContent className='border-gray-600 bg-basic-black-gray'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex gap-2 items-center text-white'>
              <AlertTriangle className='w-5 h-5 text-red-400' />
              활동장소 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-300'>
              {location && (
                <>
                  <strong className='text-white'>
                    &quot;{location.name}&quot;
                  </strong>
                  활동장소를 삭제하시겠습니까?
                  <br />
                  <br />이 작업은 되돌릴 수 없으며, 해당 위치와 관련된 모든
                  데이터가 삭제됩니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className='text-white border-gray-600 hover:bg-gray-600/20'
              disabled={loading}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={loading}
              className='text-white bg-red-600 hover:bg-red-700'
            >
              {loading ? (
                <div className='flex gap-2 items-center'>
                  <div className='w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent'></div>
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-auto bg-basic-black-gray border-gray-600'>
        <div className='max-h-[calc(90vh-120px)] overflow-auto'>
          <LocationForm
            initialData={location}
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            loading={loading}
            title=''
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// React.memo로 최적화 - isOpen, mode, location, loading이 변경될 때만 리렌더링
export default memo(LocationModal);
