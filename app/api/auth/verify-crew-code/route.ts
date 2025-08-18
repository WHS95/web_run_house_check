import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr"; // 변경
import { cookies } from "next/headers"; // 유지

export async function POST(request: Request) {
  const cookieStore = await cookies(); // 유지

  const supabase = createServerClient(
    // 변경 시작
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
  ); // 변경 끝

  try {
    const { crewCode } = await request.json();

    if (!crewCode || typeof crewCode !== "string") {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 크루 코드 형식입니다." },
        { status: 400 }
      );
    }

    const { data: inviteCodeData, error: inviteCodeError } = await supabase
      .schema("attendance")
      .from("crew_invite_codes")
      .select("crew_id, is_active")
      .eq("invite_code", crewCode)
      .single();

    if (inviteCodeError) {
      console.error(
        "Error fetching crew invite code:",
        inviteCodeError.message
      );
      if (inviteCodeError.code === "PGRST116") {
        // PostgREST error for "No rows found"
        return NextResponse.json(
          { success: false, message: "존재하지 않는 크루 코드입니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, message: "크루 코드 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!inviteCodeData) {
      // 위에서 single()을 사용했으므로, PGRST116 에러로 처리되지만, 만약을 위한 방어 코드
      return NextResponse.json(
        { success: false, message: "존재하지 않는 크루 코드입니다." },
        { status: 404 }
      );
    }

    if (!inviteCodeData.is_active) {
      return NextResponse.json(
        { success: false, message: "비활성화된 크루 코드입니다." },
        { status: 403 }
      );
    }

    // if (
    //   inviteCodeData.expires_at &&
    //   new Date(inviteCodeData.expires_at) < new Date()
    // ) {
    //   return NextResponse.json(
    //     { success: false, message: "만료된 크루 코드입니다." },
    //     { status: 403 }
    //   );
    // }

    // if (
    //   inviteCodeData.max_uses !== null &&
    //   inviteCodeData.used_count >= inviteCodeData.max_uses
    // ) {
    //   return NextResponse.json(
    //     { success: false, message: "사용 한도를 초과한 크루 코드입니다." },
    //     { status: 403 }
    //   );
    // }

    return NextResponse.json(
      { success: true, crewId: inviteCodeData.crew_id },
      { status: 200 }
    );
  } catch (error: any) {
    //console.error("Verify crew code API error:", error.message);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
