# Supabase 클라이언트 접근 인벤토리

생성일: 2026-05-03
총 189 건

---

## 🔴 admin (service_role) — RLS 우회  (7 건)


### `app/admin2/attendance/actions.ts`

- L206 (`crew_locations`): `.from('crew_locations')`
- L222 (`crew_exercise_types`): `.from('crew_exercise_types')`
- L247 (`attendance_records`): `.from('attendance_records')`
- L391 (`attendance_records`): `.from('attendance_records')`
- L476 (`attendance_records`): `.from('attendance_records')`

### `app/admin2/settings/locations/actions.ts`

- L26 (`crew_locations`): `.from('crew_locations')`

### `app/admin2/user/actions.ts`

- L127 (`user_crews`): `.from('user_crews')`

---

## 🟡 browser (anon) — RLS 정책 적용 대상  (7 건)


### `app/mypage/edit/page.tsx`

- L94 (`users`): `.from("users")`
- L176 (`users`): `.from("users")`
- L255 (`users`): `.from("users")`

### `app/admin2/crew-edit/components/CrewEditForm.tsx`

- L131 (`crews`): `.from("crews")`
- L189 (`crews`): `.from("crews")`

### `components/molecules/AttendanceEditModal.tsx`

- L137 (`crew_locations`): `.from("crew_locations")`

### `hooks/useAdminAuth.ts`

- L42 (`users`): `.from("users")`

---

## 🟢 server (cookie auth)  (175 건)


### `app/attendance/actions.ts`

- L88 (`crew_exercise_types`): `.from('crew_exercise_types')`
- L104 (`crews`): `.from('crews')`
- L134 (`crew_locations`): `.from('crew_locations')`
- L152 (`attendance_records`): `.from('attendance_records')`
- L178 (`users`): `.from('users')`

### `app/auth/signup/actions.ts`

- L52 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L140 (`users`): `.from('users')`
- L162 (`user_crews`): `.from('user_crews')`

### `app/auth/verify-crew/actions.ts`

- L42 (`users`): `.from('users')`
- L59 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L72 (`users`): `.from('users')`
- L103 (`invite_code_usage_logs`): `.from('invite_code_usage_logs')`
- L148 (`users`): `.from('users')`

### `app/auth/verify-crew/page.tsx`

- L24 (`users`): `.from("users")`

### `app/auth/callback/route.ts`

- L31 (`users`): `.from("users")`

### `app/mypage/actions.ts`

- L40 (`users`): `.from('users')`
- L190 (`user_push_tokens`): `.from('user_push_tokens')`
- L242 (`user_push_tokens`): `.from('user_push_tokens')`

### `app/map/actions.ts`

- L31 (`users`): `.from('users')`
- L46 (`crew_locations`): `.from('crew_locations')`

### `app/master/crews/_vm/list.ts`

- L51 (`crews`): `.from("crews")`
- L58 (`user_crews`): `.from("user_crews")`
- L62 (`attendance_records`): `.from("attendance_records")`

### `app/master/crews/[id]/invites/_vm/list.ts`

- L17 (`crew_invite_codes`): `.from("crew_invite_codes")`

### `app/master/actions.ts`

- L40 (`user_roles`): `.from('user_roles')`
- L69 (`crews`): `.from('crews')`
- L111 (`crews`): `.from('crews')`
- L134 (`crews`): `.from('crews')`
- L176 (`user_crews`): `.from('user_crews')`
- L229 (`user_crews`): `.from('user_crews')`
- L284 (`crews`): `.from('crews')`
- L308 (`crews`): `.from('crews')`
- L337 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L354 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L429 (`crews`): `.from('crews')`
- L454 (`crews`): `.from('crews')`
- L470 (`crews`): `.from('crews')`

### `app/master/invites/page.tsx`

- L20 (`crews`): `.from("crews")`

### `app/master/invite-codes/actions.ts`

- L52 (`user_roles`): `.from('user_roles')`
- L95 (`user_roles`): `.from('user_roles')`
- L126 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L169 (`crews`): `.from('crews')`
- L187 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L210 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L264 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L291 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L332 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L379 (`crew_invite_codes`): `.from('crew_invite_codes')`

