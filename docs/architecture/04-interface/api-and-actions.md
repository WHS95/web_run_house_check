---
IEEE 42010 역할: Interface Viewpoint (인터페이스 관점 카탈로그)
Viewpoint: 서비스 경계 — HTTP 라우트 + Server Action 규약
이해관계자: 플랫폼 개발자, 통합 담당자, QA/BFF 규약 검증(check:bff)
근거: 아키텍처 맵 §7, app/**/actions.ts, app/api/**, lib/admin2, lib/domain
---

# 인터페이스 카탈로그 — API 라우트 & Server Actions

RunHouse는 **API 라우트 신규 추가 금지** 정책을 따른다(`scripts/check-bff.ts`가
`npm run build`에서 강제, 위반 시 빌드 차단). 새 서버 로직은 반드시 route별
`actions.ts`의 Server Action(`'use server'`)으로 작성한다.

인증 요건 표기:
- **없음** — 공개/연결성 체크
- **Auth** — Supabase Auth 세션 필요(`auth.getUser`)
- **Auth+Verified** — Auth + `is_crew_verified` (크루 인증) 필요
- **Admin(owner/admin)** — `assertAdminAction` 통과(운영진 권한)
- **Master(role_id=1)** — `마스터_권한_보장` / SECURITY DEFINER role_id=1 가드

---

## 1. HTTP API 라우트 (3개, 신규 추가 금지)

| 경로 | 메서드 | 파일 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|---|---|
| `/api/ping` | GET / HEAD | `app/api/ping/route.ts` | 없음 | 연결성 응답 | 없음 | `no-store`, `force-dynamic` |
| `/api/dev/login` | POST | `app/api/dev/login/route.ts` | 개발용 로그인 파라미터 | 세션 | 없음(dev 전용) | service_role magiclink+verifyOtp, **production 403** |
| `/auth/callback` | GET | `app/auth/callback/route.ts` | 카카오 OAuth code | 리다이렉트 | 없음(OAuth 진행) | 미들웨어 특별 bypass |

---

## 2. Server Actions

### 2.1 출석 (`app/attendance/actions.ts`)

| 액션 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|
| `submitAttendance` | `input: unknown` (attendanceSubmissionSchema) | `Promise<AttendanceSubmitResult>` | Auth+Verified | 서버측 userId 재검증, 화이트리스트 재검증, 2h 윈도우, 푸시+PostHog(waitUntil), `revalidatePath('/attendance')` |

### 2.2 인증/가입 (`app/auth/*/actions.ts`)

| 액션 | 파일 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|---|
| `verifyCrewCodeAction` | signup | 초대코드 | `AuthActionResult<T>` | 없음 | rate limit 10/min/IP, `초대코드_유효한가` |
| `signupAction` | signup | signupSchema payload | `AuthActionResult<T>` | Auth(OAuth 후) | rate limit 5/min/IP, users+user_crews upsert, `increment_crew_invite_code_used_count` RPC |
| `verifyCrewMembershipAction` | verify-crew | 초대코드 | `AuthActionResult<T>` | Auth | 중복 인증 차단, `upsert_user_crew` RPC, 감사 로그(IP/UA) |
| `getCrewVerificationStatusAction` | verify-crew | 없음 | `AuthActionResult<T>` | Auth | 크루 인증 상태 조회 |

### 2.3 랭킹 / 마이페이지 / 지도

| 액션 | 파일 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|---|
| `fetchRankingData` | `app/ranking/actions.ts` | 조회 파라미터 | 랭킹 데이터 | Auth+Verified | `get_ranking_data_unified` RPC |
| `getUserStatusAction` | `app/mypage/actions.ts` | 없음 | 사용자 상태 | Auth | — |
| `withdrawUserAction` | `app/mypage/actions.ts` | 없음 | 결과 | Auth | `withdraw_user` RPC |
| `registerPushTokenAction` | `app/mypage/actions.ts` | FCM 토큰 | 결과 | Auth | user_push_tokens 등록 |
| `deactivatePushTokenAction` | `app/mypage/actions.ts` | 토큰 | 결과 | Auth | 토큰 비활성화 |
| `getCrewLocationsAction` | `app/map/actions.ts` | crewId | 장소 목록 | Auth+Verified | crew_locations |

### 2.4 마스터 (`app/master/actions.ts`)

| 액션 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|
| `getCrewsAction` | 없음/필터 | 크루 목록 | Master | — |
| `createCrewAction` | 크루 정보 | 생성 결과 | Master | — |
| `getCrewMembersAction` | crewId | 멤버 목록 | Master | — |
| `updateCrewMemberRoleAction` | userId, crewId, role | 결과 | Master | crew_role 변경 |
| `createCrewWithFirstAdminCodeAction` | 크루 정보 | 크루 + 첫 관리자 코드 | Master | `is_first_admin_code` 발급 |
| `updateCrewAction` | crewId, 변경 필드 | 결과 | Master | — |

### 2.5 admin2 루트 & 출석 관리

| 액션 | 파일 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|---|
| `getAdminCrewUsersAction` | `app/admin2/actions.ts` | 없음 | 멤버 목록 | Admin | — |
| `getAdminAttendanceAction` | admin2/attendance | 조회 파라미터 | 출석 목록 | Admin | — |
| `createBulkAttendanceAction` | admin2/attendance | 대량 출석 payload | 결과 | Admin | 대량 등록 |
| `getDailyAttendanceAction` | admin2/attendance | 날짜 | 일별 출석 | Admin | — |
| `deleteAttendanceAction` | admin2/attendance | attendanceId | 결과 | Admin | soft delete(`deleted_at`) |
| `updateAttendanceAction` | admin2/attendance | attendanceId, 필드 | 결과 | Admin | — |

### 2.6 admin2 공지 / 푸시

| 액션 | 파일 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|---|
| `getCrewNoticesAction` | admin2/notice | 없음 | 공지 목록 | Admin | — |
| `createNoticeAction` | admin2/notice | 공지 내용 | 결과 | Admin | — |
| `deleteNoticeAction` | admin2/notice | noticeId | 결과 | Admin | — |
| `getNoticeByIdAction` | admin2/notice | noticeId | 공지 | Admin | — |
| `pushNoticeAction` | admin2/notice | noticeId | 결과 | Admin | 공지 푸시 발송 |
| `getPushHistoryAction` | admin2/push | 없음 | push_history | Admin | — |
| `sendTestPushAction` | admin2/push | 메시지 | 결과 | Admin | 테스트 푸시 |

### 2.7 admin2 설정 (`app/admin2/settings/**`)

| 액션 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|
| `getCrewSettingsBundleAction` | 없음 | 설정 번들 | Admin | — |
| `toggleLocationBasedAttendanceAction` | bool | 결과 | Admin | crews.location_based_attendance |
| `updateAccuracyRangeAction` | 반경(m) | 결과 | Admin | crews.accuracy_range |
| `updateAllowUnregisteredLocationAction` | bool | 결과 | Admin | crews.allow_unregistered_location |
| (sub) grade / locations / members / invite-codes actions | 각 도메인 payload | 결과 | Admin | 등급/장소/멤버/초대코드 관리 |

### 2.8 master 초대코드 (`app/master/invite-codes/**`)

| 액션 | 입력 | 출력 | 인증 | 비고 |
|---|---|---|---|---|
| `getMasterInviteCodesAction` | 없음 | 코드 목록 | Master | — |
| `createMasterInviteCodeAction` | 코드 설정 | 결과 | Master | `마스터코드_생성`(대소문자 7자) |
| `updateMasterInviteCodeAction` | id, 필드 | 결과 | Master | — |
| `deactivateMasterInviteCodeAction` | id | 결과 | Master | `is_active` off |

---

## 3. Supabase RPC (Server Action에서 호출)

쓰기/트랜잭션: `upsert_user_crew`, `withdraw_user`, `increment_crew_invite_code_used_count`, `calculate_grade_recommendations`.

조회 통합(라운드트립 최소화): `get_admin_stats`, `get_admin_users_unified`, `get_attendance_form_data`, `get_home_page_data`, `get_current_month_stats`, `get_specific_month_stats`, `get_mypage_data_unified`, `get_ranking_data_unified`, `get_user_activity_statistics`, `get_recent_active_meet`.

마스터 전용(SECURITY DEFINER + role_id=1 가드, `authenticated`만 EXECUTE): `get_master_dashboard_kpis`, `get_master_crew_overview`, `get_master_crew_activity`, `get_master_crews_overview`, `get_master_crew_detail`.

---

## 4. 규약 참고
- **BFF 4계층**: page.tsx(페치+VM) / actions.ts(auth→도메인→write→revalidate) / lib/domain(순수 함수) / Supabase RLS(2차 방어). ESLint 7룰 + `check:bff` + `check:domain-tests`가 빌드에서 강제.
- **캐시**: page.tsx에서 `revalidatePath`/`revalidateTag` import 금지(ESLint error). 재검증은 actions.ts에서만.
- **인증 강제 지점**: 루트 `middleware.ts` 부재 — 실질 접근제어는 RSC 가드(`getAdminAuth`, `마스터_권한_보장`) + Server Action 가드(`assertAdminAction`, 서버측 userId 재검증) + Supabase RLS.

## 관련 문서
- 런타임 흐름: [../03-process/sequences.md](../03-process/sequences.md)
