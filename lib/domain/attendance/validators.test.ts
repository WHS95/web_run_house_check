import { describe, it, expect } from 'vitest';
import { attendanceSubmissionSchema } from './validators';

describe('attendanceSubmissionSchema (re-export)', () => {
    it('정상 입력은 parse 성공', () => {
        const result = attendanceSubmissionSchema.safeParse({
            userId: '00000000-0000-0000-0000-000000000001',
            crewId: '00000000-0000-0000-0000-000000000002',
            locationId: '5',
            exerciseTypeId: '1',
            isHost: false,
            attendanceTimestamp: '2026-04-28T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
    });

    it('locationId="unregistered"는 parse 성공 + 그대로 보존', () => {
        const result = attendanceSubmissionSchema.safeParse({
            userId: '00000000-0000-0000-0000-000000000001',
            crewId: '00000000-0000-0000-0000-000000000002',
            locationId: 'unregistered',
            exerciseTypeId: '1',
            isHost: true,
            attendanceTimestamp: '2026-04-28T12:00:00.000Z',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.locationId).toBe('unregistered');
        }
    });

    it('잘못된 locationId(="0")는 parse 실패', () => {
        const result = attendanceSubmissionSchema.safeParse({
            userId: '00000000-0000-0000-0000-000000000001',
            crewId: '00000000-0000-0000-0000-000000000002',
            locationId: '0',
            exerciseTypeId: '1',
            isHost: false,
            attendanceTimestamp: '2026-04-28T12:00:00.000Z',
        });
        expect(result.success).toBe(false);
    });
});
