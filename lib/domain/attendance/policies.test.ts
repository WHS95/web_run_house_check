import { describe, it, expect } from 'vitest';
import * as 출석정책 from './policies';

describe('출석 정책', () => {
    describe('유효한가 (KST 기준 +2시간 윈도우)', () => {
        // 현재 시각을 UTC 2026-04-28T12:00:00 (= KST 21:00)로 고정
        const now = new Date('2026-04-28T12:00:00.000Z');

        it('30분 전 출석은 유효', () => {
            expect(
                출석정책.유효한가(now, '2026-04-28T11:30:00.000Z')
            ).toBe(true);
        });

        it('현재 시각 출석은 유효', () => {
            expect(
                출석정책.유효한가(now, '2026-04-28T12:00:00.000Z')
            ).toBe(true);
        });

        it('+2시간 경계는 유효', () => {
            expect(
                출석정책.유효한가(now, '2026-04-28T14:00:00.000Z')
            ).toBe(true);
        });

        it('+2시간 1분 초과는 거부', () => {
            expect(
                출석정책.유효한가(now, '2026-04-28T14:01:00.000Z')
            ).toBe(false);
        });
    });

    describe('미등록허용', () => {
        it('allow_unregistered_location=true면 허용', () => {
            expect(
                출석정책.미등록허용({ allow_unregistered_location: true })
            ).toBe(true);
        });

        it('allow_unregistered_location=false면 거부', () => {
            expect(
                출석정책.미등록허용({ allow_unregistered_location: false })
            ).toBe(false);
        });
    });
});
