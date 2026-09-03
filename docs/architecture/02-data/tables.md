---
문서: 테이블 상세 (컬럼/제약/설명)
IEEE 42010 역할: View (Information/Data Viewpoint에 대응)
관점(Viewpoint): 데이터 구조 및 관계
이해관계자: 플랫폼 운영/개발자, 크루 운영진, 마스터 관리자
근거: Architecture Map §5 Data Model, `supabase/migrations/20260426_0002_master_invite_code_columns.sql`·`supabase/migrations/20260502_0002_cleanup_orphan_crew_grade_refs.sql`(ALTER/제약 확정), master RPC 3종·`get_master_crew_detail`·`get_recent_active_meet`(컬럼 투영), `lib/types/*`·`lib/domain/*/types.ts`·`lib/supabase/admin.ts`(코드 관측)
비고: 스키마 `attendance`. base 테이블의 전체 CREATE TABLE DDL은 저장소에 없어(마이그레이션은 ALTER·RPC 위주) 컬럼·타입은 마이그레이션·RPC·코드 관측 기준. 각 컬럼의 근거 수준은 아래 범례 및 표의 "출처" 열로 표기.
---

# RunHouse 테이블 상세

스키마: `attendance`. 모든 접근은 `.schema("attendance")`.

## 확정 출처 범례 (표의 "출처" 열)

- `[SQL]` — 마이그레이션 DDL(ALTER TABLE/제약)로 확정.
- `[코드]` — `lib/types`·`lib/domain/*/types.ts`·`admin.ts` 코드 또는 RPC의 SELECT/RETURN 투영에서 관측.
- `[추정]` — 코드/RPC에서 직접 확인되지 않아 추정.

> RPC 파일(`.sql`)은 base 테이블을 투영만 할 뿐 DDL로 정의하지 않으므로 RPC 관측 컬럼은 `[코드]`로 분류한다. ALTER로 정의됨과 동시에 RPC가 투영하는 컬럼은 더 강한 `[SQL]`로 태깅한다.

---

## users — 사용자 프로필

Supabase Auth `user.id`를 PK로 재사용. NOT NULL 제약(`username`, `password_hash`)은 레거시 스키마 호환용으로 가입 시 값이 주입됨.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [코드] | Supabase Auth uid와 동일 |
| first_name | varchar | | [코드] | 이름(RPC 투영 `first_name`) |
| email | varchar | | [코드] | 이메일(가입 시 갱신) |
| phone | varchar | | [코드] | 전화번호 |
| birth_year | int | | [코드] | 출생연도 |
| status | varchar | | [코드] | 계정 상태 ACTIVE/SUSPENDED (null/빈값=ACTIVE 레거시) |
| is_crew_verified | bool | | [코드] | 크루 인증 여부(2단계 인증의 2단계) |
| verified_crew_id | uuid | FK→crews.id | [코드] | 인증으로 확정된 소속 크루 |
| username | varchar | NOT NULL | [코드] | = id (NOT NULL 제약 보존용) |
| password_hash | varchar | NOT NULL | [코드] | '' (OAuth이므로 미사용) |
| oauth_provider | varchar | | [코드] | OAuth 제공자(kakao 등) |
| oauth_id | varchar | | [코드] | 카카오 sub 등 |
| profile_image_url | text | | [코드] | 프로필 이미지 |
| privacy_consent_agreed | bool | | [코드] | 개인정보 동의 |
| privacy_consent_agreed_at | timestamptz | | [코드] | 개인정보 동의 시각 |
| terms_of_service_agreed | bool | | [코드] | 서비스약관 동의 |
| terms_of_service_agreed_at | timestamptz | | [코드] | 약관 동의 시각 |
| updated_at | timestamptz | | [코드] | 수정 시각 |

---

## crews — 크루

