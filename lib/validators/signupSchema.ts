import { z } from "zod";

export const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "이름을 입력해주세요." })
    .max(50, { message: "이름은 50자 이내로 입력해주세요." }),
  email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
  birthYear: z.coerce
    .number({ invalid_type_error: "생년은 숫자여야 합니다." })
    .int({ message: "생년은 정수여야 합니다." })
    .min(1900, { message: "유효한 출생 연도를 입력해주세요." })
    .max(new Date().getFullYear(), {
      message: "유효한 출생 연도를 입력해주세요.",
    })
    .nullable()
    .optional(),
  verifiedCrewId: z
    .string()
    .uuid({ message: "인증된 크루 ID가 유효하지 않습니다." }),
  crewCode: z.string().min(1, { message: "크루 코드를 입력해야 합니다." }),
});

export type SignupFormData = z.infer<typeof signupSchema>;
