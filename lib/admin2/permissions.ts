export type AdminRole = "owner" | "admin";

export type AdminAction =
    | "notice.create"
    | "notice.update"
    | "notice.delete"
    | "user.manage"
    | "user.changeRole"
    | "user.remove"
    | "crew.update"
    | "crew.delete"
    | "attendance.create"
    | "attendance.edit"
    | "attendance.delete"
    | "grade.manage"
    | "location.manage";

const MATRIX: Record<AdminAction, AdminRole[]> = {
    "notice.create": ["owner", "admin"],
    "notice.update": ["owner", "admin"],
    "notice.delete": ["owner", "admin"],
    "user.manage": ["owner", "admin"],
    "user.changeRole": ["owner"],
    "user.remove": ["owner"],
    "crew.update": ["owner", "admin"],
    "crew.delete": ["owner"],
    "attendance.create": ["owner", "admin"],
    "attendance.edit": ["owner", "admin"],
    "attendance.delete": ["owner", "admin"],
    "grade.manage": ["owner", "admin"],
    "location.manage": ["owner", "admin"],
};

export function can(role: AdminRole, action: AdminAction): boolean {
    return MATRIX[action]?.includes(role) ?? false;
}

export function normalizeRole(
    raw: string | null | undefined
): AdminRole | null {
    const upper = (raw ?? "").toUpperCase();
    if (upper === "OWNER") return "owner";
    if (upper === "CREW_MANAGER" || upper === "ADMIN") return "admin";
    return null;
}
