"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCrewInviteCode } from "@/lib/supabase/admin";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface InviteCodeCreateButtonProps {
  crewId: string;
  crewName: string;
}

export default function InviteCodeCreateButton({
  crewId,
  crewName,
}: InviteCodeCreateButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // 현재 로그인한 사용자 정보 가져오기
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("사용자 인증 정보를 가져올 수 없습니다.");
      }

      // 옵션 객체 생성
      const options: {
        description?: string;
        maxUses?: number;
        expiresAt?: Date;
      } = {};

      if (description) options.description = description;
      if (maxUses && !isNaN(parseInt(maxUses)))
        options.maxUses = parseInt(maxUses);
      if (expiresAt) options.expiresAt = new Date(expiresAt);

      const { data, error: createError } = await createCrewInviteCode(
        crewId,
        user.id,
        options
      );

      if (createError) {
        throw createError;
      }

      // 생성된 코드 표시
      setGeneratedCode(data?.invite_code || null);

      // 페이지 새로고침
      router.refresh();
    } catch (err: any) {
      setError(err.message || "초대 코드 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setDescription("");
    setMaxUses("");
    setExpiresAt("");
    setError(null);
    setGeneratedCode(null);
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
      >
        <Plus size={18} className='mr-2' />
        초대 코드 생성
      </button>

      {/* 모달 */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen p-4'>
            <div
              className='fixed inset-0 bg-basic-black bg-opacity-30'
              onClick={handleClose}
            ></div>

            <div className='relative w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-xl'>
              <h3 className='mb-2 text-lg font-medium text-gray-900'>
                {crewName} 크루 초대 코드 생성
              </h3>
              <p className='mb-4 text-sm text-gray-500'>
                새로운 크루 초대 코드를 생성합니다.
              </p>

              {generatedCode ? (
                <div className='mb-6'>
                  <div className='p-4 mb-4 rounded-md bg-green-50'>
                    <p className='mb-2 font-medium text-green-700'>
                      초대 코드가 생성되었습니다!
                    </p>
                    <div className='flex items-center justify-between p-4 bg-white border border-green-300 rounded-md'>
                      <code className='font-mono text-lg font-bold text-green-700'>
                        {generatedCode}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                        }}
                        className='text-sm text-green-600 hover:text-green-800'
                      >
                        복사
                      </button>
                    </div>
                  </div>

                  <div className='flex justify-end'>
                    <button
                      type='button'
                      onClick={handleClose}
                      className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                      확인
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className='mb-4'>
                    <label
                      htmlFor='description'
                      className='block mb-1 text-sm font-medium text-gray-700'
                    >
                      설명 (선택)
                    </label>
                    <input
                      type='text'
                      id='description'
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      placeholder='초대 코드 용도 설명'
                    />
                  </div>

                  <div className='mb-4'>
                    <label
                      htmlFor='maxUses'
                      className='block mb-1 text-sm font-medium text-gray-700'
                    >
                      최대 사용 횟수 (선택)
                    </label>
                    <input
                      type='number'
                      id='maxUses'
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      min='1'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      placeholder='무제한인 경우 비워두세요'
                    />
                  </div>

                  <div className='mb-4'>
                    <label
                      htmlFor='expiresAt'
                      className='block mb-1 text-sm font-medium text-gray-700'
                    >
                      만료일 (선택)
                    </label>
                    <input
                      type='date'
                      id='expiresAt'
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={getTomorrowDate()}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                      비워두면 만료되지 않습니다.
                    </p>
                  </div>

                  {error && (
                    <div className='p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md'>
                      {error}
                    </div>
                  )}

                  <div className='flex justify-end mt-5 space-x-3'>
                    <button
                      type='button'
                      onClick={handleClose}
                      className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      disabled={isLoading}
                    >
                      취소
                    </button>
                    <button
                      type='submit'
                      className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      disabled={isLoading}
                    >
                      {isLoading ? "생성 중..." : "생성"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
