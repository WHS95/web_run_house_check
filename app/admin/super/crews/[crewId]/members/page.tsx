import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCrewById,
  getCrewMembers,
  type CrewMember,
} from "@/lib/supabase/admin";
import { Trash2, ArrowLeft } from "lucide-react";
import RemoveMemberButton from "@/components/admin/crew/RemoveMemberButton";

// getCrewMembers 함수에서 반환하는 users 객체의 타입 정의
interface Member {
  id: string;
  email: string | null;
  display_name: string | null;
  profile_image_url: string | null;
  is_crew_verified: boolean;
  verified_crew_id: string | null;
  created_at: string;
  user_crew_id: string; // user_crews 테이블의 id
}

interface CrewMembersPageProps {
  params: {
    crewId: string;
  };
}

export default async function CrewMembersPage({
  params,
}: CrewMembersPageProps) {
  const { crewId } = params;

  // 크루 정보 조회
  const { data: crew, error: crewError } = await getCrewById(crewId);

  if (crewError || !crew) {
    notFound();
  }

  // 크루 회원 목록 조회
  const {
    data: members,
    error: membersError,
  }: { data: CrewMember[] | null; error: Error | null } = await getCrewMembers(
    crewId
  );

  return (
    <div>
      <div className='mb-6'>
        <Link
          href={`/admin/super/crews`}
          className='inline-flex items-center mb-2 text-sm text-blue-600 hover:underline'
        >
          <ArrowLeft size={16} className='mr-1' />
          크루 목록으로 돌아가기
        </Link>
        <h1 className='text-2xl font-bold'>{crew.name} 크루 회원 관리</h1>
        <p className='mt-1 text-gray-500'>
          총 {members?.length || 0}명의 회원이 속해 있습니다.
        </p>
      </div>

      {membersError && (
        <div className='p-4 mb-6 text-red-700 bg-red-100 rounded-md'>
          회원 목록을 불러오는데 오류가 발생했습니다.
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
                  이름/이메일
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
                >
                  크루 인증 상태
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
                >
                  가입일
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
              {members?.map((member) => (
                <tr key={member.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4'>
                    <div className='flex items-center'>
                      {member.profile_image_url ? (
                        <img
                          src={member.profile_image_url}
                          alt={member.first_name || "프로필 이미지"}
                          className='w-10 h-10 mr-3 rounded-full'
                        />
                      ) : (
                        <div className='flex items-center justify-center w-10 h-10 mr-3 bg-gray-200 rounded-full'>
                          <span className='font-medium text-gray-500'>
                            {(
                              member.first_name?.charAt(0) || "U"
                            ).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {member.first_name || "이름 없음"}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.is_crew_verified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {member.is_crew_verified ? "인증됨" : "미인증"}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-500 whitespace-nowrap'>
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 text-sm font-medium text-right whitespace-nowrap'>
                    <RemoveMemberButton
                      memberId={member.id}
                      memberName={member.first_name || "이름 없음"}
                      userCrewId={member.user_crew_id}
                    />
                  </td>
                </tr>
              ))}

              {members?.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className='px-6 py-4 text-sm text-center text-gray-500'
                  >
                    이 크루에 소속된 회원이 없습니다.
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