### `app/menu/page.tsx`

- L64 (`user_roles`): `.from("user_roles")`

### `app/page.tsx`

- L77 (`users`): `.from("users")`
- L184 (`attendance_records`): `.from("attendance_records")`
- L199 (`notices`): `.from("notices")`

### `app/admin2/settings/grade/actions.ts`

- L43 (`crew_grades`): `.from('crew_grades')`
- L110 (`crew_grades`): `.from('crew_grades')`
- L188 (`crew_grades`): `.from('crew_grades')`
- L235 (`crew_grades`): `.from('crew_grades')`
- L285 (`user_crews`): `.from('user_crews')`
- L304 (`grade_promotion_logs`): `.from('grade_promotion_logs')`
- L368 (`user_crews`): `.from('user_crews')`
- L461 (`user_crews`): `.from('user_crews')`
- L480 (`grade_promotion_logs`): `.from('grade_promotion_logs')`
- L563 (`user_crews`): `.from('user_crews')`
- L581 (`grade_promotion_logs`): `.from('grade_promotion_logs')`

### `app/admin2/settings/members/actions.ts`

- L42 (`user_crews`): `.from('user_crews')`
- L120 (`user_crews`): `.from('user_crews')`
- L187 (`users`): `.from('users')`
- L194 (`user_crews`): `.from('user_crews')`

### `app/admin2/settings/invite-codes/actions.ts`

- L39 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L85 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L103 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L122 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L149 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L171 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L210 (`crew_invite_codes`): `.from('crew_invite_codes')`
- L231 (`crew_invite_codes`): `.from('crew_invite_codes')`

### `app/admin2/notice/actions.ts`

- L46 (`notices`): `.from('notices')`
- L108 (`notices`): `.from('notices')`
- L116 (`notices`): `.from('notices')`
- L167 (`notices`): `.from('notices')`
- L182 (`notices`): `.from('notices')`
- L223 (`notices`): `.from('notices')`
- L272 (`notices`): `.from('notices')`

### `app/admin2/notice/[id]/page.tsx`

- L48 (`notices`): `.from("notices")`

### `app/admin2/push/actions.ts`

- L50 (`push_history`): `.from('push_history')`
- L126 (`user_push_tokens`): `.from('user_push_tokens')`
- L161 (`push_history`): `.from('push_history')`

### `app/notifications/notice/[id]/page.tsx`

- L70 (`user_crews`): `.from("user_crews")`
- L81 (`notices`): `.from("notices")`

### `app/notifications/page.tsx`

- L53 (`user_crews`): `.from("user_crews")`
- L68 (`notices`): `.from("notices")`

### `lib/access/user-context.ts`

- L45 (`users`): `.from('users')`
- L63 (`user_crews`): `.from('user_crews')`

### `lib/supabase/crew-auth.ts`

- L37 (`crew_invite_codes`): `.from("crew_invite_codes")`
- L67 (`crew_invite_codes`): `.from("crew_invite_codes")`
- L133 (`users`): `.from("users")`
- L152 (`invite_code_usage_logs`): `.from("invite_code_usage_logs")`
- L185 (`users`): `.from("users")`

### `lib/supabase/admin.ts`

