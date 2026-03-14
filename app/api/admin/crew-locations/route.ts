import { NextRequest, NextResponse } from "next/server";
import {
  getCrewLocations,
  createCrewLocation,
} from "@/lib/supabase/admin";
import { CrewLocationCreateData } from "@/lib/types/crew-locations";

// GET: 크루의 모든 활동장소 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crew_id");

    if (!crewId) {
      return NextResponse.json(
        { success: false, error: "crew_id가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await getCrewLocations(crewId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("크루 활동장소 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새로운 활동장소 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crew_id, name, description, latitude, longitude }: CrewLocationCreateData = body;

    // 필수 필드 검증
    if (!crew_id || !name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: "crew_id, name, latitude, longitude는 필수입니다." 
        },
        { status: 400 }
      );
    }

    // 좌표 유효성 검증
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 좌표입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await createCrewLocation(crew_id, {
      name: name.trim(),
      description: description?.trim() || undefined,
      latitude,
      longitude,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("크루 활동장소 생성 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}