러닝 커뮤니티 단위. 위치기반 출석 정책 설정을 보유. `get_master_crew_overview` RPC가 아래 컬럼 전부를 투영.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [코드] | |
| name | varchar | | [코드] | 크루명 |
| description | text | | [코드] | 소개 |
| region | varchar | | [코드] | 지역 |
| profile_image_url | text | | [코드] | 크루 이미지 |
| max_members | int | | [코드] | 최대 인원 |
| location_based_attendance | bool | | [코드] | true면 위치검증 강제 |
| accuracy_range | int | | [코드] | 반경 판정(m) |
| allow_unregistered_location | bool | | [코드] | 미등록 장소 출석 허용 |
| created_at | timestamptz | | [코드] | |
| updated_at | timestamptz | | [코드] | |

---

## user_crews — 사용자↔크루 멤버십 (N:N)

복합 PK. 조작은 `upsert_user_crew` RPC 경유. `crew_grade_id`는 멤버의 현재 크루 등급 참조.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| user_id | uuid | PK, FK→users.id | [코드] | |
| crew_id | uuid | PK, FK→crews.id | [코드] | |
| crew_role | varchar | | [코드] | OWNER / CREW_MANAGER / MEMBER |
| status | varchar | | [코드] | ACTIVE / SUSPENDED |
| joined_at | timestamptz | | [코드] | 가입 시각 |
| crew_grade_id | int | FK→crew_grades.id, ON DELETE SET NULL | [SQL] | 멤버 현재 등급. FK `user_crews_crew_grade_id_fkey` (20260502 cleanup 마이그레이션에서 확인). soft delete(is_active=false)는 FK가 보호 못 해 애플리케이션/마이그레이션에서 NULL 처리 |

---

## attendance_records — 출석 기록

soft delete(`deleted_at`) 사용. `location`은 장소명 스냅샷(텍스트). 컬럼 전부 master RPC들이 투영.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [코드] | |
| user_id | uuid | FK→users.id | [코드] | 출석자 |
| crew_id | uuid | FK→crews.id | [코드] | 소속 크루 |
| exercise_type_id | uuid | FK→exercise_types.id | [코드] | 운동종류(화이트리스트 재검증) |
| is_host | bool | | [코드] | 모임 개설자 여부(등급 승급 조건) |
| attendance_timestamp | timestamptz | | [코드] | 출석 시각(현재+최대 2h 이내) |
| location | text | | [코드] | 장소명 스냅샷 |
| deleted_at | timestamptz | | [코드] | soft delete 마커 |

---

## crew_invite_codes — 초대코드

첫 가입자 자동 매니저 승격(`is_first_admin_code` + `consumed_by`) 지원. 관련 마이그레이션: `20260426_0002_master_invite_code_columns.sql`. 컬럼 관측: `getCrewInviteCodes`(admin.ts) select, `lib/domain/invite/types.ts`.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | int | PK | [코드] | `InviteCodeRow.id: number` |
| crew_id | uuid | FK→crews.id | [코드] | |
| invite_code | varchar | UNIQUE | [코드] | 초대 코드 |
| description | text | | [코드] | 설명 |
| is_active | bool | | [코드] | 활성 여부(`초대코드_유효한가`) |
| used_count | int | | [코드] | 사용 횟수 |
| max_uses | int | | [코드] | 최대 사용 횟수(NULL=무제한) |
| expires_at | timestamptz | | [코드] | 만료 시각(NULL=무기한) |
| created_by | uuid | FK→users.id | [코드] | 생성자 |
| is_first_admin_code | bool | NOT NULL, DEFAULT FALSE | [SQL] | 첫 가입자 CREW_MANAGER 승격 |
| consumed_by | uuid | FK→users.id, ON DELETE SET NULL | [SQL] | 코드 소비 user_id(1회용) |
| created_at | timestamptz | | [코드] | |
| updated_at | timestamptz | | [코드] | |

인덱스: `idx_crew_invite_codes_first_admin_unconsumed` — `(invite_code) WHERE is_first_admin_code=TRUE AND consumed_by IS NULL` — [SQL].

---

## crew_locations — 크루 등록 장소

위치기반 출석 검증에 사용. 컬럼 관측: `lib/types/crew-locations.ts`(`CrewLocation`).

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | int | PK | [코드] | `CrewLocation.id: number` |
| crew_id | uuid | FK→crews.id | [코드] | |
| name | varchar | | [코드] | 장소명 |
| description | text | | [코드] | 설명 |
| latitude | float | | [코드] | 위도(`number`) |
| longitude | float | | [코드] | 경도(`number`) |
| is_active | bool | | [코드] | 활성 장소만 출석 검증 통과 |
| created_at | timestamptz | | [코드] | |
| updated_at | timestamptz | | [코드] | |

