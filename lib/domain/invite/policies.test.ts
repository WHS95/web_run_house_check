import { describe, it, expect } from 'vitest';
import {
    커스텀코드_유효한가,
    어드민코드_생성,
    마스터코드_생성,
} from './policies';

describe('invite 정책', () => {
    describe('커스텀코드_유효한가', () => {
        it('정상 7자리 → true', () => {
            expect(커스텀코드_유효한가('ABCDE12')).toBe(true);
        });
        it('소문자 포함 → false', () => {
            expect(커스텀코드_유효한가('Abcde12')).toBe(false);
        });
        it('6자리 → false', () => {
            expect(커스텀코드_유효한가('ABCDE1')).toBe(false);
        });
        it('8자리 → false', () => {
            expect(커스텀코드_유효한가('ABCDE123')).toBe(false);
        });
        it('특수문자 → false', () => {
            expect(커스텀코드_유효한가('ABCDE-1')).toBe(false);
        });
    });

    describe('어드민코드_생성', () => {
        it('7자리 영문대문자/숫자', () => {
            const code = 어드민코드_생성();
            expect(code).toHaveLength(7);
            expect(/^[A-Z0-9]{7}$/.test(code)).toBe(true);
        });
    });

    describe('마스터코드_생성', () => {
        it('7자리 영문 대소문자', () => {
            const code = 마스터코드_생성();
            expect(code).toHaveLength(7);
            expect(/^[A-Za-z]{7}$/.test(code)).toBe(true);
        });
    });
});
