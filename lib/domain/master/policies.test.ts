import { describe, it, expect } from 'vitest';
import {
    마스터_권한인가,
    유효한_크루역할인가,
    유효한_크루이름인가,
    유효한_지역인가,
    유효한_설명인가,
    유효한_정확도범위인가,
} from './policies';

describe('master 정책', () => {
    describe('마스터_권한인가', () => {
        it('role_id=1 → true', () => {
            expect(마스터_권한인가({ role_id: 1 })).toBe(true);
        });
        it('role_id=2 → false', () => {
            expect(마스터_권한인가({ role_id: 2 })).toBe(false);
        });
        it('null → false', () => {
            expect(마스터_권한인가(null)).toBe(false);
        });
        it('undefined → false', () => {
            expect(마스터_권한인가(undefined)).toBe(false);
        });
    });

    describe('유효한_크루역할인가', () => {
        it('CREW_MANAGER → true', () => {
            expect(유효한_크루역할인가('CREW_MANAGER')).toBe(true);
        });
        it('MEMBER → true', () => {
            expect(유효한_크루역할인가('MEMBER')).toBe(true);
        });
        it('OWNER → false', () => {
            expect(유효한_크루역할인가('OWNER')).toBe(false);
        });
        it('빈 문자열 → false', () => {
            expect(유효한_크루역할인가('')).toBe(false);
        });
    });

    describe('유효한_크루이름인가', () => {
        it('정상 문자열 → true', () => {
            expect(유효한_크루이름인가('한강 러닝')).toBe(true);
        });
        it('공백만 → false', () => {
            expect(유효한_크루이름인가('   ')).toBe(false);
        });
        it('빈 문자열 → false', () => {
            expect(유효한_크루이름인가('')).toBe(false);
        });
        it('null → false', () => {
            expect(유효한_크루이름인가(null)).toBe(false);
        });
    });

    describe('유효한_지역인가', () => {
        it('정상 문자열 → true', () => {
            expect(유효한_지역인가('서울')).toBe(true);
        });
        it('50자 경계 → true', () => {
            expect(유효한_지역인가('가'.repeat(50))).toBe(true);
        });
        it('51자 초과 → false', () => {
            expect(유효한_지역인가('가'.repeat(51))).toBe(false);
        });
        it('공백만 → false', () => {
            expect(유효한_지역인가('   ')).toBe(false);
        });
        it('빈 문자열 → false', () => {
            expect(유효한_지역인가('')).toBe(false);
        });
        it('null → false', () => {
            expect(유효한_지역인가(null)).toBe(false);
        });
    });

    describe('유효한_설명인가', () => {
        it('정상 설명 → true', () => {
            expect(유효한_설명인가('한강에서 함께 달리는 러닝 크루')).toBe(true);
        });
        it('빈 문자열 → true (허용)', () => {
            expect(유효한_설명인가('')).toBe(true);
        });
        it('null → true (허용)', () => {
            expect(유효한_설명인가(null)).toBe(true);
        });
        it('undefined → true (허용)', () => {
            expect(유효한_설명인가(undefined)).toBe(true);
        });
        it('1000자 경계 → true', () => {
            expect(유효한_설명인가('가'.repeat(1000))).toBe(true);
        });
        it('1001자 초과 → false', () => {
            expect(유효한_설명인가('가'.repeat(1001))).toBe(false);
        });
        it('숫자 → false', () => {
            expect(유효한_설명인가(123)).toBe(false);
        });
    });

    describe('유효한_정확도범위인가', () => {
        it('100m → true', () => {
            expect(유효한_정확도범위인가(100)).toBe(true);
        });
        it('5000m 경계 → true', () => {
            expect(유효한_정확도범위인가(5000)).toBe(true);
        });
        it('5001m → false', () => {
            expect(유효한_정확도범위인가(5001)).toBe(false);
        });
        it('0 → false', () => {
            expect(유효한_정확도범위인가(0)).toBe(false);
        });
        it('음수 → false', () => {
            expect(유효한_정확도범위인가(-10)).toBe(false);
        });
        it('NaN → false', () => {
            expect(유효한_정확도범위인가(NaN)).toBe(false);
        });
        it('Infinity → false', () => {
            expect(유효한_정확도범위인가(Infinity)).toBe(false);
        });
        it('문자열 → false', () => {
            expect(유효한_정확도범위인가('100')).toBe(false);
        });
        it('null → false', () => {
            expect(유효한_정확도범위인가(null)).toBe(false);
        });
    });
});
