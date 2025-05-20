import { z } from "zod";

export const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: "이름을 입력해주세요." }),
    email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
    password: z
      .string()
      .min(8, { message: "비밀번호는 최소 8자 이상이어야 합니다." })
      .regex(/[a-zA-Z]/, { message: "비밀번호는 영문자를 포함해야 합니다." })
      .regex(/[0-9]/, { message: "비밀번호는 숫자를 포함해야 합니다." })
      .regex(/[^a-zA-Z0-9]/, {
        message: "비밀번호는 특수문자를 포함해야 합니다.",
      }),
    confirmPassword: z.string(),
    birthYear: z.string().optional().nullable(),
    phone: z
      .string()
      .regex(/^\d{3}-\d{3,4}-\d{4}$/, {
        message: "유효한 전화번호 형식을 입력해주세요. (예: 010-1234-5678)",
      })
      .optional()
      .or(z.literal(""))
      .nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"], // 오류 메시지를 confirmPassword 필드에 표시
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
