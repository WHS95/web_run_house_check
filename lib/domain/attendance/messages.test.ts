import { describe, it, expect } from 'vitest';
import { 알림메시지_조립 } from './messages';

describe('알림메시지_조립', () => {
    // KST 21:00 = UTC 12:00
    const ts = '2026-04-28T12:00:00.000Z';

    it('birthYear가 있으면 (YY) 접미를 단다', () => {
        expect(
            알림메시지_조립({
                userName: '홍길동',
                birthYear: 1990,
                timestamp: ts,
                locationName: '한강',
            })
        ).toBe('홍길동(90)님이 21:00분 한강에 출석을 하였습니다.');
    });

    it('birthYear가 없으면 이름만 붙인다', () => {
        expect(
            알림메시지_조립({
                userName: '홍길동',
                birthYear: null,
                timestamp: ts,
                locationName: '한강',
            })
        ).toBe('홍길동님이 21:00분 한강에 출석을 하였습니다.');
    });

    it('userName이 null이면 "회원"으로 폴백', () => {
        expect(
            알림메시지_조립({
                userName: null,
                birthYear: null,
                timestamp: ts,
                locationName: '한강',
            })
        ).toBe('회원님이 21:00분 한강에 출석을 하였습니다.');
    });

    it('birthYear=2003 → (03) 접미', () => {
        expect(
            알림메시지_조립({
                userName: '김철수',
                birthYear: 2003,
                timestamp: ts,
                locationName: '잠실',
            })
        ).toBe('김철수(03)님이 21:00분 잠실에 출석을 하였습니다.');
    });
});
