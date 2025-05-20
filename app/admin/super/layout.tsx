import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkIsSuperAdmin } from "@/lib/supabase/admin";
import SuperAdminSidebar from "@/components/admin/SuperAdminSidebar";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 현재 로그인된 사용자 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (userError || !user) {
    redirect("/auth/login?from=/admin/super");
  }

  // 슈퍼 관리자 권한 확인
  const { isSuperAdmin, error: adminError } = await checkIsSuperAdmin(user.id);

  // 슈퍼 관리자가 아니면 메인 페이지로 리다이렉트
  if (!isSuperAdmin || adminError) {
    redirect("/");
  }

  return (
    <div className='flex min-h-screen bg-gray-100'>
      {/* 사이드바 */}
      <SuperAdminSidebar />

      {/* 메인 콘텐츠 */}
      <div className='flex-1 p-8 overflow-y-auto'>{children}</div>
    </div>
  );
}
