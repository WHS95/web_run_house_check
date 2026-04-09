import { NextRequest, NextResponse } from "next/server";
import {
    toggleLocationBasedAttendance,
    updateAccuracyRange,
    updateAllowUnregisteredLocation,
} from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";
import {
    assertAdmin,
    isGuardFailure,
} from "@/lib/admin2/api-guard";

// PATCH: 크루의 위치 기반 출석 설정 토글
export async function PATCH(request: NextRequest) {
    const guard = await assertAdmin("crew.update");
    if (isGuardFailure(guard)) return guard;

    try {
        const body = await request.json();
        const {
            crew_id,
            location_based_attendance,
            accuracy_range,
            allow_unregistered_location,
        } = body;

        if (!crew_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "crew_id가 필요합니다.",
                },
                { status: 400 }
            );
        }

        if (crew_id !== guard.crewId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "권한이 없습니다.",
                },
                { status: 403 }
            );
        }

        /* allow_unregistered_location 업데이트 */
        if (
            allow_unregistered_location !== undefined
            && location_based_attendance
                === undefined
            && accuracy_range === undefined
        ) {
            if (
                typeof allow_unregistered_location
                !== "boolean"
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "allow_unregistered_"
                            + "location은 boolean "
                            + "값이어야 합니다.",
                    },
                    { status: 400 }
                );
            }

            const { error } =
                await updateAllowUnregisteredLocation(
                    crew_id,
                    allow_unregistered_location
                );

            if (error) {
                return NextResponse.json(
                    {
                        success: false,
                        error: error.message,
                    },
                    { status: 400 }
                );
            }

            revalidateTag(
                `admin:settings:${guard.crewId}`
            );

            return NextResponse.json(
                {
                    success: true,
                    message:
                        `미등록 장소 출석이 `
                        + `${allow_unregistered_location ? "허용" : "비허용"}`
                        + `으로 변경되었습니다.`,
                },
                { status: 200 }
            );
        }

        /* accuracy_range만 업데이트하는 경우 */
        if (
            accuracy_range !== undefined
            && location_based_attendance === undefined
        ) {
            if (
                typeof accuracy_range !== "number"
                || accuracy_range < 50
                || accuracy_range > 500
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "accuracy_range는 "
                            + "50~500 사이의 "
                            + "숫자여야 합니다.",
                    },
                    { status: 400 }
                );
            }

            const { error } =
                await updateAccuracyRange(
                    crew_id,
                    accuracy_range
                );

            if (error) {
                return NextResponse.json(
                    {
                        success: false,
                        error: error.message,
                    },
                    { status: 400 }
                );
            }

            revalidateTag(
                `admin:settings:${guard.crewId}`
            );

            return NextResponse.json(
                {
                    success: true,
                    message:
                        `허용 범위가 `
                        + `${accuracy_range}m로 `
                        + `변경되었습니다.`,
                },
                { status: 200 }
            );
        }

        /* 위치 기반 출석 토글 */
        if (
            typeof location_based_attendance
            !== "boolean"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "location_based_attendance는 "
                        + "boolean 값이어야 합니다.",
                },
                { status: 400 }
            );
        }

        const { success, error } =
            await toggleLocationBasedAttendance(
                crew_id,
                location_based_attendance
            );

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 400 }
            );
        }

        revalidateTag(
            `admin:settings:${guard.crewId}`
        );

        return NextResponse.json(
            {
                success: true,
                message:
                    `위치 기반 출석이 `
                    + `${location_based_attendance ? "활성화" : "비활성화"}`
                    + `되었습니다.`,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error(
            "위치 기반 출석 설정 변경 API 오류:",
            error
        );
        return NextResponse.json(
            {
                success: false,
                error: "서버 오류가 발생했습니다.",
            },
            { status: 500 }
        );
    }
}