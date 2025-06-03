import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import AttendanceTemplate from "@/components/templates/AttendanceTemplate";
import { type User } from "@supabase/supabase-js";

// 서버용 Supabase 클라이언트 (lib/supabase/server.ts로 분리 권장)
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

interface AttendancePageData {
  currentUser: {
    id: string;
    name: string | null;
  } | null;
  crewInfo: {
    id: string;
    name: string | null;
  } | null;
  fetchedLocationOptions: Array<{ value: string; label: string }>;
  fetchedExerciseOptions: Array<{ value: string; label: string }>;
}

async function getAttendancePageData(
  supabaseClient: any,
  user: User
): Promise<AttendancePageData> {
  let currentUserData: AttendancePageData["currentUser"] = {
    id: user.id,
    name: null,
  };
  let crewInfoData: AttendancePageData["crewInfo"] = null;
  let locationOptions: AttendancePageData["fetchedLocationOptions"] = [];
  let exerciseOptions: AttendancePageData["fetchedExerciseOptions"] = [];

  // 1. 사용자 상세 정보 (이름, 크루ID) 조회
  const { data: userData, error: userDbError } = await supabaseClient
    .schema("attendance")
    .from("users")
    .select("first_name, verified_crew_id, is_crew_verified")
    .eq("id", user.id)
    .single();

  if (userDbError || !userData) {
    console.error("Error fetching user for attendance page:", userDbError);
    // 로그인 페이지로 보내거나, 기본값으로 템플릿을 렌더링 할 수 있지만, page.tsx에서 세션체크를 하므로 여기까지 오면 문제상황
    // 이 경우 currentUserData.name은 auth에서 가져오도록 시도
    currentUserData.name = user.user_metadata?.full_name || user.email;
    // 크루 정보가 없으므로, 빈 옵션들로 반환
    return {
      currentUser: currentUserData,
      crewInfo: null,
      fetchedLocationOptions: [],
      fetchedExerciseOptions: [],
    };
  }

  currentUserData.name = userData.first_name;

  if (!userData.is_crew_verified || !userData.verified_crew_id) {
    redirect("/auth/verify-crew");
  }

  const currentCrewId = userData.verified_crew_id;

  // 2. 크루 정보 조회
  if (currentCrewId) {
    const { data: crewData, error: crewDbError } = await supabaseClient
      .schema("attendance")
      .from("crews")
      .select("id, name")
      .eq("id", currentCrewId)
      .single();

    if (crewDbError || !crewData) {
      console.error("Error fetching crew info:", crewDbError);
      // 크루 정보를 가져오지 못하면 출석 진행이 어려움. 에러 페이지나 알림 필요.
    } else {
      crewInfoData = { id: crewData.id, name: crewData.name };

      // 3. 해당 크루의 모임 장소 목록 조회
      const { data: locations, error: locationsError } = await supabaseClient
        .schema("attendance")
        .from("crew_locations")
        .select("id, name")
        .eq("crew_id", currentCrewId)
        .eq("is_active", true);

      if (locationsError)
        console.error("Error fetching crew locations:", locationsError);
      else
        locationOptions =
          locations?.map((loc: { id: number; name: string }) => ({
            value: loc.id.toString(),
            label: loc.name,
          })) || [];

      // 3.1 해당 크루가 허용하는 운동 종류 ID 목록 조회
      const { data: crewExerciseTypeIds, error: crewExerciseTypesError } =
        await supabaseClient
          .schema("attendance")
          .from("crew_exercise_types")
          .select("exercise_type_id")
          .eq("crew_id", currentCrewId);

      if (crewExerciseTypesError) {
        console.error(
          "Error fetching crew exercise type IDs:",
          crewExerciseTypesError
        );
      } else if (crewExerciseTypeIds && crewExerciseTypeIds.length > 0) {
        const exerciseTypeIds = crewExerciseTypeIds.map(
          (cet: { exercise_type_id: number }) => cet.exercise_type_id
        );

        // 3.2 허용된 ID 목록을 사용하여 운동 종류 상세 정보 조회
        const { data: exercises, error: exercisesError } = await supabaseClient
          .schema("attendance")
          .from("exercise_types")
          .select("id, name")
          .in("id", exerciseTypeIds);

        if (exercisesError) {
          console.error(
            "Error fetching allowed exercise types:",
            exercisesError
          );
        } else {
          exerciseOptions =
            exercises?.map((ex: { id: number; name: string }) => ({
              value: ex.id.toString(),
              label: ex.name,
            })) || [];
        }
      }
    }
  }

  // 4. 전체 운동 종류 조회 << 이 부분은 이제 크루별 조회로 대체됨
  /*
  const { data: exercises, error: exercisesError } = await supabaseClient
    .schema("attendance")
    .from("exercise_types")
    .select("id, name");

  if (exercisesError)
    console.error("Error fetching exercise types:", exercisesError);
  else
    exerciseOptions =
      exercises?.map((ex: { id: number; name: string }) => ({
        value: ex.id.toString(),
        label: ex.name,
      })) || [];
  */

  return {
    currentUser: currentUserData,
    crewInfo: crewInfoData,
    fetchedLocationOptions: locationOptions,
    fetchedExerciseOptions: exerciseOptions,
  };
}

export default async function AttendancePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect("/auth/login");
  }
  const { user } = session;

  const pageData = await getAttendancePageData(supabase, user);

  // pageData.crewInfo가 null이면 (크루 정보를 못 가져왔거나, 사용자가 크루에 속하지 않은 예외적 상황)
  // AttendanceTemplate에서 null 체크를 하고 있지만, 여기서도 추가 처리 가능
  if (!pageData.crewInfo && user) {
    // 사용자는 있는데 크루 정보가 없는 경우 (예: verify-crew에서 뭔가 잘못된 경우)
    // verify-crew로 보내는 것이 적절할 수 있음
    console.warn(
      "User is logged in, but no crew info found for attendance. Redirecting to verify-crew."
    );
    redirect("/auth/verify-crew");
  }

  return (
    <AttendanceTemplate
      currentUser={pageData.currentUser}
      crewInfo={pageData.crewInfo}
      fetchedLocationOptions={pageData.fetchedLocationOptions}
      fetchedExerciseOptions={pageData.fetchedExerciseOptions}
    />
  );
}
