import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// 출석 레코드 + 유저 정보 타입
export interface AttendanceRecordWithUser {
    id: string;
    user_id: string;
    crew_id: string;
    attendance_timestamp: string;
    location: string;
    exercise_type_id: number;
    exercise_type_name: string;
    is_host: boolean;
    deleted_at: string | null;
    users: { first_name: string };
}

// 공지 목록 (서버 사이드 초기 prefetch용)
export const getNoticesForAdmin = cache(async (crewId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .schema("attendance")
        .from("notices")
        .select(
            "id, crew_id, title, type, content, is_active, author_id, created_at, author:author_id(first_name)"
        )
        .eq("crew_id", crewId)
        .order("created_at", { ascending: false })
        .limit(100);
    if (error) throw new Error("공지 조회 실패");
    return data ?? [];
});

// Dashboard 통계 (서버 사이드, React.cache로 요청 내 중복 방지)
export const getDashboardStats = cache(
    async (crewId: string, year?: number, month?: number) => {
        const supabase = await createClient();

        const { data, error } = await supabase
            .schema("attendance")
            .rpc("get_admin_stats", {
                p_crew_id: crewId,
                p_year: year || null,
                p_month: month || null,
            });

        if (error || !data?.success) {
            throw new Error("통계 데이터 조회 실패");
        }

        return data.data;
    }
);

// 회원 목록 (서버 사이드)
export const getCrewUsers = cache(async (crewId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .schema("attendance")
        .rpc("get_admin_users_unified", { p_crew_id: crewId });

    if (error || !data?.success) {
        throw new Error("회원 목록 조회 실패");
    }
    return data.data || [];
});

// 월별 출석 데이터 (서버 사이드)
export const getMonthlyAttendance = cache(
    async (crewId: string, year: number, month: number) => {
        const supabase = await createClient();
        const monthStr = month.toString().padStart(2, "0");
        const startDate = `${year}-${monthStr}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

        const { data, error } = await supabase
            .schema("attendance")
            .from("attendance_records")
            .select(`
                *,
                exercise_types!attendance_records_exercise_type_id_fkey (
                    name
                )
            `)
            .eq("crew_id", crewId)
            .is("deleted_at", null)
            .gte(
                "attendance_timestamp",
                `${startDate}T00:00:00Z`,
            )
            .lte(
                "attendance_timestamp",
                `${endDate}T23:59:59Z`,
            )
            .order("attendance_timestamp", {
                ascending: false,
            });

        if (error) throw new Error("출석 데이터 조회 실패");

        // 유저 이름 조회 (attendance.users 에는 last_name 컬럼이 없음)
        const userIds = Array.from(
            new Set(
                (data || []).map((r: any) => r.user_id),
            ),
        );
        let userMap: Record<
            string,
            { first_name: string }
        > = {};
        if (userIds.length > 0) {
            const {
                data: usersData,
                error: usersError,
            } = await supabase
                .schema("attendance")
                .from("users")
                .select("id, first_name")
                .in("id", userIds);
            if (usersError) {
                console.error(
                    "[getMonthlyAttendance] users query failed:",
                    usersError,
                );
            }
            (usersData || []).forEach((u: any) => {
                userMap[u.id] = {
                    first_name:
                        u.first_name || "이름 없음",
                };
            });
        }

        return (data || []).map(
            (r: any): AttendanceRecordWithUser => ({
                id: r.id,
                user_id: r.user_id,
                crew_id: r.crew_id,
                attendance_timestamp:
                    r.attendance_timestamp,
                location: r.location,
                exercise_type_id: r.exercise_type_id,
                exercise_type_name:
                    r.exercise_types?.name || "기타",
                is_host: r.is_host,
                deleted_at: r.deleted_at,
                users: userMap[r.user_id] || {
                    first_name: "이름 없음",
                },
            }),
        );
    }
);

// 통계 분석 데이터 (서버 사이드, 병렬 쿼리)
export const getAnalyticsData = cache(
    async (crewId: string, year: number, month: number) => {
        const supabase = await createClient();
        const monthStr = month.toString().padStart(2, "0");
        const startDate = `${year}-${monthStr}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

        const [attendanceResult, membersResult] = await Promise.all([
            supabase
                .schema("attendance")
                .from("attendance_records")
                .select("location, attendance_timestamp, user_id")
                .eq("crew_id", crewId)
                .is("deleted_at", null)
                .gte("attendance_timestamp", `${startDate}T00:00:00Z`)
                .lte("attendance_timestamp", `${endDate}T23:59:59Z`),
            supabase
                .schema("attendance")
                .from("user_crews")
                .select("user_id", { count: "exact", head: false })
                .eq("crew_id", crewId),
        ]);

        if (attendanceResult.error)
            throw new Error("출석 데이터 조회 실패");
        if (membersResult.error) throw new Error("멤버 데이터 조회 실패");

        return {
            records: attendanceResult.data || [],
            totalMembers: membersResult.count || 0,
            memberIds: (membersResult.data || []).map(
                (m: { user_id: string }) => m.user_id
            ),
        };
    }
);

// 크루 설정 + 장소 데이터 (서버 사이드)
export const getCrewSettingsData = cache(async (crewId: string) => {
    const supabase = await createClient();

    const [crewResult, locationsResult] = await Promise.all([
        supabase
            .schema("attendance")
            .from("crews")
            .select("*")
            .eq("id", crewId)
            .single(),
        supabase
            .schema("attendance")
            .from("crew_locations")
            .select("*")
            .eq("crew_id", crewId)
            .order("created_at", { ascending: true }),
    ]);

    if (crewResult.error) throw new Error("크루 정보 조회 실패");

    return {
        crew: crewResult.data,
        locations: locationsResult.data || [],
    };
});

