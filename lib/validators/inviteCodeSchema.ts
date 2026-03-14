import { z } from "zod";

// InviteCode Zod 스키마
export const InviteCodeSchema = z.object({
  id: z.number(),
  crew_id: z.string(),
  invite_code: z.string().min(1, "초대코드는 필수입니다"),
  description: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const InviteCodeFormSchema = z.object({
  description: z.string().optional(),
  invite_code: z.string().min(1, "초대코드는 필수입니다").optional(), // 자동생성 가능
});

export type InviteCode = z.infer<typeof InviteCodeSchema>;
export type InviteCodeForm = z.infer<typeof InviteCodeFormSchema>;

// 상태 관리를 위한 스키마
export const InviteCodeStateSchema = z.object({
  inviteCodes: z.array(InviteCodeSchema),
  selectedInviteCode: InviteCodeSchema.nullable(),
  loading: z.boolean(),
  error: z.string().nullable(),
  isModalOpen: z.boolean(),
  editingCode: InviteCodeSchema.nullable(),
});

export type InviteCodeState = z.infer<typeof InviteCodeStateSchema>;

// 액션 타입들
export const InviteCodeActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SET_INVITE_CODES"),
    payload: z.array(InviteCodeSchema),
  }),
  z.object({
    type: z.literal("ADD_INVITE_CODE"),
    payload: InviteCodeSchema,
  }),
  z.object({
    type: z.literal("UPDATE_INVITE_CODE"),
    payload: InviteCodeSchema,
  }),
  z.object({
    type: z.literal("DELETE_INVITE_CODE"),
    payload: z.number(), // invite code id
  }),
  z.object({
    type: z.literal("SET_SELECTED_INVITE_CODE"),
    payload: InviteCodeSchema.nullable(),
  }),
  z.object({
    type: z.literal("SET_LOADING"),
    payload: z.boolean(),
  }),
  z.object({
    type: z.literal("SET_ERROR"),
    payload: z.string().nullable(),
  }),
  z.object({
    type: z.literal("SET_MODAL_OPEN"),
    payload: z.boolean(),
  }),
  z.object({
    type: z.literal("SET_EDITING_CODE"),
    payload: InviteCodeSchema.nullable(),
  }),
]);

export type InviteCodeAction = z.infer<typeof InviteCodeActionSchema>;