import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { signupSchema } from "@/lib/validators/signupSchema";

export async function POST(request: Request) {
  const cookieStore = await cookies();
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
    const {
      firstName,
      email,
      phoneNumber,
      birthYear,
      verifiedCrewId,
      crewCode,
      privacyConsent,
      termsOfService,
    } = validation.data;

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

    // updateUserData에서 phone_number 추가
    const updateUserData: Record<string, any> = {
      first_name: firstName,
      email: email,
      phone: phoneNumber,
      birth_year: birthYear,
      is_crew_verified: true,
      verified_crew_id: verifiedCrewId,
      privacy_consent_agreed: privacyConsent,
      privacy_consent_agreed_at: privacyConsent
        ? new Date().toISOString()
        : null,
      updated_at: new Date().toISOString(),
      terms_of_service_agreed: termsOfService,
      terms_of_service_agreed_at: new Date().toISOString(),
      profile_image_url:
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
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

    //user 테이블에 등록
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
    }

    //유저-크루 테이블에 등록
    const { error: userCrewError } = await supabase
      .schema("attendance")
      .from("user_crews")
      .upsert(
        {
          user_id: user.id,
          crew_id: verifiedCrewId,
        },
        { onConflict: "user_id, crew_id" }
      );

    if (userCrewError) {
      console.error(
        "Error inserting user-crew data in 'user_crews' table:",
        userCrewError
      );
      return NextResponse.json(
        { success: false, message: "회원가입 중 오류가 발생했습니다." },
        { status: 500 }
      );
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
