import { z } from "zod";

// Zod 스키마 정의
export const CrewLocationSchema = z.object({
  id: z.number(),
  crew_id: z.string(),
  name: z.string().min(1, "장소 이름은 필수입니다"),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  allowed_radius: z.number().min(30).max(500).default(50),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CrewLocationFormSchema = z.object({
  name: z.string().min(1, "장소 이름은 필수입니다"),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  allowed_radius: z.number().min(30).max(500).default(50),
});

export const CrewLocationCreateSchema = z.object({
  crew_id: z.string(),
  name: z.string().min(1, "장소 이름은 필수입니다"),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  allowed_radius: z.number().min(30).max(500).default(50),
});

export const CrewLocationUpdateSchema = z.object({
  name: z.string().min(1, "장소 이름은 필수입니다").optional(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  is_active: z.boolean().optional(),
  allowed_radius: z.number().min(30).max(500).optional(),
});

// Zod 기반 타입 추론
export type CrewLocation = z.infer<typeof CrewLocationSchema>;
export type CrewLocationForm = z.infer<typeof CrewLocationFormSchema>;
export type CrewLocationCreate = z.infer<typeof CrewLocationCreateSchema>;
export type CrewLocationUpdate = z.infer<typeof CrewLocationUpdateSchema>;

// 상태 관리를 위한 스키마
export const CrewLocationStateSchema = z.object({
  locations: z.array(CrewLocationSchema),
  selectedLocation: CrewLocationSchema.nullable(),
  loading: z.boolean(),
  error: z.string().nullable(),
});

export type CrewLocationState = z.infer<typeof CrewLocationStateSchema>;

// 액션 타입들
export const CrewLocationActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SET_LOCATIONS"),
    payload: z.array(CrewLocationSchema),
  }),
  z.object({
    type: z.literal("ADD_LOCATION"),
    payload: CrewLocationSchema,
  }),
  z.object({
    type: z.literal("UPDATE_LOCATION"),
    payload: CrewLocationSchema,
  }),
  z.object({
    type: z.literal("DELETE_LOCATION"),
    payload: z.number(), // location id
  }),
  z.object({
    type: z.literal("SET_SELECTED_LOCATION"),
    payload: CrewLocationSchema.nullable(),
  }),
  z.object({
    type: z.literal("SET_LOADING"),
    payload: z.boolean(),
  }),
  z.object({
    type: z.literal("SET_ERROR"),
    payload: z.string().nullable(),
  }),
]);

export type CrewLocationAction = z.infer<typeof CrewLocationActionSchema>;