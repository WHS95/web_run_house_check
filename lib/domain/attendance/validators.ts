// 점진 폐지: lib/validators/attendanceSchema.ts는 deprecated.
// 새 import는 본 모듈을 통해서 받는다. Phase A 끝나면 본체를 도메인으로 이동 + reverse re-export.
export {
    attendanceSubmissionSchema,
} from '@/lib/validators/attendanceSchema';

export type {
    AttendanceSubmissionData,
} from '@/lib/validators/attendanceSchema';
