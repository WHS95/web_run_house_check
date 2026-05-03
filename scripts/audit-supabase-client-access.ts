/**
 * scripts/audit-supabase-client-access.ts
 *
 * RLS 적용 영향 분석용. 코드베이스에서 Supabase 클라이언트가 직접
 * `attendance.<table>` 에 접근하는 모든 위치를 grep 한다.
 *
 * 출력 (콘솔 + docs/audits/supabase-client-access-<date>.md):
 *   - 🔴 admin (service_role) 사용처 — RLS 우회, BFF 경계 점검 대상
 *   - 🟡 browser-side 사용처 — RLS 정책 작성 시 영향 받음
 *   - 🟢 server-side 사용처 — RLS 적용 시 정책 통과 필요
 *
 * 사용:
 *   npx tsx scripts/audit-supabase-client-access.ts
 *   npx tsx scripts/audit-supabase-client-access.ts --table attendance_records
 */

import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { argv } from "node:process";
import { resolve } from "node:path";

interface Finding {
    file: string;
    line: number;
    snippet: string;
    table: string;
}

type BucketKey = "admin" | "browser" | "server";

interface Bucket {
    key: BucketKey;
    label: string;
    importPatterns: RegExp[];
    findings: Finding[];
}

const tableArg = argv.find((a) => a.startsWith("--table"))?.split("=")[1];

const TABLES = [
    "users", "user_crews", "user_roles", "roles",
    "attendance_records", "user_push_tokens", "password_reset_tokens",
    "notifications", "notices", "push_history",
    "crews", "crew_invite_codes", "crew_locations", "crew_grades",
    "crew_exercise_types", "exercise_types",
    "grades", "grade_promotion_logs", "invite_code_usage_logs",
];

const SEARCH_DIRS = ["app", "components", "hooks", "lib"];

const BUCKETS: Bucket[] = [
    {
        key: "admin",
        label: "🔴 admin (service_role) — RLS 우회",
        importPatterns: [/lib\/supabase\/admin/],
        findings: [],
    },
    {
        key: "browser",
        label: "🟡 browser (anon) — RLS 정책 적용 대상",
        importPatterns: [/lib\/supabase\/client/, /createBrowserClient/],
        findings: [],
    },
    {
        key: "server",
        label: "🟢 server (cookie auth)",
        importPatterns: [/lib\/supabase\/server/, /lib\/access\/user-context/],
        findings: [],
    },
];

function grepFromCalls(): Finding[] {
    const tableAlternation = tableArg ? tableArg : TABLES.join("|");
    // ERE: \.from\(['"](tbl1|tbl2)['"]\)
    const pattern = `\\.from\\(['"](${tableAlternation})['"]\\)`;
    const dirs = SEARCH_DIRS.filter((d) => existsSync(d));
    if (dirs.length === 0) return [];

    let out = "";
    try {
        out = execFileSync(
            "grep",
            [
                "-E",
                "-rn",
                "--include=*.ts",
                "--include=*.tsx",
                pattern,
                ...dirs,
            ],
            { encoding: "utf-8", maxBuffer: 4 * 1024 * 1024 }
        );
    } catch (e) {
        // grep 은 매치 0건 시 exit 1 → catch 로 빈 결과로 처리
        const err = e as { status?: number; stdout?: string };
        if (err.status === 1) return [];
        out = err.stdout ?? "";
    }

    const findings: Finding[] = [];
    const reLine = /^([^:]+):(\d+):(.*)$/;
    const reTable = new RegExp(`\\.from\\(['"](${tableAlternation})['"]\\)`);
    for (const line of out.split("\n")) {
        const m = reLine.exec(line);
        if (!m) continue;
        const tableMatch = reTable.exec(m[3]);
        findings.push({
            file: m[1],
            line: Number(m[2]),
            snippet: m[3].trim(),
            table: tableMatch?.[1] ?? "?",
        });
    }
    return findings;
}

const fileImportCache = new Map<string, BucketKey>();

function classifyFile(file: string): BucketKey {
    const cached = fileImportCache.get(file);
    if (cached) return cached;

    let head = "";
    try {
        const content = readFileSync(file, "utf-8");
        head = content.slice(0, 4000); // 첫 4KB 만 (import 영역)
    } catch {
        // 파일 읽기 실패는 server 로 분류
    }

    let bucket: BucketKey = "server";
    for (const b of BUCKETS) {
        if (b.importPatterns.some((re) => re.test(head))) {
            bucket = b.key;
            break;
        }
    }
    fileImportCache.set(file, bucket);
    return bucket;
}

function bucketByKey(key: BucketKey): Bucket {
    return BUCKETS.find((b) => b.key === key)!;
}

const allFindings = grepFromCalls();
for (const f of allFindings) {
    bucketByKey(classifyFile(f.file)).findings.push(f);
}

let report = `# Supabase 클라이언트 접근 인벤토리\n\n`;
report += `생성일: ${new Date().toISOString().slice(0, 10)}\n`;
report += `총 ${allFindings.length} 건${tableArg ? ` (table=${tableArg})` : ""}\n`;
for (const b of BUCKETS) {
    report += `\n---\n\n## ${b.label}  (${b.findings.length} 건)\n\n`;
    if (b.findings.length === 0) {
        report += "(없음)\n";
        continue;
    }
    const grouped = new Map<string, Finding[]>();
    for (const f of b.findings) {
        const arr = grouped.get(f.file) ?? [];
        arr.push(f);
        grouped.set(f.file, arr);
    }
    for (const [file, arr] of grouped) {
        report += `\n### \`${file}\`\n\n`;
        for (const f of arr) {
            report += `- L${f.line} (\`${f.table}\`): \`${f.snippet}\`\n`;
        }
    }
}

console.log(report);

const outDir = resolve(process.cwd(), "docs/audits");
mkdirSync(outDir, { recursive: true });
const date = new Date().toISOString().slice(0, 10);
const outPath = resolve(outDir, `supabase-client-access-${date}.md`);
writeFileSync(outPath, report, "utf-8");
console.error(`\n[audit] 저장: ${outPath}`);
