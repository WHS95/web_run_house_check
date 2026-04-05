import { NextRequest, NextResponse } from "next/server";
import { updateCrewLocation, deleteCrewLocation } from "@/lib/supabase/admin";
import { CrewLocationUpdateData } from "@/lib/types/crew-locations";
import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

interface RouteContext {
  params: { id: string };
}

async function verifyLocationOwnership(
  locationId: number,
  crewId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .schema("attendance")
    .from("crew_locations")
    .select("crew_id")
    .eq("id", locationId)
    .maybeSingle();
  return !!data && data.crew_id === crewId;
}

// PUT: 활동장소 수정
export async function PUT(request: NextRequest, context: RouteContext) {
  const guard = await assertAdmin("location.manage");
  if (isGuardFailure(guard)) return guard;

  try {
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    if (!(await verifyLocationOwnership(id, guard.crewId))) {
      return NextResponse.json(
        { success: false, message: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      latitude,
      longitude,
      is_active,
    }: CrewLocationUpdateData = body;

    if (
      !name &&
      description === undefined &&
      latitude === undefined &&
      longitude === undefined &&
      is_active === undefined
    ) {
      return NextResponse.json(
        { success: false, message: "수정할 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    if (
      (latitude !== undefined && (latitude < -90 || latitude > 90)) ||
      (longitude !== undefined && (longitude < -180 || longitude > 180))
    ) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 좌표입니다." },
        { status: 400 }
      );
    }

    const updateData: CrewLocationUpdateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || undefined;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await updateCrewLocation(id, updateData);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    revalidateTag(`admin:settings:${guard.crewId}`);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("크루 활동장소 수정 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 활동장소 삭제
export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await assertAdmin("location.manage");
  if (isGuardFailure(guard)) return guard;

  try {
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    if (!(await verifyLocationOwnership(id, guard.crewId))) {
      return NextResponse.json(
        { success: false, message: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const { success, error } = await deleteCrewLocation(id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    revalidateTag(`admin:settings:${guard.crewId}`);

    return NextResponse.json(
      { success: true, message: "활동장소가 성공적으로 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("크루 활동장소 삭제 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH: 활동장소 활성화 상태 토글
export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await assertAdmin("location.manage");
  if (isGuardFailure(guard)) return guard;

  try {
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    if (!(await verifyLocationOwnership(id, guard.crewId))) {
      return NextResponse.json(
        { success: false, message: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { success: false, message: "is_active는 boolean 값이어야 합니다." },
        { status: 400 }
      );
    }

    const updateData: CrewLocationUpdateData = { is_active };
    const { data, error } = await updateCrewLocation(id, updateData);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    revalidateTag(`admin:settings:${guard.crewId}`);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("크루 활동장소 상태 변경 API 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
