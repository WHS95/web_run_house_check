// scripts/seed/test-users.ts
/**
 * dev 환경에 테스트 유저/크루를 시드한다.
 *
 * 멱등(idempotent): 이미 존재하는 유저/크루는 건너뛰고 누락된 매핑만 채운다.
 * 운영 프로젝트로 실수 실행 시 즉시 abort.
 *
 * 실행: npm run seed:test
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
    PROD_PROJECT_REF,
    TEST_CREW,
    TEST_LOCATION,
    TEST_PASSWORD,
    TEST_USERS,
    type TestUserFixture,
} from "./fixtures";

function assertDevProject(url: string) {
    if (url.includes(PROD_PROJECT_REF)) {
        throw new Error(
            `[abort] 운영 프로젝트(${PROD_PROJECT_REF})에는 시드를 실행할 수 없습니다. ` +
                `.env.local의 NEXT_PUBLIC_SUPABASE_URL을 dev 프로젝트로 바꾸세요.`
        );
    }
}

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다."
        );
    }
    assertDevProject(url);

    // attendance 스키마 전용 클라이언트
    const supabase = createClient(url, serviceKey, {
        db: { schema: "attendance" },
        auth: { persistSession: false },
    });
    // auth admin / public 스키마용 클라이언트
    const adminAuth = createClient(url, serviceKey, {
        auth: { persistSession: false },
    });

    console.log(`[seed] target = ${url}`);

    // ── 1) 테스트 크루 보장 ─────────────────────────────
    const { data: existingCrew, error: crewSelErr } = await supabase
        .from("crews")
        .select("id")
        .eq("name", TEST_CREW.name)
        .maybeSingle();
    if (crewSelErr) throw crewSelErr;

    let crewId: string | undefined = existingCrew?.id;
    if (!crewId) {
        const { data, error } = await supabase
            .from("crews")
            .insert(TEST_CREW)
            .select("id")
            .single();
        if (error) throw error;
        crewId = data.id;
        console.log(`[seed] 크루 생성: ${TEST_CREW.name} (${crewId})`);
    } else {
        console.log(`[seed] 크루 존재: ${TEST_CREW.name} (${crewId})`);
    }

    // ── 2) 테스트 모임 장소 보장 ────────────────────────
    const { data: existingLoc } = await supabase
        .from("crew_locations")
        .select("id")
        .eq("crew_id", crewId)
        .eq("name", TEST_LOCATION.name)
        .maybeSingle();
    if (!existingLoc) {
        const { error } = await supabase.from("crew_locations").insert({
            ...TEST_LOCATION,
            crew_id: crewId,
            is_active: true,
        });
        if (error) {
            console.warn(`[seed] 모임 장소 생성 실패 (skip):`, error.message);
        } else {
            console.log(`[seed] 모임 장소 생성: ${TEST_LOCATION.name}`);
        }
    } else {
        console.log(`[seed] 모임 장소 존재: ${TEST_LOCATION.name}`);
    }

    // ── 3) crew_grades 1개 보장(기본 등급) ──────────────
    // grades 테이블이 비어 있을 수 있으므로 base grade도 자동 생성한다.
    const baseGradeId = await ensureBaseGrade(supabase);
    const defaultGradeId = await ensureCrewGrade(supabase, crewId, baseGradeId);

    // ── 4) 각 유저 시드 ───────────────────────────────
    for (const u of TEST_USERS) {
        await seedUser(adminAuth, supabase, u, crewId, defaultGradeId);
    }

    console.log("[seed] 완료 ✅");
    console.log(`[seed] 비밀번호 (전체 공통): ${TEST_PASSWORD}`);
}

/** attendance.grades에 기본 grade 1개 보장. id 반환. */
async function ensureBaseGrade(db: SupabaseClient): Promise<number> {
    const { data: existing, error: selErr } = await db
        .from("grades")
        .select("id")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (selErr) throw selErr;
    if (existing?.id) return existing.id as number;

    const { data, error } = await db
        .from("grades")
        .insert({
            name: "기본",
            description: "dev seed 기본 등급",
            min_score: 0,
        })
        .select("id")
        .single();
    if (error) throw error;
    console.log(`[seed] grade 생성: id=${data.id}`);
    return data.id as number;
}

/** crew에 기본 crew_grade 1개 보장. id 반환. */
async function ensureCrewGrade(
    db: SupabaseClient,
    crewId: string,
    baseGradeId: number
): Promise<number> {
    // (crew_id, grade_id) UNIQUE — baseGradeId 기준으로 조회
    const { data: existing, error: selErr } = await db
        .from("crew_grades")
        .select("id")
        .eq("crew_id", crewId)
        .eq("grade_id", baseGradeId)
        .maybeSingle();
    if (selErr) throw selErr;
    if (existing?.id) return existing.id as number;

    const { data, error } = await db
        .from("crew_grades")
        .insert({
            crew_id: crewId,
            grade_id: baseGradeId,
            name_override: "기본등급",
            sort_order: 0,
            can_host: true,
            is_active: true,
            min_score: 0,
        })
        .select("id")
        .single();
    if (error) throw error;
    console.log(`[seed] crew_grade 생성: id=${data.id}`);
    return data.id as number;
}

async function seedUser(
    adminAuth: SupabaseClient,
    db: SupabaseClient,
    fixture: TestUserFixture,
    crewId: string,
    defaultGradeId: number
) {
    // (a) auth.users 생성 또는 조회
    const { data: list, error: listErr } =
        await adminAuth.auth.admin.listUsers();
    if (listErr) throw listErr;
    let authUser = list?.users.find((u) => u.email === fixture.email);
    if (!authUser) {
        const { data, error } = await adminAuth.auth.admin.createUser({
            email: fixture.email,
            password: TEST_PASSWORD,
            email_confirm: true,
            user_metadata: { provider: "dev-seed" },
        });
        if (error) throw error;
        authUser = data.user!;
        console.log(`  + auth user 생성: ${fixture.email}`);
    } else {
        console.log(`  = auth user 존재: ${fixture.email}`);
    }

    const userId = authUser.id;
    const nowIso = new Date().toISOString();

    // (b) attendance.users upsert
    const { error: userErr } = await db.from("users").upsert(
        {
            id: userId,
            email: fixture.email,
            first_name: fixture.first_name,
            username: fixture.username,
            birth_year: fixture.birth_year,
            verified_crew_id: crewId,
            is_crew_verified: true,
            status: "active",
            privacy_consent_agreed: true,
            privacy_consent_agreed_at: nowIso,
            terms_of_service_agreed: true,
            terms_of_service_agreed_at: nowIso,
            password_hash: "dev-seed-placeholder",
        },
        { onConflict: "id" }
    );
    if (userErr) throw userErr;

    // (c) attendance.user_crews upsert
    const { error: ucErr } = await db.from("user_crews").upsert(
        {
            user_id: userId,
            crew_id: crewId,
            crew_role: fixture.crew_role,
            crew_grade_id: defaultGradeId,
            status: "ACTIVE",
        },
        { onConflict: "user_id,crew_id" }
    );
    if (ucErr) throw ucErr;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