> 위경도는 이전 문서에서 "추정"이었으나 `CrewLocation` 타입에서 `number`로 확정([코드]).

---

## exercise_types — 운동종류 마스터

`get_master_crew_activity` RPC가 `name` 투영.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [코드] | |
| name | varchar | | [코드] | 운동종류명 |

---

## crew_exercise_types — 크루별 허용 운동종류 화이트리스트

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [코드] | |
| crew_id | uuid | FK→crews.id | [코드] | |
| exercise_type_id | uuid | FK→exercise_types.id | [코드] | |
| is_active | bool | | [코드] | 활성 여부 |

---

## grades — 등급 마스터

`crew_grades.grade_id`가 `number`이므로 `grades.id`는 int로 관측.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | int | PK | [코드] | |
| name | varchar | | [코드] | 등급명 |

---

## crew_grades — 크루별 등급 오버라이드

PATCH는 필드 화이트리스트 매핑(camelCase→snake_case) 통과 필드만 허용(`lib/domain/grade/policies.ts`). 컬럼 관측: `lib/domain/grade/types.ts`(`CrewGradeRow`). `is_active`는 soft delete로 사용 — [SQL].

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | int | PK | [코드] | `CrewGradeRow.id: number` |
| crew_id | uuid | FK→crews.id | [코드] | |
| grade_id | int | FK→grades.id | [코드] | |
| name_override | varchar | | [코드] | 등급명 오버라이드 |
| description_override | text | | [코드] | 설명 오버라이드 |
| min_attendance_count | int | | [코드] | 승급 최소 출석 수 |
| min_hosting_count | int | | [코드] | 승급 최소 호스팅 수 |
| promotion_period_type | varchar | | [코드] | 승급 기간 유형 |
| sort_order | int | | [코드] | 정렬 순서 |
| can_host | bool | | [코드] | 호스팅 가능 여부 |
| is_active | bool | | [SQL] | soft delete(false=삭제). 20260502 cleanup 마이그레이션 WHERE 절에서 확인 |

---

## grade_promotion_logs — 등급 승급 이력

컬럼 관측: `app/admin2/settings/grade/actions.ts` insert. 승급 대상 등급 컬럼명은 `to_grade_id`(과거 문서의 `grade_id`에서 정정). 참조 대상(`grades` vs `crew_grades`)은 미확정.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [추정] | |
| user_id | uuid | FK→users.id | [코드] | 승급 대상 |
| crew_id | uuid | FK→crews.id | [코드] | |
| to_grade_id | int | | [코드] | 승급 대상 등급(FK 대상 미확정) |
| change_type | varchar | | [코드] | manual / approved |
| changed_by | uuid | FK→users.id | [코드] | 변경 실행자 |
| created_at | timestamptz | | [추정] | |

---

## user_roles — 시스템 역할

컬럼 관측: `lib/master/auth.ts`·`lib/admin2/auth.ts` 등, master RPC의 `role_id` 검증.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| user_id | uuid | FK→users.id | [코드] | |
| role_id | int | | [코드] | 1=MASTER_ADMIN, 2=ADMIN |

---

## admin_roles — 슈퍼관리자 플래그

`user_roles`와 별개 테이블. 컬럼 관측: `checkIsSuperAdmin`(admin.ts).

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| user_id | uuid | FK→users.id | [코드] | |
| is_super_admin | bool | | [코드] | 슈퍼관리자 여부 |

---

## notices — 크루 공지

컬럼 관측: `NOTICE_SELECT`(`app/admin2/notice/actions.ts`), `lib/admin2/queries.ts`. 본문 컬럼은 `content`(과거 문서의 `body`에서 정정), `type`·`is_active`·`author_id` 추가 확인.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [추정] | |
| crew_id | uuid | FK→crews.id | [코드] | |
| title | varchar | | [코드] | 제목 |
| type | varchar | | [코드] | 공지 유형 |
| content | text | | [코드] | 내용 |
| is_active | bool | | [코드] | 활성 공지(신규 작성 시 기존 공지 비활성화) |
| author_id | uuid | FK→users.id | [코드] | 작성자 |
| created_at | timestamptz | | [코드] | |

