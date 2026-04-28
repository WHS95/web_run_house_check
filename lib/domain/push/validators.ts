import { z } from 'zod';

/**
 * 푸시 토큰 등록 입력 스키마.
 */
export const pushTokenRegisterSchema = z.object({
    token: z.string().min(1, { message: '토큰이 필요합니다.' }),
    crewId: z.string().uuid({ message: '유효한 크루 ID가 필요합니다.' }),
});

export type PushTokenRegisterInput = z.infer<typeof pushTokenRegisterSchema>;

/**
 * 푸시 토큰 비활성화 입력 스키마.
 */
export const pushTokenDeactivateSchema = z.object({
    token: z.string().min(1, { message: '토큰이 필요합니다.' }),
});

export type PushTokenDeactivateInput = z.infer<typeof pushTokenDeactivateSchema>;
