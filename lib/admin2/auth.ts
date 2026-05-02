import { cache } from "react";
import { redirect } from "next/navigation";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { 관리자_역할_결정 } from "@/lib/domain/master/policies";
import type { AdminRole } from "./permissions";

export interface AdminAuthContext {
    userId: string;
    crewId: string;
    firstName: string;
    role: AdminRole;
}

// 요청당 한 번만 인증 실행 (React.cache)
export const getAdminAuth = cache(async (): Promise<AdminAuthContext> => {
    const base = await verifyAdminAuth();

    const supabase = await createClient();

    // 시스템 권한(MASTER_ADMIN/ADMIN)과 크루 권한을 병렬 조회.
    // 마스터(role_id=1)는 인증 크루의 crew_role과 무관하게 owner로 통과.
    const [roleRes, membershipRes] = await Promise.all([
        supabase
            .schema("attendance")
            .from("user_roles")
            .select("role_id")
            .eq("user_id", base.userId)
            .maybeSingle(),
        supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_role")
            .eq("user_id", base.userId)
            .eq("crew_id", base.crewId)
            .maybeSingle(),
    ]);

    const role = 관리자_역할_결정({
        roleId: roleRes.data?.role_id ?? null,
        crewRole: membershipRes.data?.crew_role ?? null,
    });

    if (!role) {
        redirect("/");
    }

    return {
        userId: base.userId,
        crewId: base.crewId,
        firstName: base.firstName,
        role,
    };
});
