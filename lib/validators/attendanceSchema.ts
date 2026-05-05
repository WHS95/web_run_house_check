import { z } from "zod";

export const attendanceSubmissionSchema = z.object({
    userId: z.string().uuid({
        message: "유효한 사용자 ID가 필요합니다.",
    }),
    crewId: z.string().uuid({
        message: "유효한 크루 ID가 필요합니다.",
    }),
    // crew_locations.id는 SERIAL이므로 숫자,
    // "unregistered"는 미등록 장소 허용 시 사용
    locationId: z
        .string()
        .refine(
            (val) =>
                val === "unregistered"
                || /^[1-9]\d*$/.test(val),
            {
                message:
                    "유효한 장소 ID가 필요합니다.",
            },
        )
        .transform((val) =>
            val === "unregistered"
                ? val
                : parseInt(val, 10),
        ),
    // exercise_types.id는 SERIAL이므로 숫자입니다.
    exerciseTypeId: z
        .string()
        .refine(
            (val) => /^[1-9]\d*$/.test(val),
            {
                message:
                    "유효한 숫자 형식의 "
                    + "운동 종류 ID가 필요합니다.",
            },
        )
        .transform((val) => parseInt(val, 10)),
    isHost: z.boolean({
        required_error:
            "주최 여부 선택은 필수입니다.",
        invalid_type_error:
            "주최 여부는 true 또는 "
            + "false여야 합니다.",
    }),
    attendanceTimestamp: z.string().datetime({
        message:
            "유효한 ISO 8601 날짜 문자열 형식의 "
            + "출석 시간이 필요합니다.",
    }),
    // 감지 기반 출석: 디바이스 GPS 좌표 (옵션).
    // 좌표가 있으면 RPC가 클러스터링하여 sessions에 귀속시킨다.
    // 좌표가 없으면 (사용자 권한 거부 등) 출석은 기록되지만
    // session_id NULL로 들어가 운영진 보정 대상이 된다.
    capturedLat: z
        .number()
        .min(-90)
        .max(90)
        .optional()
        .nullable(),
    capturedLng: z
        .number()
        .min(-180)
        .max(180)
        .optional()
        .nullable(),
});

export type AttendanceSubmissionData = z.infer<
    typeof attendanceSubmissionSchema
>;
