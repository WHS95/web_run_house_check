import { z } from 'zod';
import {
    유효한_크루이름인가,
    유효한_지역인가,
    유효한_설명인가,
    유효한_정확도범위인가,
} from './policies';
import type { CreateCrewInput, UpdateCrewInput } from './types';

export type ValidationResult<T> =
    | { ok: true; data: T }
    | { ok: false; field: string; message: string };

const createCrewSchema = z.object({
    name: z.unknown(),
    description: z.unknown().optional(),
    region: z.unknown().optional(),
    generate_first_admin_code: z.boolean().optional(),
});

const updateCrewSchema = z.object({
    name: z.unknown().optional(),
    description: z.unknown().optional(),
    region: z.unknown().optional(),
    location_based_attendance: z.boolean().optional(),
    accuracy_range: z.unknown().optional(),
    allow_unregistered_location: z.boolean().optional(),
});

/**
 * 크루 생성 입력 검증 — trim, 빈 문자열 → null 변환, policies 사용.
 */
export function 크루생성입력_검증(input: unknown): ValidationResult<CreateCrewInput> {
    const parsed = createCrewSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, field: 'input', message: '잘못된 입력 형식입니다.' };
    }
    const raw = parsed.data;

    if (!유효한_크루이름인가(raw.name)) {
        return { ok: false, field: 'name', message: '크루 이름이 유효하지 않습니다.' };
    }
    const name = (raw.name as string).trim();

    const description = normalizeOptionalString(raw.description);
    if (description !== null && !유효한_설명인가(description)) {
        return {
            ok: false,
            field: 'description',
            message: '설명은 1000자 이내여야 합니다.',
        };
    }

    const region = normalizeOptionalString(raw.region);
    if (region !== null && !유효한_지역인가(region)) {
        return {
            ok: false,
            field: 'region',
            message: '지역은 1~50자여야 합니다.',
        };
    }

    return {
        ok: true,
        data: {
            name,
            description,
            region,
            generate_first_admin_code: raw.generate_first_admin_code,
        },
    };
}

/**
 * 크루 수정 입력 검증 — 부분 업데이트.
 */
export function 크루수정입력_검증(input: unknown): ValidationResult<UpdateCrewInput> {
    const parsed = updateCrewSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, field: 'input', message: '잘못된 입력 형식입니다.' };
    }
    const raw = parsed.data;
    const result: UpdateCrewInput = {};

    if (raw.name !== undefined) {
        if (!유효한_크루이름인가(raw.name)) {
            return { ok: false, field: 'name', message: '크루 이름이 유효하지 않습니다.' };
        }
        result.name = (raw.name as string).trim();
    }

    if (raw.description !== undefined) {
        const description = normalizeOptionalString(raw.description);
        if (description !== null && !유효한_설명인가(description)) {
            return {
                ok: false,
                field: 'description',
                message: '설명은 1000자 이내여야 합니다.',
            };
        }
        result.description = description;
    }

    if (raw.region !== undefined) {
        const region = normalizeOptionalString(raw.region);
        if (region !== null && !유효한_지역인가(region)) {
            return {
                ok: false,
                field: 'region',
                message: '지역은 1~50자여야 합니다.',
            };
        }
        result.region = region;
    }

    if (raw.location_based_attendance !== undefined) {
        result.location_based_attendance = raw.location_based_attendance;
    }

    if (raw.accuracy_range !== undefined) {
        if (raw.accuracy_range === null) {
            result.accuracy_range = null;
        } else if (유효한_정확도범위인가(raw.accuracy_range)) {
            result.accuracy_range = raw.accuracy_range as number;
        } else {
            return {
                ok: false,
                field: 'accuracy_range',
                message: '정확도 범위는 0보다 크고 5000m 이하여야 합니다.',
            };
        }
    }

    if (raw.allow_unregistered_location !== undefined) {
        result.allow_unregistered_location = raw.allow_unregistered_location;
    }

    return { ok: true, data: result };
}

function normalizeOptionalString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
}
