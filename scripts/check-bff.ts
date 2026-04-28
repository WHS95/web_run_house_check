import { execSync } from 'node:child_process';

function getBaseRef(): string | null {
    for (const ref of ['origin/main', 'main']) {
        try {
            execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' });
            return ref;
        } catch {
            continue;
        }
    }
    return null;
}

function getCommittedAdditions(base: string): string[] {
    try {
        const out = execSync(
            `git diff --name-only --diff-filter=A ${base}...HEAD`,
            { encoding: 'utf8' }
        );
        return out.split('\n').filter(Boolean);
    } catch {
        return [];
    }
}

function getUntrackedFiles(): string[] {
    try {
        const out = execSync(
            'git ls-files --others --exclude-standard app/api/',
            { encoding: 'utf8' }
        );
        return out.split('\n').filter(Boolean);
    } catch {
        return [];
    }
}

function isViolation(p: string): boolean {
    return p.startsWith('app/api/') && !p.startsWith('app/api/dev/');
}

const base = getBaseRef();
const candidates: string[] = [];

if (base) {
    candidates.push(...getCommittedAdditions(base));
} else {
    console.log(
        '[check-bff] base ref(main) 없음 — 커밋 diff 검사는 skip (fail-open)'
    );
}

candidates.push(...getUntrackedFiles());

const violations = Array.from(new Set(candidates)).filter(isViolation);

if (violations.length > 0) {
    console.error(
        '[check-bff] app/api/ 신규 파일 추가 금지 (BFF 룰 C). 신규 mutation은 actions.ts에 작성하세요:'
    );
    violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
}

console.log('[check-bff] OK: app/api/ 신규 추가 없음');
