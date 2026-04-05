import { NextRequest, NextResponse } from "next/server";
import {
  getCrewLocations,
  getCrewById,
  getCrewExerciseTypes,
} from "@/lib/supabase/admin";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await assertAdmin("crew.update");
  if (isGuardFailure(guard)) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");

    if (!crewId) {
      return NextResponse.json(
        { success: false, message: "crewId가 필요합니다." },
        { status: 400 }
      );
    }

    if (crewId !== guard.crewId) {
      return NextResponse.json(
        { success: false, message: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 크루 정보 조회
    const { data: crewData, error: crewError } = await getCrewById(crewId);

    if (crewError || !crewData) {
      //console.error("크루 정보 조회 오류:", crewError);
      return NextResponse.json(
        {
          success: false,
          error: "크루 정보를 가져오는데 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 크루 모임 장소 목록 조회
    const { data: locations, error: locationsError } = await getCrewLocations(
      crewId
    );

    if (locationsError) {
      //console.error("크루 모임 장소 조회 오류:", locationsError);
      return NextResponse.json(
        {
          success: false,
          error: "모임 장소 정보를 가져오는데 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 크루 운동 종류 목록 조회
    const { data: exerciseTypes, error: exerciseTypesError } =
      await getCrewExerciseTypes(crewId);

    if (exerciseTypesError) {
      return NextResponse.json(
        {
          success: false,
          error: "운동 종류 정보를 가져오는데 실패했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        crewData,
        locations: locations || [],
        exerciseTypes: exerciseTypes || [],
      },
    });
  } catch (error) {
    //console.error("Settings API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "설정 데이터를 가져오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
