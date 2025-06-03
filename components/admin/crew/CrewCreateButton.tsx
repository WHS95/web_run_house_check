"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCrew } from "@/lib/supabase/admin";
import { Plus } from "lucide-react";

export default function CrewCreateButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("크루 이름을 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await createCrew(name, description);

      if (error) {
        throw error;
      }

      // 성공 시 모달 닫고 페이지 새로고침
      setIsModalOpen(false);
      router.refresh();

      // 성공 후 입력 필드 초기화
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "크루 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className='inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
      >
        <Plus size={18} className='mr-2' />
        크루 생성
      </button>

      {/* 모달 */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen p-4'>
            <div
              className='fixed inset-0 bg-basic-black bg-opacity-30'
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className='relative bg-white rounded-lg max-w-md w-full mx-auto p-6 shadow-xl'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                새 크루 생성
              </h3>

              <form onSubmit={handleSubmit}>
                <div className='mb-4'>
                  <label
                    htmlFor='name'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    크루 이름 *
                  </label>
                  <input
                    type='text'
                    id='name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    placeholder='예: Tan-Cheon Running Crew'
                    required
                  />
                </div>

                <div className='mb-4'>
                  <label
                    htmlFor='description'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    설명 (선택)
                  </label>
                  <textarea
                    id='description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    placeholder='크루에 대한 간략한 설명'
                  />
                </div>

                {error && (
                  <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm'>
                    {error}
                  </div>
                )}

                <div className='flex justify-end space-x-3 mt-5'>
                  <button
                    type='button'
                    onClick={() => setIsModalOpen(false)}
                    className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    disabled={isLoading}
                  >
                    취소
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    disabled={isLoading}
                  >
                    {isLoading ? "생성 중..." : "생성"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
