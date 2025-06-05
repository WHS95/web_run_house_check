import Link from "next/link";
import { getAllCrews } from "@/lib/supabase/admin";
import { Plus, Edit, Users } from "lucide-react";
import CrewCreateButton from "@/components/admin/crew/CrewCreateButton";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

interface CrewData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  crew_members: { count: number }[] | null;
  invite_codes: { count: number }[] | null;
}

interface GetAllCrewsReturn {
  data: CrewData[] | null;
  error: Error | null;
}

export default async function CrewsPage() {
  const { data: crews, error }: GetAllCrewsReturn = await getAllCrews();

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>크루 관리</h1>
        <CrewCreateButton />
      </div>

      {error && (
        <div className='bg-red-100 p-4 rounded-md mb-6 text-red-700'>
          크루 목록을 불러오는데 오류가 발생했습니다.
        </div>
      )}

      <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  이름
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  설명
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  회원 수
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  초대 코드 수
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  생성일
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  관리
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {crews?.map((crew) => (
                <tr key={crew.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900'>
                      {crew.name}
                    </div>
                    <div className='text-xs text-gray-500'>ID: {crew.id}</div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-sm text-gray-500 max-w-xs truncate'>
                      {crew.description || "-"}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      {crews &&
                      crew.crew_members &&
                      crew.crew_members.length > 0
                        ? crew.crew_members[0].count
                        : 0}
                      명
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      {crews &&
                      crew.invite_codes &&
                      crew.invite_codes.length > 0
                        ? crew.invite_codes[0].count
                        : 0}
                      개
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-500'>
                      {new Date(crew.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex justify-end space-x-2'>
                      <Link
                        href={`/admin/super/crews/${crew.id}/members`}
                        className='text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded'
                        title='회원 관리'
                      >
                        <Users size={16} />
                      </Link>
                      <Link
                        href={`/admin/super/crews/${crew.id}/invite-codes`}
                        className='text-purple-600 hover:text-purple-900 bg-purple-50 p-2 rounded'
                        title='초대 코드 관리'
                      >
                        <Plus size={16} />
                      </Link>
                      <Link
                        href={`/admin/super/crews/${crew.id}/edit`}
                        className='text-gray-600 hover:text-gray-900 bg-gray-50 p-2 rounded'
                        title='편집'
                      >
                        <Edit size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {crews?.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-4 text-center text-sm text-gray-500'
                  >
                    등록된 크루가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
