/**
 * scripts/check-rls.ts
 *
 * 회귀 방지 CI 게이트: `attendance` 스키마의 모든 테이블에 RLS 가
 * ENABLE 되어 있는지 검사. 새 테이블 추가 시 RLS 누락을 빌드 타임에 차단.
 *
 * 동작
 *   - service_role 키로 attendance.__check_rls_status__() RPC 호출
 *   - RLS off 인 테이블이 RLS_OFF_ALLOWED 화이트리스트에 없으면 exit 1
 *
 * 환경변수
 *   - NEXT_PUBLIC_SUPABASE_URL (필수)
 *   - SUPABASE_SERVICE_ROLE_KEY (필수)
 *   둘 중 하나라도 없으면 검사 스킵 (로컬 개발 환경 보호용)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

// RLS off 가 허용되는 테이블 (현재: 비어있음 = 모든 테이블 RLS ON 강제)
const RLS_OFF_ALLOWED: ReadonlySet<string> = new Set([]);

interface RlsStatus {
    table_name: string;
    rls_enabled: boolean;
    policy_count: number;
}

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        console.warn(
            "[check-rls] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정 — 스킵"
        );
        return;
    }

    const supabase = createClient(url, serviceKey, {
        auth: { persistSession: false },
        db: { schema: "attendance" as never },
    });

    const { data, error } = await supabase.rpc("__check_rls_status__");

    if (error) {
        console.error("[check-rls] RPC 호출 실패:", error.message);
        process.exit(1);
    }

    const rows = (data ?? []) as RlsStatus[];
    if (rows.length === 0) {
        console.error("[check-rls] attendance 스키마에 테이블이 없습니다 (확인 필요)");
        process.exit(1);
    }

    const violations: RlsStatus[] = [];
    const noPolicy: RlsStatus[] = [];

    for (const r of rows) {
        if (!r.rls_enabled && !RLS_OFF_ALLOWED.has(r.table_name)) {
            violations.push(r);
        }
        // RLS on but 0 policies = deny-all 의도일 수도 있음. 화이트리스트로 관리.
        if (r.rls_enabled && r.policy_count === 0) {
            noPolicy.push(r);
        }
    }

    if (violations.length > 0) {
        console.error(
            `[check-rls] ❌ ${violations.length} 개 테이블이 RLS off 입니다. 화이트리스트에 추가하거나 RLS ENABLE 하세요.`
        );
        for (const v of violations) {
            console.error(`  - ${v.table_name}`);
        }
        process.exit(1);
    }

    if (noPolicy.length > 0) {
        // 정책 0 = 의도적 deny-all 일 수 있어 경고만
        const expected = new Set(["password_reset_tokens"]);
        const unexpected = noPolicy.filter((r) => !expected.has(r.table_name));
        if (unexpected.length > 0) {
            console.warn(
                `[check-rls] ⚠️  RLS on 이지만 정책 0개 (의도적 deny-all 인지 확인):`
            );
            for (const v of unexpected) {
                console.warn(`  - ${v.table_name}`);
            }
        }
    }

    console.log(
        `[check-rls] ✅ ${rows.length} 개 테이블 모두 RLS ENABLE (정책 ${rows.reduce(
            (s, r) => s + r.policy_count,
            0
        )} 개)`
    );
}

main().catch((err) => {
    console.error("[check-rls] 실패:", err);
    process.exit(1);
});
