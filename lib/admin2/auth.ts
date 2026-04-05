import { cache } from "react";
import { redirect } from "next/navigation";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, type AdminRole } from "./permissions";

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
    const { data: membership } = await supabase
        .schema("attendance")
        .from("user_crews")
        .select("crew_role")
        .eq("user_id", base.userId)
        .eq("crew_id", base.crewId)
        .maybeSingle();

    const role = normalizeRole(membership?.crew_role);
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
