import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ServerProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    console.error("사용자 정보 가져오기 오류:", error);
    redirect("/auth/login");
  }

  // 서버 콘솔에 사용자 정보 출력
  console.log("서버에서 확인한 사용자 정보:", data.user);

  return (
    <div className='min-h-screen p-4 bg-gray-100 overflow-hidden'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='mb-6 text-3xl font-bold text-center'>
          내 프로필 (서버)
        </h1>

        <div className='h-[calc(100vh-150px)] overflow-y-auto pb-8'>
          <div className='max-w-md p-6 mx-auto bg-white rounded-lg shadow-md'>
            <h2 className='mb-4 text-2xl font-bold'>사용자 정보</h2>

            <div className='space-y-4'>
              <div>
                <p className='text-gray-600'>사용자 ID:</p>
                <p className='font-medium'>{data.user.id}</p>
              </div>

              {data.user.email && (
                <div>
                  <p className='text-gray-600'>이메일:</p>
                  <p className='font-medium'>{data.user.email}</p>
                </div>
              )}

              {data.user.user_metadata && (
                <div>
                  <p className='text-gray-600'>사용자 메타데이터:</p>
                  <pre className='p-2 overflow-auto text-sm bg-gray-100 rounded max-h-60'>
                    {JSON.stringify(data.user.user_metadata, null, 2)}
                  </pre>
                </div>
              )}

              {data.user.app_metadata && (
                <div>
                  <p className='text-gray-600'>앱 메타데이터:</p>
                  <pre className='p-2 overflow-auto text-sm bg-gray-100 rounded max-h-60'>
                    {JSON.stringify(data.user.app_metadata, null, 2)}
                  </pre>
                </div>
              )}

              {data.user.last_sign_in_at && (
                <div>
                  <p className='text-gray-600'>마지막 로그인:</p>
                  <p className='font-medium'>
                    {new Date(data.user.last_sign_in_at).toLocaleString(
                      "ko-KR"
                    )}
                  </p>
                </div>
              )}

              {data.user.created_at && (
                <div>
                  <p className='text-gray-600'>생성일:</p>
                  <p className='font-medium'>
                    {new Date(data.user.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
