import { describe, it, expect } from 'vitest';
import {
    pushTokenRegisterSchema,
    pushTokenDeactivateSchema,
} from './validators';

describe('push token validators', () => {
    describe('pushTokenRegisterSchema', () => {
        it('정상 입력 → success', () => {
            const r = pushTokenRegisterSchema.safeParse({
                token: 'fcm-token-1',
                crewId: '00000000-0000-0000-0000-000000000001',
            });
            expect(r.success).toBe(true);
        });

        it('token 누락 → 실패', () => {
            const r = pushTokenRegisterSchema.safeParse({
                token: '',
                crewId: '00000000-0000-0000-0000-000000000001',
            });
            expect(r.success).toBe(false);
        });

        it('crewId 비-UUID → 실패', () => {
            const r = pushTokenRegisterSchema.safeParse({
                token: 'fcm-token-1',
                crewId: 'not-a-uuid',
            });
            expect(r.success).toBe(false);
        });
    });

    describe('pushTokenDeactivateSchema', () => {
        it('token 정상 → success', () => {
            const r = pushTokenDeactivateSchema.safeParse({ token: 'x' });
            expect(r.success).toBe(true);
        });
        it('token 빈문자 → 실패', () => {
            const r = pushTokenDeactivateSchema.safeParse({ token: '' });
            expect(r.success).toBe(false);
        });
    });
});
