"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 콘솔에 전체 사용자 객체 출력
          // console.log("전체 사용자 객체:", user);

          // 개별 필드 출력
          // console.log("ID:", user.id);
          // console.log("이메일:", user.email);
          // console.log("사용자 메타데이터:", user.user_metadata);
          // console.log("앱 메타데이터:", user.app_metadata);
          // console.log("제공자:", user.app_metadata.provider);

          setUser(user);
        }
      } catch (error) {
        // console.error("사용자 정보 가져오기 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div>로딩 중...</div>;

  if (!user) return <div>로그인된 사용자가 없습니다.</div>;

  return (
    <div className='max-w-md p-6 mx-auto bg-white rounded-lg shadow-md'>
      <h2 className='mb-4 text-2xl font-bold'>사용자 정보</h2>

      <div className='space-y-4'>
        <div>
          <p className='text-gray-600'>사용자 ID:</p>
          <p className='font-medium'>{user.id}</p>
        </div>

        {user.email && (
          <div>
            <p className='text-gray-600'>이메일:</p>
            <p className='font-medium'>{user.email}</p>
          </div>
        )}

        {user.user_metadata && (
          <div>
            <p className='text-gray-600'>사용자 메타데이터:</p>
            <pre className='p-2 overflow-auto text-sm bg-gray-100 rounded max-h-60'>
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </div>
        )}

        {user.app_metadata && (
          <div>
            <p className='text-gray-600'>앱 메타데이터:</p>
            <pre className='p-2 overflow-auto text-sm bg-gray-100 rounded max-h-60'>
              {JSON.stringify(user.app_metadata, null, 2)}
            </pre>
          </div>
        )}

        {user.last_sign_in_at && (
          <div>
            <p className='text-gray-600'>마지막 로그인:</p>
            <p className='font-medium'>
              {new Date(user.last_sign_in_at).toLocaleString("ko-KR")}
            </p>
          </div>
        )}

        {user.created_at && (
          <div>
            <p className='text-gray-600'>생성일:</p>
            <p className='font-medium'>
              {new Date(user.created_at).toLocaleString("ko-KR")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
