// scripts/seed/reset-test-users.ts
/**
 * dev 환경 시드된 테스트 크루/유저를 깔끔하게 제거한다.
 *
 * 운영 프로젝트로 실수 실행 시 즉시 abort.
 *
 * 실행: npm run seed:reset
 */

import { createClient } from "@supabase/supabase-js";
import { PROD_PROJECT_REF, TEST_CREW, TEST_USERS } from "./fixtures";

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다."
        );
    }
    if (url.includes(PROD_PROJECT_REF)) {
        throw new Error("[abort] 운영 프로젝트엔 reset 금지");
    }

    const db = createClient(url, key, {
        db: { schema: "attendance" },
        auth: { persistSession: false },
    });
    const auth = createClient(url, key, {
        auth: { persistSession: false },
    });

    console.log(`[reset] target = ${url}`);

    // ── 1) 테스트 유저들의 verified_crew_id 해제 후 attendance.users 제거 ──
    //    (FK가 있을 경우를 대비해 user_crews/auth user 삭제 전에 정리)
    const { data: list } = await auth.auth.admin.listUsers();
    const targets =
        list?.users.filter((u) =>
            TEST_USERS.some((t) => t.email === u.email)
        ) ?? [];

    // ── 2) 크루 종속 데이터 정리 ────────────────────────
    const { data: crew } = await db
        .from("crews")
        .select("id")
        .eq("name", TEST_CREW.name)
        .maybeSingle();

    if (crew?.id) {
        await db.from("attendance_records").delete().eq("crew_id", crew.id);
        await db.from("user_crews").delete().eq("crew_id", crew.id);
        await db.from("crew_grades").delete().eq("crew_id", crew.id);
        await db.from("crew_locations").delete().eq("crew_id", crew.id);

        // verified_crew_id가 이 크루를 가리키면 nullify (FK 보호)
        for (const u of targets) {
            await db
                .from("users")
                .update({ verified_crew_id: null, is_crew_verified: false })
                .eq("id", u.id);
        }

        await db.from("crews").delete().eq("id", crew.id);
        console.log("[reset] 크루 삭제 완료");
    } else {
        console.log("[reset] 테스트 크루 없음 (skip)");
    }

    // ── 3) 유저 삭제 ──────────────────────────────────
    for (const u of TEST_USERS) {
        const target = targets.find((x) => x.email === u.email);
        if (target) {
            await db.from("users").delete().eq("id", target.id);
            await auth.auth.admin.deleteUser(target.id);
            console.log(`[reset] 유저 삭제: ${u.email}`);
        }
    }
    console.log("[reset] 완료");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
