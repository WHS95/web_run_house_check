import { z } from "zod";

// 휴대폰 번호 포맷팅 함수
export const formatPhoneNumber = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, "");

  // 길이에 따라 단계적으로 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  } else {
    // 11자리를 초과하면 11자리까지만 사용
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11
    )}`;
  }
};

// 휴대폰 번호 검증 함수
const validatePhoneNumber = (value: string): boolean => {
  const numbers = value.replace(/[^\d]/g, "");
  return numbers.length === 11 && numbers.startsWith("010");
};

export const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "이름을 입력해주세요." })
    .max(50, { message: "이름은 50자 이내로 입력해주세요." }),
  email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
  phoneNumber: z
    .string()
    .min(1, { message: "휴대폰 번호를 입력해주세요." })
    .refine(validatePhoneNumber, {
      message: "010으로 시작하는 11자리 휴대폰 번호를 입력해주세요.",
    }),
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
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "개인정보 수집·이용에 동의해주세요.",
  }),
  termsOfService: z.boolean().refine((val) => val === true, {
    message: "서비스 이용약관에 동의해주세요.",
  }),
});

export type SignupFormData = z.infer<typeof signupSchema>;
