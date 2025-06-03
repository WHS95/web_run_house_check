import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { attendanceSubmissionSchema } from "@/lib/validators/attendanceSchema";

// 서버용 Supabase 클라이언트 (환경 변수 설정 확인 필요)
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
      console.error("Invalid attendance data:", parsedData.error.flatten());
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

    // 1. locationId로 location name 조회
    const { data: locationData, error: locationError } = await supabase
      .schema("attendance")
      .from("crew_locations")
      .select("name")
      .eq("id", locationId)
      .eq("crew_id", crewId) // 해당 크루의 장소인지 추가 확인 (선택적이지만 권장)
      .eq("is_active", true) // 활성화된 장소인지 확인
      .single();

    if (locationError || !locationData) {
      console.error("Error fetching location name:", locationError);
      return NextResponse.json(
        {
          success: false,
          message:
            locationError?.code === "PGRST116" // PostgREST error for no rows found
              ? "선택한 장소를 찾을 수 없거나 현재 크루에서 사용할 수 없는 장소입니다."
              : "장소 정보를 가져오는 중 오류가 발생했습니다.",
        },
        { status: 404 }
      );
    }

    const locationName = locationData.name;

    // 2. attendance_records 테이블에 데이터 삽입
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
          location: locationName, // 조회한 장소 이름 사용
        },
      ])
      .select()
      .single(); // 단일 레코드 삽입 후 결과 확인

    if (insertError) {
      console.error("Error inserting attendance record:", insertError);
      // 데이터베이스 관련 에러 메시지 (예: 중복, 제약조건 위반 등)를 좀 더 구체적으로 사용자에게 전달할 수 있음
      return NextResponse.json(
        {
          success: false,
          message: "출석 기록 저장 중 오류가 발생했습니다.",
          details: insertError.message, // 개발/디버깅 시 유용
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
    console.error("API Error in /api/attendance/route.ts:", error);
    let errorMessage = "서버 내부 오류가 발생했습니다.";
    if (error instanceof Error) {
      // SyntaxError 등의 경우 request.json() 실패 시
      if (error.message.includes("JSON")) {
        errorMessage = "잘못된 요청 형식입니다.";
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  // ... existing code ...
}
