import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Tag, User, Clock, Calendar } from "lucide-react";

// 대시보드 카드 컴포넌트
function DashboardCard({
  title,
  value,
  icon,
  href,
  bgColor,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  href: string;
  bgColor: string;
}) {
  return (
    <Link
      href={href}
      className='bg-white rounded-lg shadow-sm p-6 flex items-center hover:shadow-md transition-shadow'
    >
      <div className={`${bgColor} rounded-full p-4 mr-6`}>{icon}</div>
      <div>
        <h3 className='text-gray-500 text-sm'>{title}</h3>
        <p className='text-2xl font-bold'>{value}</p>
      </div>
    </Link>
  );
}

export default async function SuperAdminDashboard() {
  const supabase = await createClient();

  // 데이터 조회
  const { data: crewsData } = await supabase
    .from("crews")
    .select("id")
    .order("created_at", { ascending: false });

  const { data: usersData } = await supabase
    .from("users")
    .select("id")
    .order("created_at", { ascending: false });

  const { data: inviteCodesData } = await supabase
    .from("crew_invite_codes")
    .select("id")
    .order("created_at", { ascending: false });

  const { data: verifiedUsersData } = await supabase
    .from("users")
    .select("id")
    .eq("is_crew_verified", true);

  // 오늘 가입한 사용자 수
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayUsersData } = await supabase
    .from("users")
    .select("id")
    .gte("created_at", today.toISOString());

  // 이번 주 가입한 사용자 수
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data: weekUsersData } = await supabase
    .from("users")
    .select("id")
    .gte("created_at", startOfWeek.toISOString());

  return (
    <div>
      <h1 className='text-2xl font-bold mb-6'>슈퍼 관리자 대시보드</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
        <DashboardCard
          title='전체 크루 수'
          value={crewsData?.length || 0}
          icon={<Users size={24} className='text-blue-600' />}
          href='/admin/super/crews'
          bgColor='bg-blue-100'
        />
        <DashboardCard
          title='전체 회원 수'
          value={usersData?.length || 0}
          icon={<User size={24} className='text-green-600' />}
          href='/admin/super/members'
          bgColor='bg-green-100'
        />
        <DashboardCard
          title='초대 코드 수'
          value={inviteCodesData?.length || 0}
          icon={<Tag size={24} className='text-purple-600' />}
          href='/admin/super/invite-codes'
          bgColor='bg-purple-100'
        />
        <DashboardCard
          title='인증된 사용자 수'
          value={verifiedUsersData?.length || 0}
          icon={<User size={24} className='text-cyan-600' />}
          href='/admin/super/members?verified=true'
          bgColor='bg-cyan-100'
        />
        <DashboardCard
          title='오늘 가입자 수'
          value={todayUsersData?.length || 0}
          icon={<Clock size={24} className='text-amber-600' />}
          href='/admin/super/stats'
          bgColor='bg-amber-100'
        />
        <DashboardCard
          title='이번 주 가입자 수'
          value={weekUsersData?.length || 0}
          icon={<Calendar size={24} className='text-red-600' />}
          href='/admin/super/stats'
          bgColor='bg-red-100'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white p-6 rounded-lg shadow-sm'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-lg font-semibold'>최근 크루</h2>
            <Link href='/admin/super/crews' className='text-blue-600 text-sm'>
              모두 보기
            </Link>
          </div>

          <div className='space-y-4'>
            {crewsData?.slice(0, 5).map((crew, index) => (
              <Link
                href={`/admin/super/crews/${crew.id}`}
                key={crew.id}
                className='flex items-center p-3 hover:bg-gray-50 rounded-md transition-colors'
              >
                <div className='bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-4'>
                  {index + 1}
                </div>
                <div>
                  <p className='font-medium'>크루 {index + 1}</p>
                  <p className='text-sm text-gray-500'>ID: {crew.id}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-sm'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-lg font-semibold'>최근 가입 회원</h2>
            <Link href='/admin/super/members' className='text-blue-600 text-sm'>
              모두 보기
            </Link>
          </div>

          <div className='space-y-4'>
            {usersData?.slice(0, 5).map((user, index) => (
              <div
                key={user.id}
                className='flex items-center p-3 hover:bg-gray-50 rounded-md transition-colors'
              >
                <div className='bg-green-100 text-green-600 rounded-full w-10 h-10 flex items-center justify-center mr-4'>
                  {index + 1}
                </div>
                <div>
                  <p className='font-medium'>사용자 {index + 1}</p>
                  <p className='text-sm text-gray-500'>
                    {user.id.substring(0, 10)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
