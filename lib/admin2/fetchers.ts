import { getCrewNoticesAction } from "@/app/admin2/notice/actions";

export class AdminFetchError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

// SWR key 규칙: "admin:<scope>:<crewId>[:params]"
// → /api/admin/<scope>?crewId=<crewId>&... 로 매핑
export async function adminFetcher<T = unknown>(key: string): Promise<T> {
    // notices scope는 server action으로 직접 호출
    const parsed = parseAdminKey(key);
    if (parsed && parsed.scope === "notices" && !parsed.id) {
        const result = await getCrewNoticesAction({
            crewId: parsed.crewId,
            q: parsed.params.get("q"),
        });
        if (!result?.success) {
            throw new AdminFetchError(
                result?.message || "요청 실패",
                500
            );
        }
        return (result.data ?? []) as unknown as T;
    }

    const url = swrKeyToUrl(key);
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json().catch(() => ({
        success: false,
        message: "응답 파싱 실패",
    }));
    if (!res.ok || !json?.success) {
        throw new AdminFetchError(
            json?.message || `요청 실패 (${res.status})`,
            res.status
        );
    }
    return json.data as T;
}

interface ParsedAdminKey {
    scope: string;
    crewId: string;
    params: URLSearchParams;
    id: string | null;
}

function parseAdminKey(key: string): ParsedAdminKey | null {
    const parts = key.split(":");
    if (parts[0] !== "admin" || parts.length < 3) {
        return null;
    }
    const scope = parts[1];
    const crewId = parts[2];
    const extra = parts.slice(3);
    const params = new URLSearchParams();
    let id: string | null = null;
    for (const seg of extra) {
        const eqIdx = seg.indexOf("=");
        if (eqIdx > 0) {
            params.set(seg.slice(0, eqIdx), seg.slice(eqIdx + 1));
        } else {
            id = seg;
        }
    }
    return { scope, crewId, params, id };
}

function swrKeyToUrl(key: string): string {
    // "admin:notices:<crewId>:q=foo" →
    //   /api/admin/notices?crewId=<crewId>&q=foo
    const parts = key.split(":");
    if (parts[0] !== "admin" || parts.length < 3) {
        throw new Error(`invalid admin SWR key: ${key}`);
    }
    const scope = parts[1];
    const crewId = parts[2];
    const extra = parts.slice(3);
    const params = new URLSearchParams({ crewId });
    for (const seg of extra) {
        const eqIdx = seg.indexOf("=");
        if (eqIdx > 0) {
            params.set(seg.slice(0, eqIdx), seg.slice(eqIdx + 1));
        } else {
            // /<scope>/<id> 형태 → 경로 끝에 id 추가 대신 id 쿼리
            params.set("id", seg);
        }
    }
    return `/api/admin/${scope}?${params.toString()}`;
}