---

## notifications — 개인 알림 히스토리

컬럼 관측: `lib/push/send-notification.ts` insert(`user_id, crew_id, type, title, body`). 본문 컬럼은 `body`(notices의 `content`와 다름).

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [추정] | |
| user_id | uuid | FK→users.id | [코드] | 수신자 |
| crew_id | uuid | FK→crews.id | [코드] | |
| type | varchar | | [코드] | 알림 유형 |
| title | varchar | | [코드] | 제목 |
| body | text | | [코드] | 내용 |
| is_read | bool | | [추정] | 읽음 여부(미관측) |
| created_at | timestamptz | | [추정] | |

---

## push_history — 운영진 푸시 발송 이력

컬럼 관측: `PUSH_HISTORY_SELECT` 및 insert(`app/admin2/push/actions.ts`).

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [코드] | |
| crew_id | uuid | FK→crews.id | [코드] | |
| sent_by | uuid | FK→users.id | [코드] | 발송자 |
| title | varchar | | [코드] | 발송 제목 |
| target_mode | varchar | | [코드] | 발송 대상 모드 |
| target_count | int | | [코드] | 대상 인원 수 |
| success_count | int | | [코드] | 성공 건수 |
| failure_count | int | | [코드] | 실패 건수 |
| created_at | timestamptz | | [코드] | 발송 시각 |

---

## user_push_tokens — FCM 토큰

컬럼 관측: `lib/push/send-notification.ts` select(`token, user_id`), `crew_id`·`is_active` 필터.

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [추정] | |
| user_id | uuid | FK→users.id | [코드] | |
| crew_id | uuid | FK→crews.id | [코드] | |
| token | text | | [코드] | FCM 토큰 |
| is_active | bool | | [코드] | 실패 토큰 비활성화 대상 |
| updated_at | timestamptz | | [추정] | |

---

## invite_code_usage_logs — 초대코드 사용 감사 로그

컬럼 관측: `admin.ts` select. 시각 컬럼은 `used_at`(과거 문서의 `created_at`에서 정정).

| 컬럼 | 타입 | 제약 | 출처 | 설명 |
|---|---|---|---|---|
| id | uuid | PK | [코드] | |
| invite_code_id | int | FK→crew_invite_codes.id | [코드] | |
| user_id | uuid | FK→users.id | [코드] | 사용자 |
| user_ip | varchar | | [코드] | 요청 IP |
| user_agent | text | | [코드] | User-Agent |
| used_at | timestamptz | | [코드] | 사용 시각 |

---

## (참고) `image` — 테이블이 아님

과거 문서에 있던 `image` 엔티티는 DB 테이블이 아니라 Supabase **Storage 버킷**이다(`supabase.storage.from("image")`, `app/mypage/edit/page.tsx`). 프로필 이미지는 `profiles/{userId}.{ext}` 경로에 업로드되고 public URL을 `users.profile_image_url`에 저장한다. 따라서 ERD/테이블 목록에서 제외했다.

---

> ⚠️ 관측 한계
> - `[SQL]`로 확정된 것: `crew_invite_codes.is_first_admin_code`·`consumed_by`(20260426_0002 ALTER), `user_crews.crew_grade_id` + FK `user_crews_crew_grade_id_fkey`·`crew_grades.is_active` soft delete(20260502 cleanup 마이그레이션).
> - 나머지 base 테이블 컬럼은 CREATE TABLE DDL이 저장소에 없어 마이그레이션·RPC 투영·코드 타입에서 관측한 `[코드]`이며, 확인되지 않은 컬럼·타입은 `[추정]`으로 남겼다.
> - `grade_promotion_logs.to_grade_id`는 참조 대상 테이블이 미확정이다.
> - 실제 CREATE TABLE DDL 확보 시 `[코드]`/`[추정]` 항목을 `[SQL]`로 승격·정정할 것.
</content>
