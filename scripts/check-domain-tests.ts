import { readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

// 순수 함수 레이어 — 각 .ts 는 1:1 로 *.test.ts 를 가져야 한다.
// lib/domain  = 비즈니스 룰, lib/motion = 인터랙션 물리
const PURE_ROOTS = [
    path.resolve(__dirname, '..', 'lib', 'domain'),
    path.resolve(__dirname, '..', 'lib', 'motion'),
];
const SKIP = new Set(['types.ts', 'index.ts']);

function walk(dir: string): string[] {
    if (!existsSync(dir)) return [];
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) {
            out.push(...walk(full));
        } else if (
            name.endsWith('.ts') &&
            !name.endsWith('.test.ts') &&
            !SKIP.has(name)
        ) {
            out.push(full);
        }
    }
    return out;
}

const files = PURE_ROOTS.flatMap(walk);
const missing = files.filter((f) => {
    const testPath = f.replace(/\.ts$/, '.test.ts');
    return !existsSync(testPath);
});

if (missing.length > 0) {
    console.error(
        '[check-domain-tests] 도메인 파일에 대응하는 *.test.ts가 없습니다:'
    );
    missing.forEach((m) =>
        console.error(`  - ${path.relative(process.cwd(), m)}`)
    );
    process.exit(1);
}

console.log(
    `[check-domain-tests] OK: ${files.length}개 순수 함수 파일 모두 테스트 보유`
);
