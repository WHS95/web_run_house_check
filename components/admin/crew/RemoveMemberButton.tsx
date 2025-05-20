"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { removeUserFromCrew } from "@/lib/supabase/admin";

interface RemoveMemberButtonProps {
  memberId: string;
  memberName: string;
  userCrewId: string;
}

export default function RemoveMemberButton({
  memberId,
  memberName,
  userCrewId,
}: RemoveMemberButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRemove = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { success, error } = await removeUserFromCrew(userCrewId);

      if (!success) {
        throw error || new Error("회원 제거 중 오류가 발생했습니다.");
      }

      // 성공 시 모달 닫고 페이지 새로고침
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "회원 제거 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className='p-2 text-red-600 rounded hover:text-red-900 bg-red-50'
        title='회원 제거'
      >
        <Trash2 size={16} />
      </button>

      {/* 확인 모달 */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen p-4'>
            <div
              className='fixed inset-0 bg-black bg-opacity-30'
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className='relative w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-xl'>
              <h3 className='mb-2 text-lg font-medium text-gray-900'>
                회원 제거 확인
              </h3>

              <p className='mb-4 text-sm text-gray-500'>
                <span className='font-medium'>{memberName}</span> 회원을 이
                크루에서 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>

              {error && (
                <div className='p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md'>
                  {error}
                </div>
              )}

              <div className='flex justify-end mt-5 space-x-3'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  disabled={isLoading}
                >
                  취소
                </button>
                <button
                  type='button'
                  onClick={handleRemove}
                  className='px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  disabled={isLoading}
                >
                  {isLoading ? "제거 중..." : "제거"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
