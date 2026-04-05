import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
    can,
    normalizeRole,
    type AdminAction,
    type AdminRole,
} from "./permissions";

export interface AdminGuardResult {
    userId: string;
    crewId: string;
    role: AdminRole;
}

async function createSb() {
    const store = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return store.get(name)?.value;
                },
                set(_n: string, _v: string, _o: CookieOptions) {},
                remove(_n: string, _o: CookieOptions) {},
            },
        }
    );
}

/**
 * admin API 라우트 상단에서 호출.
 * 실패 시 NextResponse를 반환하므로 호출부는 isGuardFailure로 먼저 체크.
 */
export async function assertAdmin(
    action: AdminAction
): Promise<AdminGuardResult | NextResponse> {
    const supabase = await createSb();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json(
            { success: false, message: "인증이 필요합니다." },
            { status: 401 }
        );
    }

    const { data: userRow } = await supabase
        .schema("attendance")
        .from("users")
        .select("verified_crew_id, is_crew_verified")
        .eq("id", user.id)
        .single();

    if (!userRow?.is_crew_verified || !userRow.verified_crew_id) {
        return NextResponse.json(
            { success: false, message: "크루 인증이 필요합니다." },
            { status: 403 }
        );
    }

    const { data: membership } = await supabase
        .schema("attendance")
        .from("user_crews")
        .select("crew_role")
        .eq("user_id", user.id)
        .eq("crew_id", userRow.verified_crew_id)
        .maybeSingle();

    const role = normalizeRole(membership?.crew_role);
    if (!role || !can(role, action)) {
        return NextResponse.json(
            { success: false, message: "권한이 없습니다." },
            { status: 403 }
        );
    }

    return { userId: user.id, crewId: userRow.verified_crew_id, role };
}

export function isGuardFailure(
    v: AdminGuardResult | NextResponse
): v is NextResponse {
    return v instanceof NextResponse;
}