// 상세 분석용 확장 데이터 (유저 이름 + is_host 포함)
export interface AnalyticsDetailRecord {
    id: string;
    user_id: string;
    attendance_timestamp: string;
    location: string;
    is_host: boolean;
    user_name: string;
}

export const getAnalyticsDetailData = cache(
    async (
        crewId: string,
        year: number,
        month: number,
    ) => {
        const supabase = await createClient();
        const monthStr = month
            .toString()
            .padStart(2, "0");
        const startDate = `${year}-${monthStr}-01`;
        const lastDay = new Date(
            year,
            month,
            0,
        ).getDate();
        const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

        const [attendanceResult, membersResult] =
            await Promise.all([
                supabase
                    .schema("attendance")
                    .from("attendance_records")
                    .select(
                        "id, user_id, attendance_timestamp, location, is_host",
                    )
                    .eq("crew_id", crewId)
                    .is("deleted_at", null)
                    .gte(
                        "attendance_timestamp",
                        `${startDate}T00:00:00Z`,
                    )
                    .lte(
                        "attendance_timestamp",
                        `${endDate}T23:59:59Z`,
                    ),
                supabase
                    .schema("attendance")
                    .from("user_crews")
                    .select("user_id")
                    .eq("crew_id", crewId),
            ]);

        if (attendanceResult.error)
            throw new Error("출석 데이터 조회 실패");
        if (membersResult.error)
            throw new Error("멤버 데이터 조회 실패");

        // 유저 이름 조회
        const userIds = Array.from(
            new Set([
                ...(attendanceResult.data || []).map(
                    (r: any) => r.user_id,
                ),
                ...(membersResult.data || []).map(
                    (m: any) => m.user_id,
                ),
            ]),
        );
        const { data: usersData } = await supabase
            .schema("attendance")
            .from("users")
            .select("id, first_name")
            .in("id", userIds);

        const userMap: Record<string, string> = {};
        (usersData || []).forEach((u: any) => {
            userMap[u.id] =
                u.first_name || "이름 없음";
        });

        const records: AnalyticsDetailRecord[] = (
            attendanceResult.data || []
        ).map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            attendance_timestamp:
                r.attendance_timestamp,
            location: r.location || "기타",
            is_host: r.is_host || false,
            user_name:
                userMap[r.user_id] || "이름 없음",
        }));

        const memberIds = (
            membersResult.data || []
        ).map((m: any) => m.user_id);

        return {
            records,
            memberIds,
            totalMembers: memberIds.length,
            userMap,
        };
    },
);

// ── 유저 상세 ───────────────────────────────────
export interface CrewUserDetail {
    user: {
        id: string;
        first_name: string;
        email: string | null;
        phone: string | null;
        birth_year: number | null;
        created_at: string;
        join_date: string | null;
        status: string | null;
    };
    role: "owner" | "admin" | "member";
    attendance_count: number;
    last_attendance_date: string | null;
    hosted_count: number;
}

export const getCrewUserDetail = cache(
    async (
        crewId: string,
        userId: string,
    ): Promise<CrewUserDetail | null> => {
        const supabase = await createClient();

        // 1) 유저 기본정보
        const { data: userData } = await supabase
            .schema("attendance")
            .from("users")
            .select(
                "id, first_name, email, phone, birth_year, created_at, status",
            )
            .eq("id", userId)
            .maybeSingle();
        if (!userData) return null;

        // 2) user_crews: crew_role + joined_at + status
        const { data: membership } = await supabase
            .schema("attendance")
            .from("user_crews")
            .select("crew_role, joined_at, status")
            .eq("user_id", userId)
            .eq("crew_id", crewId)
            .maybeSingle();
        if (!membership) return null;

        // 3) attendance_records: 전체 출석 + 최근 + 개설 횟수
        const { data: attendance } = await supabase
            .schema("attendance")
            .from("attendance_records")
            .select("attendance_timestamp, is_host")
            .eq("user_id", userId)
            .eq("crew_id", crewId)
            .is("deleted_at", null)
            .order("attendance_timestamp", {
                ascending: false,
            });

        const rows = attendance || [];
        const attendance_count = rows.length;
        const last_attendance_date =
            rows[0]?.attendance_timestamp ?? null;
        const hosted_count = rows.filter(
            (r: { is_host: boolean }) => r.is_host === true,
        ).length;

        // crew_role 매핑 (대소문자 혼재, CREW_MANAGER → admin)
        const rawRole = (
            membership.crew_role || ""
        ).toUpperCase();
        const role: CrewUserDetail["role"] =
            rawRole === "OWNER"
                ? "owner"
                : rawRole === "CREW_MANAGER" ||
                    rawRole === "ADMIN"
                  ? "admin"
                  : "member";

        return {
            user: {
                id: userData.id,
                first_name: userData.first_name,
                email: userData.email,
                phone: userData.phone,
                birth_year: userData.birth_year,
                created_at: userData.created_at,
                join_date: membership.joined_at ?? null,
                status: membership.status ?? userData.status,
            },
            role,
            attendance_count,
            last_attendance_date,
            hosted_count,
        };
    },
);

