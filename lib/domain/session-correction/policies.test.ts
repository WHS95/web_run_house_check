import { describe, it, expect } from 'vitest';
import {
    보정가능한가,
    라벨변경_가능한가,
    세션삭제_가능한가,
} from './policies';

describe('보정가능한가', () => {
    it('운영진은 종료된 세션도 보정 가능', () => {
        expect(보정가능한가({ isAdmin: true, sessionEnded: true })).toBe(true);
    });

    it('운영진은 진행 중인 세션도 보정 가능', () => {
        expect(보정가능한가({ isAdmin: true, sessionEnded: false })).toBe(
            true,
        );
    });

    it('일반 멤버는 보정 불가', () => {
        expect(보정가능한가({ isAdmin: false, sessionEnded: false })).toBe(
            false,
        );
    });
});

describe('라벨변경_가능한가', () => {
    it('운영진은 일반 라벨 변경 가능', () => {
        expect(라벨변경_가능한가({ isAdmin: true, label: '한강 러닝' })).toBe(
            true,
        );
    });

    it('일반 멤버는 변경 불가', () => {
        expect(라벨변경_가능한가({ isAdmin: false, label: '한강 러닝' })).toBe(
            false,
        );
    });

    it('빈 라벨은 거부', () => {
        expect(라벨변경_가능한가({ isAdmin: true, label: '   ' })).toBe(false);
    });

    it('50자 초과 라벨은 거부', () => {
        const long = 'a'.repeat(51);
        expect(라벨변경_가능한가({ isAdmin: true, label: long })).toBe(false);
    });
});

describe('세션삭제_가능한가', () => {
    const now = new Date('2026-05-05T10:00:00Z');

    it('운영진은 최근 세션 삭제 가능', () => {
        const startedAt = new Date('2026-05-04T10:00:00Z');
        expect(세션삭제_가능한가({ isAdmin: true, startedAt, now })).toBe(
            true,
        );
    });

    it('운영진이라도 30일 초과 세션은 삭제 불가', () => {
        const startedAt = new Date('2026-04-01T10:00:00Z'); // 약 34일 전
        expect(세션삭제_가능한가({ isAdmin: true, startedAt, now })).toBe(
            false,
        );
    });

    it('일반 멤버는 삭제 불가', () => {
        const startedAt = new Date('2026-05-04T10:00:00Z');
        expect(세션삭제_가능한가({ isAdmin: false, startedAt, now })).toBe(
            false,
        );
    });
});
