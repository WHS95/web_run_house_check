import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { attendanceSubmissionSchema } from "@/lib/validators/attendanceSchema";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// 서버용 Supabase 클라이언트
const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  );
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const body = await request.json();
    const parsedData = attendanceSubmissionSchema.safeParse(body);

    if (!parsedData.success) {
      //console.error("Invalid attendance data:", parsedData.error.flatten());
      return NextResponse.json(
        {
          success: false,
          message: "제출된 데이터가 유효하지 않습니다.",
          errors: parsedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      userId,
      crewId,
      locationId,
      exerciseTypeId,
      isHost,
      attendanceTimestamp,
    } = parsedData.data;

    // KST 기준 현재 시간 + 2시간까지 허용
    const now = new Date();
    const koreaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    );
    // 현재 한국 시간 + 2시간까지 허용
    const maxAllowedTime = new Date(koreaTime.getTime() + 2 * 60 * 60 * 1000);

    const attendanceTime = new Date(attendanceTimestamp);

 
    if (attendanceTime > maxAllowedTime) {
      return NextResponse.json(
        {
          success: false,
          message:
            "허용된 시간 범위를 초과했습니다. 현재 시간으로부터 2시간까지만 출석이 가능합니다.",
        },
        { status: 400 }
      );
    }

    // 병렬로 locationId 검증과 출석 기록 삽입 준비
    const [locationValidation] = await Promise.allSettled([
      supabase
        .schema("attendance")
        .from("crew_locations")
        .select("name")
        .eq("id", locationId)
        .eq("crew_id", crewId)
        .eq("is_active", true)
        .single(),
    ]);

    if (
      locationValidation.status === "rejected" ||
      locationValidation.value.error ||
      !locationValidation.value.data
    ) {
      //console.error(
      //   "Error fetching location name:",
      //   locationValidation.status === "fulfilled"
      //     ? locationValidation.value.error
      //     : locationValidation.reason
      // );
      return NextResponse.json(
        {
          success: false,
          message:
            "선택한 장소를 찾을 수 없거나 현재 크루에서 사용할 수 없는 장소입니다.",
        },
        { status: 404 }
      );
    }

    const locationName = locationValidation.value.data.name;

    // 출석 기록 삽입
    const { data: attendanceRecord, error: insertError } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .insert([
        {
          user_id: userId,
          crew_id: crewId,
          exercise_type_id: exerciseTypeId,
          is_host: isHost,
          attendance_timestamp: attendanceTimestamp,
          location: locationName,
        },
      ])
      .select()
      .single();

    if (insertError) {
      //console.error("Error inserting attendance record:", insertError);
      return NextResponse.json(
        {
          success: false,
          message: "출석 기록 저장 중 오류가 발생했습니다.",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "출석이 성공적으로 기록되었습니다.",
        data: attendanceRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    //console.error("API Error in /api/attendance/route.ts:", error);
    let errorMessage = "서버 내부 오류가 발생했습니다.";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("JSON")) {
        errorMessage = "잘못된 요청 형식입니다.";
        statusCode = 400;
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  }
}

export async function GET() {
  // GET 요청 처리 (기존 코드 유지)
  return NextResponse.json(
    { success: false, message: "GET 요청은 지원되지 않습니다." },
    { status: 405 }
  );
}
