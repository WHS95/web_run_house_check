import { NextRequest, NextResponse } from "next/server";
import { getCrewLocations, getCrewById } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");

    if (!crewId) {
      return NextResponse.json(
        { error: "crewId가 필요합니다." },
        { status: 400 }
      );
    }

    // 크루 정보 조회
    const { data: crewData, error: crewError } = await getCrewById(crewId);

    if (crewError || !crewData) {
      console.error("크루 정보 조회 오류:", crewError);
      return NextResponse.json(
        { error: "크루 정보를 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 크루 모임 장소 목록 조회
    const { data: locations, error: locationsError } = await getCrewLocations(
      crewId
    );

    if (locationsError) {
      console.error("크루 모임 장소 조회 오류:", locationsError);
      return NextResponse.json(
        { error: "모임 장소 정보를 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      crewData,
      locations: locations || [],
    });
  } catch (error) {
    console.error("Settings API 오류:", error);
    return NextResponse.json(
      { error: "설정 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
