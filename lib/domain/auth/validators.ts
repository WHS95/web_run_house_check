// 기존 signupSchema 도메인 노출 (re-export). Phase B 끝나면 본체 도메인으로 이동.
export { signupSchema } from '@/lib/validators/signupSchema';
export type { SignupFormData } from '@/lib/validators/signupSchema';

import { z } from 'zod';

/**
 * /api/auth/verify-crew-code 입력 검증.
 */
export const verifyCrewCodeSchema = z.object({
    crewCode: z.string().min(1, { message: '크루 코드를 입력해주세요.' }),
});

export type VerifyCrewCodeInput = z.infer<typeof verifyCrewCodeSchema>;

/**
 * /api/crew-verification POST 입력 검증.
 */
export const crewVerificationSchema = z.object({
    inviteCode: z.string().min(1, { message: '초대 코드가 필요합니다.' }),
});

export type CrewVerificationInput = z.infer<typeof crewVerificationSchema>;
