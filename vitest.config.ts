import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: { '@': path.resolve(__dirname, '.') },
    },
    test: {
        environment: 'node',
        // 순수 함수 레이어만 단위 테스트 대상이다.
        // lib/domain = 비즈니스 룰, lib/motion = 인터랙션 물리
        include: [
            'lib/domain/**/*.test.ts',
            'lib/motion/**/*.test.ts',
        ],
        passWithNoTests: true,
        coverage: {
            provider: 'v8',
            // 커버리지 100% 는 lib/motion 에만 적용한다.
            // lib/domain 은 1:1 테스트 존재만 강제(check-domain-tests)하고
            // 비율 임계는 걸지 않는다 — 기존 19개 파일이 즉시 빌드를 깨뜨린다.
            include: ['lib/motion/**/*.ts'],
            exclude: ['**/*.test.ts', '**/types.ts'],
            thresholds: {
                lines: 100,
                functions: 100,
                branches: 100,
                statements: 100,
            },
        },
    },
});
