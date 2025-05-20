import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Clock, ToggleLeft, ToggleRight, Eye, User } from "lucide-react";

interface CrewInfo {
  name: string;
}

interface UserInfo {
  display_name: string | null;
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
  crew_id: string;
  crews: CrewInfo[] | null;
  created_by: string;
  users: UserInfo[] | null;
}

export default async function InviteCodesPage() {
  const supabase = await createClient();

  // 모든 초대 코드 조회
  const { data: codes, error } = await supabase
    .from("crew_invite_codes")
    .select(
      `
            id,
            invite_code,
            description,
            is_active,
            max_uses,
            used_count,
            expires_at,
            created_at,
            crew_id,
            crews:crew_id (name),
            created_by,
            users:created_by (display_name, email)
        `
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>초대 코드 관리</h1>
      </div>

      {error && (
        <div className='bg-red-100 p-4 rounded-md mb-6 text-red-700'>
          초대 코드 목록을 불러오는데 오류가 발생했습니다.
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
                  코드
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  크루
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
                  상태
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  사용 현황
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  만료일
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  생성자
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
              {codes?.map((code) => (
                <tr key={code.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-mono font-medium text-gray-900'>
                      {code.invite_code}
                    </div>
                    <div className='text-xs text-gray-500'>ID: {code.id}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      {code.crews && code.crews.length > 0
                        ? code.crews[0].name
                        : "알 수 없는 크루"}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-sm text-gray-500 max-w-xs truncate'>
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
                        ? code.users[0].display_name
                        : "Unknown"}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {code.users && code.users.length > 0
                        ? code.users[0].email
                        : "-"}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex justify-end space-x-2'>
                      <Link
                        href={`/admin/super/invite-codes/${code.id}/logs`}
                        className='text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded'
                        title='사용 로그 보기'
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        href={`/admin/super/invite-codes/${code.id}/users`}
                        className='text-green-600 hover:text-green-900 bg-green-50 p-2 rounded'
                        title='사용자 목록'
                      >
                        <User size={16} />
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
                    colSpan={8}
                    className='px-6 py-4 text-center text-sm text-gray-500'
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
