import { describe, it, expect } from 'vitest';
import { 사용자_활성여부_판정 } from './policies';

const baseUser = { status: 'active', suspension_reason: null };
const baseCrew = { status: 'active', suspension_reason: null };

describe('사용자 활성여부 판정', () => {
    it('user/crew 모두 active면 isActive=true', () => {
        const v = 사용자_활성여부_판정({ user: baseUser, userCrew: baseCrew });
        expect(v.isActive).toBe(true);
        expect(v.userStatus).toBe('active');
        expect(v.crewStatus).toBe('active');
    });

    it('user.status=suspended → isActive=false + 정지 메시지', () => {
        const v = 사용자_활성여부_판정({
            user: { status: 'suspended', suspension_reason: '규정 위반' },
            userCrew: baseCrew,
        });
        expect(v.isActive).toBe(false);
        expect(v.statusMessage).toBe('계정이 정지된 상태입니다.');
        expect(v.suspensionReason).toBe('규정 위반');
    });

    it('user.status=suspended + suspension_reason=null → 기본 안내', () => {
        const v = 사용자_활성여부_판정({
            user: { status: 'suspended', suspension_reason: null },
            userCrew: baseCrew,
        });
        expect(v.suspensionReason).toBe('운영진에게 문의바랍니다.');
    });

    it('user.status=inactive → 비활성화 메시지', () => {
        const v = 사용자_활성여부_판정({
            user: { status: 'inactive', suspension_reason: null },
            userCrew: baseCrew,
        });
        expect(v.isActive).toBe(false);
        expect(v.statusMessage).toBe('계정이 비활성화된 상태입니다.');
    });

    it('user active + crew suspended → 크루 정지 메시지', () => {
        const v = 사용자_활성여부_판정({
            user: baseUser,
            userCrew: { status: 'suspended', suspension_reason: '크루 정책' },
        });
        expect(v.isActive).toBe(false);
        expect(v.statusMessage).toBe('크루 내 활동이 정지된 상태입니다.');
        expect(v.suspensionReason).toBe('크루 정책');
    });

    it('user active + crew inactive → 크루 비활성', () => {
        const v = 사용자_활성여부_판정({
            user: baseUser,
            userCrew: { status: 'inactive', suspension_reason: null },
        });
        expect(v.statusMessage).toBe('크루 내 활동이 비활성화된 상태입니다.');
    });

    it('user active + crew withdrawn → 탈퇴 메시지', () => {
        const v = 사용자_활성여부_판정({
            user: baseUser,
            userCrew: { status: 'withdrawn', suspension_reason: null },
        });
        expect(v.statusMessage).toBe('크루에서 탈퇴된 상태입니다.');
    });

    it('user suspended가 crew suspended보다 우선', () => {
        const v = 사용자_활성여부_판정({
            user: { status: 'suspended', suspension_reason: '계정 사유' },
            userCrew: { status: 'suspended', suspension_reason: '크루 사유' },
        });
        expect(v.statusMessage).toBe('계정이 정지된 상태입니다.');
        expect(v.suspensionReason).toBe('계정 사유');
    });

    it('userCrew=null이면 user 상태만 보고 active 판정', () => {
        const v = 사용자_활성여부_판정({ user: baseUser, userCrew: null });
        expect(v.isActive).toBe(true);
    });
});
