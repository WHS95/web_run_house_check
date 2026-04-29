import { describe, it, expect } from 'vitest';
import {
    위도_유효한가,
    경도_유효한가,
    좌표_유효한가,
} from './policies';

describe('location 정책', () => {
    describe('위도_유효한가', () => {
        it('정상 0 → true', () => {
            expect(위도_유효한가(0)).toBe(true);
        });
        it('경계 -90 → true', () => {
            expect(위도_유효한가(-90)).toBe(true);
        });
        it('경계 90 → true', () => {
            expect(위도_유효한가(90)).toBe(true);
        });
        it('-91 → false', () => {
            expect(위도_유효한가(-91)).toBe(false);
        });
        it('91 → false', () => {
            expect(위도_유효한가(91)).toBe(false);
        });
        it('NaN → false', () => {
            expect(위도_유효한가(NaN)).toBe(false);
        });
    });

    describe('경도_유효한가', () => {
        it('경계 -180/180 → true', () => {
            expect(경도_유효한가(-180)).toBe(true);
            expect(경도_유효한가(180)).toBe(true);
        });
        it('-181/181 → false', () => {
            expect(경도_유효한가(-181)).toBe(false);
            expect(경도_유효한가(181)).toBe(false);
        });
    });

    describe('좌표_유효한가', () => {
        it('서울 (37.5, 127) → true', () => {
            expect(좌표_유효한가(37.5, 127)).toBe(true);
        });
        it('한쪽 OOB → false', () => {
            expect(좌표_유효한가(95, 127)).toBe(false);
            expect(좌표_유효한가(37.5, -200)).toBe(false);
        });
    });
});
