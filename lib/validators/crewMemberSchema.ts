import { z } from "zod";

// CrewMember Zod 스키마
export const CrewMemberSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  is_admin: z.boolean(),
  is_crew_verified: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  attendance_count: z.number().optional(),
  total_sessions: z.number().optional(),
  attendance_rate: z.number().optional(),
  last_attendance_date: z.string().nullable().optional(),
});

export type CrewMember = z.infer<typeof CrewMemberSchema>;

// 상태 관리를 위한 스키마
export const CrewMemberStateSchema = z.object({
  members: z.array(CrewMemberSchema),
  selectedMember: CrewMemberSchema.nullable(),
  loading: z.boolean(),
  error: z.string().nullable(),
  searchTerm: z.string(),
  sortBy: z.enum(["name", "attendance_rate", "last_attendance", "created_at"]),
  sortOrder: z.enum(["asc", "desc"]),
});

export type CrewMemberState = z.infer<typeof CrewMemberStateSchema>;

// 액션 타입들
export const CrewMemberActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SET_MEMBERS"),
    payload: z.array(CrewMemberSchema),
  }),
  z.object({
    type: z.literal("UPDATE_MEMBER"),
    payload: CrewMemberSchema,
  }),
  z.object({
    type: z.literal("REMOVE_MEMBER"),
    payload: z.string(), // member id
  }),
  z.object({
    type: z.literal("SET_SELECTED_MEMBER"),
    payload: CrewMemberSchema.nullable(),
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
    type: z.literal("SET_SEARCH_TERM"),
    payload: z.string(),
  }),
  z.object({
    type: z.literal("SET_SORT"),
    payload: z.object({
      sortBy: z.enum(["name", "attendance_rate", "last_attendance", "created_at"]),
      sortOrder: z.enum(["asc", "desc"]),
    }),
  }),
]);

export type CrewMemberAction = z.infer<typeof CrewMemberActionSchema>;