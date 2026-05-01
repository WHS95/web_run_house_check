import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { InviteCodeRow } from "@/lib/domain/invite/types";

/**
 * 단일 크루의 초대코드 목록 조회.
 * - error 또는 data 없음 → 빈 배열 반환 (페이지가 깨지지 않도록).
 * - 정렬: 최신 발급 우선.
 */
export async function 크루초대코드VM_조립(
    crewId: string
): Promise<InviteCodeRow[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema("attendance")
        .from("crew_invite_codes")
        .select("*")
        .eq("crew_id", crewId)
        .order("created_at", { ascending: false });

    if (error || !data) {
        return [];
    }

    return data as InviteCodeRow[];
}
