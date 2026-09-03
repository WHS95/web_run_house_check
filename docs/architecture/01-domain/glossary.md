---
IEEE 42010 역할: Viewpoint (Domain / Ubiquitous Language)
이해관계자: 크루 멤버, 크루 운영진, 마스터 관리자, 신규 가입자, 개발자/QA
목적: RunHouse 도메인 용어의 한글 정의와 코드/DB 상 표현을 1:1로 고정한다.
---

# 도메인 용어집 (Glossary)

RunHouse(런하우스)는 러닝크루의 출석/크루 관리 PWA다. 회사 코어 미션은 러닝크루 운영진의 출석 관리를 도와 커스텀 러닝 의류 구매로 연결하는 것이며, 아래 용어들은 그 도메인을 표현한다. 모든 DB 표현은 Supabase `attendance` 스키마 기준이다.

## 핵심 개체(Entity) 용어

| 한글 용어 | 정의 | 코드/DB 표현 |
|---|---|---|
| 크루(Crew) | 러닝 커뮤니티의 기본 단위. 출석·멤버·정책의 소유 경계 | `attendance.crews` / `crews.id` |
| 크루 멤버십 | 사용자와 크루의 N:M 소속 관계 | `attendance.user_crews` (PK: user_id, crew_id) |
| 사용자(User) | Supabase Auth 사용자 = 프로필. `users.id === auth uid` | `attendance.users` |
| 출석 기록 | 특정 시각·장소·운동종류로 남긴 출석 1건 | `attendance.attendance_records` |
| 초대코드 | 크루 가입/인증용 7자리 코드 | `attendance.crew_invite_codes.invite_code` |
| 크루 등록 장소 | 크루가 사전 등록한 출석 가능 장소 | `attendance.crew_locations` (`is_active`) |
| 운동종류 | 출석 시 선택하는 운동 유형. 크루별 화이트리스트 | `exercise_types` / `crew_exercise_types` |
| 등급(Grade) | 크루별 멤버 등급 체계 | `grades`(마스터) / `crew_grades`(크루 오버라이드) |
| 공지(Notice) | 크루 운영진이 발행하는 공지 | `attendance.notices` |
| 알림(Notification) | 개인에게 전달된 알림 히스토리 | `attendance.notifications` |
| FCM 토큰 | 웹푸시 발송 대상 단말 토큰 | `attendance.user_push_tokens` |

## 상태/속성(State) 용어

| 한글 용어 | 정의 | 코드/DB 표현 |
|---|---|---|
| 크루 인증(is_crew_verified) | 초대코드로 특정 크루 소속을 증명한 상태 = 2단계 인증의 2단계 | `users.is_crew_verified`, `users.verified_crew_id` |
| 활성 상태(status) | 계정/멤버십 활성 여부. null/빈값은 레거시 ACTIVE로 호환 | `users.status`, `user_crews.status` (ACTIVE/SUSPENDED …) |
| 호스트(is_host) | 해당 출석을 개설/주최한 사람. 등급 승급 조건(min_hosting_count)에 사용 | `attendance_records.is_host` |
| 미등록 장소(unregistered) | 크루 등록 장소 목록에 없는 임의 위치 출석 | `location_id='unregistered'`, `crews.allow_unregistered_location` |
| 위치기반 출석 | 켜지면 위치 검증을 강제하는 크루 정책 | `crews.location_based_attendance`, `crews.accuracy_range`(m) |
| 소프트 삭제 | 출석 기록의 논리 삭제 | `attendance_records.deleted_at` |
| 첫 관리자 코드 | 첫 가입자를 자동 매니저로 승격시키는 초대코드 | `crew_invite_codes.is_first_admin_code`, `consumed_by` |
| 활동 상태(activity_status) | 크루 활성도: active(14/30일 내)/dormant/inactive(휴면) | 마스터 크루 활성도 RPC 산출 |

## 역할/권한(Role) 용어

| 한글 용어 | 정의 | 코드/DB 표현 |
|---|---|---|
| 크루 역할(crew_role) | 크루 내 역할 | `user_crews.crew_role`: OWNER / CREW_MANAGER / MEMBER |
| 시스템 역할(role_id) | 서비스 전역 역할 | `user_roles.role_id`: 1=MASTER_ADMIN, 2=ADMIN |
| 관리자 역할(AdminRole) | /admin2 진입 권한 산출값 | `owner` \| `admin` \| null (`관리자_역할_결정`) |
| 마스터(MASTER_ADMIN) | 서비스 전체 권한자. 크루 무관 항상 owner | `role_id === 1` (`마스터_권한인가`) |
| 운영진 | 출석·공지·푸시 등 관리 주체 | crew_role ∈ {OWNER, CREW_MANAGER} |

## 기능/화면(Feature) 용어

| 한글 용어 | 정의 | 코드 표현 |
|---|---|---|
| 활성모임 배너(Active Meet) | 최근 30분 내 같은 크루의 진행중 모임 홍보 배너 | `get_recent_active_meet` RPC → `활성모임_배너VM_생성` |
| 오프라인 출석 큐 | 네트워크 없을 때 출석을 IndexedDB에 큐잉 | `lib/offline/attendance-queue.ts`, `useOfflineAttendance` |
| 랭킹 | 크루 내 출석/기여 랭킹 | `get_ranking_data_unified` RPC |
| 마이페이지 활동 | 개인 출석/기여 그래프·히트맵 | `get_mypage_data_unified` RPC |
| 등급 승급 추천 | 출석/호스팅 카운트 기반 승급 후보 산출 | `calculate_grade_recommendations` RPC |

## 명명 컨벤션 (도메인 함수)

`lib/domain/README.md` 규약:
- boolean 반환: `~인가` (예: `유효한가`, `마스터_권한인가`)
- 실행/조립: `~하기`, `~조립`, `~생성` (예: `가입_upsert_payload_조립`)
- 검증(throw): `~검증` (예: `assertAdminAction`)

도메인 계층(`lib/domain/*`)은 순수 함수만 포함하며 Supabase/Next/React import이 금지된다(ESLint 룰1~3, build에서 error).
