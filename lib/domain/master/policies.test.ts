import { describe, it, expect } from 'vitest';
import {
    마스터_권한인가,
    유효한_크루역할인가,
    유효한_크루이름인가,
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
});