- L50 (`crews`): `.from("crews")`
- L88 (`crews`): `.from("crews")`
- L120 (`crews`): `.from("crews")`
- L149 (`crews`): `.from("crews")`
- L173 (`crew_invite_codes`): `.from("crew_invite_codes")`
- L224 (`crew_invite_codes`): `.from("crew_invite_codes")`
- L257 (`crew_invite_codes`): `.from("crew_invite_codes")`
- L302 (`user_crews`): `.from("user_crews")`
- L353 (`user_crews`): `.from("user_crews")`
- L375 (`invite_code_usage_logs`): `.from("invite_code_usage_logs")`
- L465 (`users`): `.from("users")`
- L497 (`attendance_records`): `.from("attendance_records")`
- L550 (`user_crews`): `.from("user_crews")`
- L587 (`users`): `.from("users")`
- L695 (`attendance_records`): `.from("attendance_records")`
- L758 (`attendance_records`): `.from("attendance_records")`
- L892 (`attendance_records`): `.from("attendance_records")`
- L932 (`attendance_records`): `.from("attendance_records")`
- L974 (`attendance_records`): `.from("attendance_records")`
- L1057 (`crew_locations`): `.from("crew_locations")`
- L1101 (`crew_locations`): `.from("crew_locations")`
- L1158 (`crew_locations`): `.from("crew_locations")`
- L1203 (`crew_locations`): `.from("crew_locations")`
- L1221 (`crew_locations`): `.from("crew_locations")`
- L1256 (`crews`): `.from("crews")`
- L1290 (`crew_exercise_types`): `.from("crew_exercise_types")`
- L1329 (`exercise_types`): `.from("exercise_types")`
- L1360 (`crew_exercise_types`): `.from("crew_exercise_types")`
- L1394 (`crew_exercise_types`): `.from("crew_exercise_types")`
- L1442 (`attendance_records`): `.from("attendance_records")`
- L1632 (`crews`): `.from("crews")`
- L1684 (`crews`): `.from("crews")`
- L1728 (`crews`): `.from("crews")`

### `lib/supabase/crew-auth-server.ts`

- L14 (`users`): `.from("users")`

### `lib/push/send-notification.ts`

- L36 (`user_push_tokens`): `.from("user_push_tokens")`
- L49 (`user_crews`): `.from("user_crews")`
- L85 (`notifications`): `.from("notifications")`
- L137 (`user_push_tokens`): `.from("user_push_tokens")`

### `lib/master/auth.ts`

- L36 (`user_roles`): `.from('user_roles')`
- L47 (`users`): `.from('users')`

### `lib/admin-auth.ts`

- L31 (`users`): `.from("users")`

### `lib/admin-stats.ts`

- L29 (`user_crews`): `.from("user_crews")`
- L63 (`attendance_records`): `.from("attendance_records")`
- L145 (`user_crews`): `.from("user_crews")`
- L172 (`user_crews`): `.from("user_crews")`
- L207 (`attendance_records`): `.from("attendance_records")`
- L278 (`attendance_records`): `.from("attendance_records")`
- L337 (`attendance_records`): `.from("attendance_records")`
- L385 (`attendance_records`): `.from("attendance_records")`
- L423 (`user_crews`): `.from("user_crews")`
- L441 (`attendance_records`): `.from("attendance_records")`
- L493 (`user_crews`): `.from("user_crews")`
- L511 (`attendance_records`): `.from("attendance_records")`
- L550 (`user_crews`): `.from("user_crews")`
- L568 (`attendance_records`): `.from("attendance_records")`
- L619 (`user_crews`): `.from("user_crews")`
- L637 (`attendance_records`): `.from("attendance_records")`

### `lib/admin2/queries.ts`

- L23 (`notices`): `.from("notices")`
- L79 (`attendance_records`): `.from("attendance_records")`
- L118 (`users`): `.from("users")`
- L168 (`attendance_records`): `.from("attendance_records")`
- L176 (`user_crews`): `.from("user_crews")`
- L202 (`crews`): `.from("crews")`
- L208 (`crew_locations`): `.from("crew_locations")`
- L254 (`attendance_records`): `.from("attendance_records")`
- L270 (`user_crews`): `.from("user_crews")`
- L293 (`users`): `.from("users")`
- L357 (`users`): `.from("users")`
- L368 (`user_crews`): `.from("user_crews")`
- L378 (`attendance_records`): `.from("attendance_records")`

### `lib/admin2/api-guard.ts`

- L50 (`users`): `.from("users")`
- L67 (`user_roles`): `.from("user_roles")`
- L73 (`user_crews`): `.from("user_crews")`

### `lib/admin2/action-auth.ts`

- L63 (`users`): `.from('users')`
- L84 (`user_roles`): `.from('user_roles')`
- L90 (`user_crews`): `.from('user_crews')`

### `lib/admin2/auth.ts`

- L26 (`user_roles`): `.from("user_roles")`
- L32 (`user_crews`): `.from("user_crews")`
