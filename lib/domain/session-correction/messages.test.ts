import { describe, it, expect } from 'vitest';
import { 세션종료_푸시조립, 보정_알림조립 } from './messages';

describe('세션종료_푸시조립', () => {
    it('라벨이 있으면 라벨을 제목에 사용', () => {
        const msg = 세션종료_푸시조립({ label: '한강 러닝', memberCount: 8 });
        expect(msg.title).toBe('한강 러닝 종료');
        expect(msg.body).toBe('8명 출석 완료');
    });

    it('라벨이 없으면 기본 "모임" 사용', () => {
        const msg = 세션종료_푸시조립({ label: null, memberCount: 3 });
        expect(msg.title).toBe('모임 종료');
    });

    it('빈 문자열 라벨도 기본값으로 대체', () => {
        const msg = 세션종료_푸시조립({ label: '   ', memberCount: 1 });
        expect(msg.title).toBe('모임 종료');
    });
});

describe('보정_알림조립', () => {
    it('add 알림 메시지', () => {
        const msg = 보정_알림조립({ action: 'add', sessionLabel: '한강' });
        expect(msg.title).toBe('출석 추가');
        expect(msg.body).toContain('한강');
    });

    it('remove 알림 메시지', () => {
        const msg = 보정_알림조립({ action: 'remove', sessionLabel: null });
        expect(msg.title).toBe('출석 제거');
        expect(msg.body).toContain('모임');
    });
});
