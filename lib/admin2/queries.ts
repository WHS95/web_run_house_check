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
    is_host: boolean;
    deleted_at: string | null;
    users: { first_name: string; last_name: string | null };
}

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
            .select("*")
            .eq("crew_id", crewId)
            .is("deleted_at", null)
            .gte("attendance_timestamp", `${startDate}T00:00:00Z`)
            .lte("attendance_timestamp", `${endDate}T23:59:59Z`)
            .order("attendance_timestamp", { ascending: false });

        if (error) throw new Error("출석 데이터 조회 실패");

        // 유저 이름 조회
        const userIds = Array.from(
            new Set((data || []).map((r: any) => r.user_id))
        );
        const { data: usersData } = await supabase
            .schema("attendance")
            .from("users")
            .select("id, first_name, last_name")
            .in("id", userIds);

        const userMap: Record<
            string,
            { first_name: string; last_name: string | null }
        > = {};
        (usersData || []).forEach((u: any) => {
            userMap[u.id] = {
                first_name: u.first_name,
                last_name: u.last_name,
            };
        });

        return (data || []).map((r: any): AttendanceRecordWithUser => ({
            id: r.id,
            user_id: r.user_id,
            crew_id: r.crew_id,
            attendance_timestamp: r.attendance_timestamp,
            location: r.location,
            exercise_type_id: r.exercise_type_id,
            is_host: r.is_host,
            deleted_at: r.deleted_at,
            users: userMap[r.user_id] || {
                first_name: "이름 없음",
                last_name: null,
            },
        }));
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
