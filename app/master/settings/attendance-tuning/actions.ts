'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { 마스터_권한_보장 } from '@/lib/master/auth';
import { SystemSettingsSchema } from '@/lib/domain/system-settings/validators';
import type { SystemSettingsInput } from '@/lib/domain/system-settings/validators';

export interface UpdateAttendanceTuningResult {
    success: boolean;
    message: string;
}

/**
 * 마스터 출석 튜닝 값 일괄 업데이트.
 *
 * - 마스터 권한 보장 (실패 시 redirect)
 * - Zod 검증 통과 후 4개 키를 한 번에 update
 * - settings_history 트리거가 자동으로 변경 이력 기록
 */
export async function updateAttendanceTuningAction(
    input: unknown,
): Promise<UpdateAttendanceTuningResult> {
    const ctx = await 마스터_권한_보장();

    const parsed = SystemSettingsSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            message: '입력값이 올바르지 않습니다. 범위를 확인하세요.',
        };
    }

    const supabase = await createClient();
    const data: SystemSettingsInput = parsed.data;
    const updatedAt = new Date().toISOString();

    for (const [key, value] of Object.entries(data)) {
        const { error } = await supabase
            .schema('attendance')
            .from('system_settings')
            .update({
                value,
                updated_by: ctx.userId,
                updated_at: updatedAt,
            })
            .eq('key', key);
        if (error) {
            return {
                success: false,
                message: `${key} 저장 실패: ${error.message}`,
            };
        }
    }

    revalidatePath('/master/settings/attendance-tuning');
    return {
        success: true,
        message: '저장되었습니다.',
    };
}
