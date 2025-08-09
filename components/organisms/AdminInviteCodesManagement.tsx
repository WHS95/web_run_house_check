"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Ticket, Calendar, Edit, Shuffle } from "lucide-react";
import { haptic } from "@/lib/haptic";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";
import ConfirmModal from "@/components/molecules/ConfirmModal";

interface InviteCode {
  id: number;
  crew_id: string;
  invite_code: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminInviteCodesManagementProps {
  crewId: string;
}

export default function AdminInviteCodesManagement({
  crewId,
}: AdminInviteCodesManagementProps) {
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    inviteCode: "",
    description: "",
  });

  // 알림 상태
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as NotificationType,
  });

  // 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    onConfirm: () => {},
  });

  // 알림 표시 함수
  const showNotification = useCallback(
    (message: string, type: NotificationType) => {
      setNotification({
        isVisible: true,
        message,
        type,
      });
    },
    []
  );

  // 알림 닫기
  const closeNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // 확인 모달 표시
  const showConfirmModal = useCallback((onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      onConfirm,
    });
  }, []);

  // 확인 모달 닫기
  const closeConfirmModal = useCallback(() => {
    setConfirmModal({
      isOpen: false,
      onConfirm: () => {},
    });
  }, []);

  // 초대코드 조회
  const fetchInviteCode = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/invite-codes?crewId=${crewId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setInviteCode(result.data);
      } else {
        console.error("초대코드 조회 오류:", result.error);
        haptic.error();
        showNotification("초대코드 조회에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("초대코드 조회 실패:", error);
      haptic.error();
      showNotification("초대코드 조회 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [crewId, showNotification]);

  // 초대코드 생성 또는 재생성
  const handleCreateInviteCode = useCallback(async () => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      haptic.medium();

      const requestData: any = { crewId };
      if (editData.inviteCode.trim()) {
        requestData.inviteCode = editData.inviteCode.trim();
      }
      if (editData.description) {
        requestData.description = editData.description;
      }

      const response = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        haptic.success();
        setIsEditing(false);
        setEditData({ inviteCode: "", description: "" });
        await fetchInviteCode();
        showNotification(
          result.message || "초대코드가 성공적으로 생성되었습니다.",
          "success"
        );
      } else {
        haptic.error();
        showNotification(
          result.error || "초대코드 생성에 실패했습니다.",
          "error"
        );
      }
    } catch (error) {
      console.error("초대코드 생성 실패:", error);
      haptic.error();
      showNotification("초대코드 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [crewId, editData, fetchInviteCode, actionLoading, showNotification]);

  // 초대코드 재생성
  const handleRegenerateInviteCode = useCallback(() => {
    if (actionLoading || !inviteCode) return;

    showConfirmModal(async () => {
      try {
        setActionLoading(true);
        haptic.medium();

        const response = await fetch(
          `/api/admin/invite-codes?codeId=${inviteCode.id}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          haptic.success();
          // 즉시 새 코드 생성
          await handleCreateInviteCode();
        } else {
          haptic.error();
          showNotification(
            result.error || "초대코드 재생성에 실패했습니다.",
            "error"
          );
        }
      } catch (error) {
        console.error("초대코드 재생성 실패:", error);
        haptic.error();
        showNotification("초대코드 재생성 중 오류가 발생했습니다.", "error");
      } finally {
        setActionLoading(false);
      }
    });
  }, [
    inviteCode,
    actionLoading,
    handleCreateInviteCode,
    showNotification,
    showConfirmModal,
  ]);

  // 초대코드 복사
  const handleCopyCode = useCallback(
    async (code: string) => {
      try {
        await navigator.clipboard.writeText(code);
        haptic.success();
        showNotification("초대코드가 클립보드에 복사되었습니다.", "success");
      } catch (error) {
        console.error("복사 실패:", error);
        haptic.error();
        showNotification("복사에 실패했습니다.", "error");
      }
    },
    [showNotification]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  // 랜덤 코드 생성
  const generateRandomCode = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // 편집 모드 시작
  const handleStartEdit = () => {
    if (!inviteCode) return;
    setEditData({
      inviteCode: inviteCode.invite_code || "",
      description: inviteCode.description || "",
    });
    setIsEditing(true);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({ inviteCode: "", description: "" });
  };

  // 랜덤 코드 생성 버튼 핸들러
  const handleGenerateRandomCode = () => {
    const randomCode = generateRandomCode();
    setEditData({ ...editData, inviteCode: randomCode });
    haptic.light();
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchInviteCode();
  }, [fetchInviteCode]);

  if (isLoading) {
    return (
      <div className='bg-white rounded-[0.75rem] shadow-sm border border-gray-100 overflow-hidden'>
        <div className='p-[4vw] space-y-[3vh] animate-pulse'>
          <div className='bg-gray-50 rounded-[0.75rem] p-[4vw]'>
            <div className='flex items-center space-x-[3vw]'>
              <div className='w-[3rem] h-[3rem] bg-gray-200 rounded-full'></div>
              <div className='flex-1 space-y-[1vh]'>
                <div className='h-[1rem] bg-gray-200 rounded w-[30vw]'></div>
                <div className='h-[0.875rem] bg-gray-200 rounded w-[50vw]'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-[0.75rem] shadow-sm border border-gray-100 overflow-hidden'>
      {/* 헤더 */}
      <div className='p-[4vw] border-b border-gray-100'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center space-x-[2vw]'>
            <Ticket className='w-[1.25rem] h-[1.25rem] text-purple-600' />
            <span className='text-[1.125rem] font-bold text-gray-900'>
              초대코드 관리
            </span>
            <div className='ml-[1vw] px-[2vw] py-[0.5vh] bg-gray-100 rounded-full text-[0.75rem] font-medium text-gray-600'>
              {inviteCode ? "1개" : "0개"}
            </div>
          </div>
          {!inviteCode && (
            <button
              onClick={() => {
                haptic.light();
                setIsEditing(true);
              }}
              className='px-[3vw] py-[3vw] bg-purple-600 hover:bg-purple-700 text-white rounded-[0.75rem] text-[0.875rem] font-medium transition-colors active:scale-95 disabled:opacity-50'
              disabled={isEditing}
            >
              <Plus className='w-[1rem] h-[1rem]' />
            </button>
          )}
        </div>
      </div>

      <div className='p-[4vw] space-y-[3vh]'>
        {/* 초대코드 생성/수정 폼 */}
        {isEditing && (
          <div className='border border-purple-200 bg-purple-50 rounded-[0.75rem] p-[4vw] space-y-[2vh]'>
            <div>
              <label className='block mb-[1vh] text-[0.875rem] font-medium text-gray-700'>
                초대코드 *
              </label>
              <div className='flex space-x-2'>
                <Input
                  type='text'
                  placeholder='예: CREW123 (7자리 영문+숫자)'
                  value={editData.inviteCode}
                  onChange={(e) => {
                    const value = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "");
                    if (value.length <= 7) {
                      setEditData({ ...editData, inviteCode: value });
                    }
                  }}
                  className='font-mono bg-white'
                  maxLength={7}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleGenerateRandomCode}
                  disabled={actionLoading}
                  className='px-3'
                >
                  <Shuffle className='w-4 h-4' />
                </Button>
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                영문 대문자와 숫자만 사용 가능 (정확히 7자리)
              </p>
            </div>
            <div className='flex space-x-[2vw]'>
              <Button
                onClick={handleCreateInviteCode}
                disabled={
                  actionLoading ||
                  !editData.inviteCode.trim() ||
                  editData.inviteCode.length !== 7
                }
                className='bg-purple-600 hover:bg-purple-700'
              >
                {actionLoading ? "처리 중..." : inviteCode ? "수정" : "생성"}
              </Button>
              <Button
                variant='outline'
                onClick={handleCancelEdit}
                disabled={actionLoading}
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 현재 초대코드 표시 */}
        {inviteCode && !isEditing && (
          <Card className='border-gray-200'>
            <CardContent className='px-4 py-4'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <div className='flex items-center mb-3 space-x-3'>
                    <code className='px-3 py-2 font-mono text-xl font-bold text-purple-600 bg-purple-50 rounded-lg'>
                      {inviteCode.invite_code}
                    </code>
                  </div>

                  {inviteCode.description && (
                    <p className='mb-3 text-sm text-gray-600'>
                      {inviteCode.description}
                    </p>
                  )}

                  <div className='grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2'>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='w-4 h-4' />
                      <span>생성: {formatDate(inviteCode.created_at)}</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='w-4 h-4' />
                      <span>수정: {formatDate(inviteCode.updated_at)}</span>
                    </div>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleCopyCode(inviteCode.invite_code)}
                    className='p-2'
                  >
                    <Copy className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleStartEdit}
                    className='p-2 text-blue-600 hover:text-blue-700'
                  >
                    <Edit className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleRegenerateInviteCode}
                    disabled={actionLoading}
                    className='p-2 text-orange-600 hover:text-orange-700'
                  >
                    <Shuffle className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 초대코드가 없을 때 */}
        {!inviteCode && !isEditing && (
          <div className='py-8 text-center'>
            <Ticket className='mx-auto mb-4 w-16 h-16 text-gray-300' />
            <p className='mb-2 text-lg font-medium text-gray-500'>
              등록된 초대코드가 없습니다
            </p>
            <p className='mb-4 text-gray-400'>
              크루 초대를 위한 코드를 생성해보세요
            </p>
            <Button
              onClick={() => {
                haptic.light();
                setIsEditing(true);
              }}
              className='bg-purple-600 hover:bg-purple-700'
            >
              <Plus className='mr-2 w-4 h-4' />첫 번째 초대코드 생성하기
            </Button>
          </div>
        )}
      </div>

      {/* 알림 팝업 */}
      <PopupNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        duration={2000}
        onClose={closeNotification}
      />

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title='초대코드 재생성'
        content='기존 초대코드가 무효화되고 새로운 코드가 생성됩니다. 계속하시겠습니까?'
        confirmText='재생성'
        cancelText='취소'
        variant='destructive'
      />
    </div>
  );
}
