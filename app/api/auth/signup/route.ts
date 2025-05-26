import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { signupSchema } from "@/lib/validators/signupSchema";

// TODO: Zod 스키마 import 및 유효성 검사 추가
// import { signupSchema } from "@/lib/validators/signupSchema";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    const requestData = await request.json();

    // Zod 유효성 검사
    const validation = signupSchema.safeParse(requestData);
    if (!validation.success) {
      console.log("Signup validation errors:", validation.error.format());
      return NextResponse.json(
        {
          success: false,
          message: "입력값이 유효하지 않습니다.",
          errors: validation.error.format(),
        },
        { status: 400 }
      );
    }
    // 검증된 데이터 사용 - profileImageUrl, phone 제거됨
    const { firstName, email, birthYear, verifiedCrewId, crewCode } =
      validation.data;

    if (!verifiedCrewId || !crewCode) {
      return NextResponse.json(
        { success: false, message: "크루 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { success: false, message: "사용자 인증에 실패했습니다." },
        { status: 401 }
      );
    }

    // updateUserData에서 profile_image_url, phone 제거
    const updateUserData: Record<string, any> = {
      first_name: firstName,
      birth_year: birthYear,
      is_crew_verified: true,
      verified_crew_id: verifiedCrewId,
      updated_at: new Date().toISOString(),
    };

    // 사용자 이메일 변경이 필요하다면 supabase.auth.updateUser 사용
    if (email && email !== user!.email) {
      const { error: updateUserError } = await supabase.auth.updateUser({
        email: email,
      });
      if (updateUserError) {
        console.warn("Error updating user email:", updateUserError);
      }
    }

    // users 테이블에 oauth_provider와 oauth_id 채우기
    if (user!.app_metadata?.provider) {
      updateUserData.oauth_provider = user!.app_metadata.provider;
    }
    // oauth_id는 일반적으로 user.id를 사용하거나, user_metadata에서 가져옴
    // Kakao의 경우 user.user_metadata.sub 또는 user.user_metadata.provider_id 등을 확인
    // 여기서는 users 테이블에 oauth_id 컬럼이 있으므로 채워주는것이 좋음
    // 예시: user.id를 사용 (만약 이것이 social provider의 ID와 같다면)
    // updateUserData.oauth_id = user.id;
    // 또는 카카오인 경우:
    if (user!.app_metadata?.provider === "kakao" && user!.user_metadata?.sub) {
      updateUserData.oauth_id = user!.user_metadata.sub;
    }
    // id 필드를 updateUserData 객체에 추가
    updateUserData.id = user!.id;

    const { error: upsertError } = await supabase
      .schema("attendance")
      .from("users")
      .upsert(updateUserData, { onConflict: "id" });

    if (upsertError) {
      console.error("Error upserting user data in 'users' table:", upsertError);
      return NextResponse.json(
        {
          success: false,
          message: "회원 정보 저장 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    // 옵션: crew_invite_codes 테이블의 used_count 증가
    const { error: incrementError } = await supabase.rpc(
      "increment_crew_invite_code_used_count",
      { input_code: crewCode }
    );

    if (incrementError) {
      console.warn(
        "Failed to increment crew_invite_codes used_count:",
        incrementError
      );
      // 이 오류는 회원가입 자체를 실패시키지는 않음 (중요도에 따라 결정)
    }

    return NextResponse.json(
      { success: true, message: "회원가입이 성공적으로 완료되었습니다." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Signup API error:", error.message, error.stack);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/*
-- Supabase SQL Editor에 다음 함수 생성 필요 (used_count 증가용)
CREATE OR REPLACE FUNCTION attendance.increment_crew_invite_code_used_count(input_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- 중요: 호출한 사용자의 권한이 아닌, 함수 정의자의 권한으로 실행
AS $$
BEGIN
  UPDATE attendance.crew_invite_codes
  SET used_count = used_count + 1, updated_at = NOW()
  WHERE invite_code = input_code AND is_active = TRUE;
  -- 참고: used_count >= max_uses 체크는 이미 verify-crew-code API에서 했으므로 여기서는 생략하거나, 
  -- 중복으로 더 엄격하게 체크할 수도 있습니다.
  -- (예: AND (max_uses IS NULL OR used_count < max_uses -1)) -- 업데이트 전 기준으로 체크
END;
$$;
*/
