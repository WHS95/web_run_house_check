import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrewById, getCrewInviteCodes } from "@/lib/supabase/admin";
import { Eye, ToggleLeft, ToggleRight } from "lucide-react";
import InviteCodeCreateButton from "@/components/admin/crew/InviteCodeCreateButton";

interface UserInfo {
  first_name: string | null;
  email: string | null;
}

interface InviteCodeData {
  id: number;
  invite_code: string;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
  created_by: string;
  users: UserInfo[] | null;
}

interface CrewInviteCodesPageProps {
  params: {
    crewId: string;
  };
}

export default async function CrewInviteCodesPage({
  params,
}: CrewInviteCodesPageProps) {
  const { crewId } = params;

  // 크루 정보 조회
  const { data: crew, error: crewError } = await getCrewById(crewId);

  if (crewError || !crew) {
    notFound();
  }

  // 해당 크루의 초대 코드 목록 조회
  const {
    data: codes,
    error: codesError,
  }: { data: InviteCodeData[] | null; error: Error | null } =
    await getCrewInviteCodes(crewId);

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <Link
            href='/admin/super/crews'
            className='inline-block mb-2 text-sm text-blue-600 hover:underline'
          >
            &larr; 크루 목록으로 돌아가기
          </Link>
          <h1 className='text-2xl font-bold'>
            {crew.name} 크루 초대 코드 관리
          </h1>
        </div>

        <InviteCodeCreateButton crewId={crewId} crewName={crew.name} />
      </div>

      {codesError && (
        <div className='p-4 mb-6 text-red-700 bg-red-100 rounded-md'>
          초대 코드 목록을 불러오는데 오류가 발생했습니다.
        </div>
      )}

      <div className='overflow-hidden bg-white rounded-lg shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
                >
                  코드
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
                >
                  설명
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
                >
                  상태
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
                >
                  사용 현황
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
                >
                  만료일
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
                >
                  생성자
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'
                >
                  관리
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {codes?.map((code) => (
                <tr key={code.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='font-mono text-sm font-medium text-gray-900'>
                      {code.invite_code}
                    </div>
                    <div className='text-xs text-gray-500'>ID: {code.id}</div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='max-w-xs text-sm text-gray-500 truncate'>
                      {code.description || "-"}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        code.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {code.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      {code.used_count || 0} / {code.max_uses || "∞"}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-500'>
                      {code.expires_at
                        ? new Date(code.expires_at).toLocaleDateString()
                        : "무기한"}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      {code.users && code.users.length > 0
                        ? code.users[0].first_name
                        : "Unknown"}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {code.users && code.users.length > 0
                        ? code.users[0].email
                        : "-"}
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm font-medium text-right whitespace-nowrap'>
                    <div className='flex justify-end space-x-2'>
                      <Link
                        href={`/admin/super/invite-codes/${code.id}/logs`}
                        className='p-2 text-blue-600 rounded hover:text-blue-900 bg-blue-50'
                        title='사용 로그 보기'
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        className={`${
                          code.is_active
                            ? "text-red-600 hover:text-red-900 bg-red-50"
                            : "text-green-600 hover:text-green-900 bg-green-50"
                        } p-2 rounded`}
                        title={code.is_active ? "비활성화" : "활성화"}
                      >
                        {code.is_active ? (
                          <ToggleRight size={16} />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {codes?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-6 py-4 text-sm text-center text-gray-500'
                  >
                    등록된 초대 코드가 없습니다.
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
