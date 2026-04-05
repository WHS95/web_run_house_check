export type AdminScope =
    | "notices"
    | "users"
    | "attendance"
    | "settings"
    | "stats"
    | "crew";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const adminKey = {
    notices: (crewId: string, q?: string) =>
        `admin:notices:${crewId}${q ? `:q=${q}` : ""}`,
    notice: (crewId: string, noticeId: string) =>
        `admin:notices:${crewId}:${noticeId}`,
    users: (crewId: string) => `admin:users:${crewId}`,
    user: (crewId: string, userId: string) =>
        `admin:users:${crewId}:${userId}`,
    attendance: (crewId: string, year: number, month: number) =>
        `admin:attendance:${crewId}:${year}-${pad2(month)}`,
    settings: (crewId: string) => `admin:settings:${crewId}`,
    crew: (crewId: string) => `admin:crew:${crewId}`,
    stats: (crewId: string, year: number, month: number) =>
        `admin:stats:${crewId}:${year}-${pad2(month)}`,
};

export function scopePrefix(
    scope: AdminScope | "all",
    crewId: string
): string {
    if (scope === "all") return "admin:";
    return `admin:${scope}:${crewId}`;
}
