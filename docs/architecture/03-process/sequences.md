---
IEEE 42010 역할: Process View (프로세스 관점)
Viewpoint: 런타임 상호작용 / 시퀀스 흐름
이해관계자: 플랫폼 개발자, QA/디자인 에이전트 파이프라인, 운영진
근거: 아키텍처 맵 §6, 실제 코드(app/**/actions.ts, lib/**)
---

# 프로세스 뷰 — 핵심 시퀀스 플로우

이 문서는 RunHouse의 대표 런타임 흐름을 Mermaid `sequenceDiagram`으로 기술한다.
모든 참여자/함수/파일명은 실제 코드베이스에서 관측된 것이며, BFF 4계층 규약
(page.tsx → actions.ts → lib/domain → Supabase RLS)을 따른다.

---

## A. 출석 등록 (`app/attendance/actions.ts::submitAttendance`)

가장 핵심적인 쓰기 경로. 위조 방지(서버측 userId 재검증)와 화이트리스트
재검증(exercise_type / location)이 이 흐름의 보안 골자다.

```mermaid
sequenceDiagram
    autonumber
    participant C as ClientAttendancePage /<br/>useOfflineAttendance
    participant A as submitAttendance<br/>(app/attendance/actions.ts)
    participant V as attendanceSubmissionSchema<br/>(lib/domain/attendance/validators)
    participant P as 출석정책<br/>(lib/domain/attendance/policies)
    participant UC as 사용자_컨텍스트_조회<br/>(lib/access/user-context, React.cache)
    participant AC as 접근정책<br/>(lib/domain/access/policies)
    participant DB as Supabase(attendance 스키마)
    participant W as waitUntil (@vercel/functions)
    participant FCM as sendNotification (FCM)
    participant PH as PostHog

    C->>A: submitAttendance(input)
    A->>V: safeParse(input)
    V-->>A: 유효성 결과 (실패 시 즉시 return)
    A->>P: 유효한가(현재, 출석시각) — 2h 윈도우
    P-->>A: 미래/만료 출석 거부 판정
    A->>UC: 사용자_컨텍스트_조회()
    UC-->>A: ctx.userId
    A->>A: ctx.userId ≠ input.userId → 위조 거부
    A->>AC: 출석등록_가능한가(status 가드)
    AC-->>A: 비활성 계정 차단 판정
    A->>DB: crew_exercise_types 화이트리스트 조회
    A->>DB: crews 설정 조회 (위치기반/미등록 정책)
    A->>DB: crew_locations is_active + crew_id 검증
    A->>DB: attendance_records INSERT
    DB-->>A: 삽입 결과
    A->>W: waitUntil(...)
    W->>FCM: 알림메시지_조립 → sendNotification(crewId, [OWNER, CREW_MANAGER])
    W->>PH: capture server_attendance_recorded
    A->>A: revalidatePath('/attendance')
    A-->>C: AttendanceSubmitResult
```

---

## B. 신규 가입 & 크루 인증 (`app/auth/signup/actions.ts`)

카카오 OAuth 후 2단계: 초대코드 1차 검증 → 약관 동의 → 가입 upsert.

```mermaid
sequenceDiagram
    autonumber
    participant U as 신규 가입자 (SignupPage)
    participant RL as rate-limit (lib/rate-limit.ts, in-memory)
    participant VC as verifyCrewCodeAction
    participant SU as signupAction
    participant AP as 인증정책/workflows<br/>(lib/domain/auth/*)
    participant Auth as Supabase Auth
    participant DB as Supabase(attendance)
    participant PH as PostHog

    U->>VC: verifyCrewCodeAction(code)
    VC->>RL: 검사 (verify 10/min/IP)
    VC->>DB: crew_invite_codes 조회
    VC->>AP: 초대코드_유효한가(is_active)
    AP-->>VC: 판정
    VC-->>U: AuthActionResult (검증 성공 시 다음 단계)
    U->>U: 약관 동의 (ConsentAgreement / TermsOfServiceModal)
    U->>SU: signupAction(payload)
    SU->>RL: 검사 (signup 5/min/IP)
    SU->>AP: signupSchema.parse → 크루정보_완전한가
    SU->>Auth: auth.getUser()
    Auth-->>SU: user
    SU->>AP: 가입_upsert_payload_조립 (username=id, password_hash='')
    SU->>DB: users UPSERT
    SU->>DB: increment_crew_invite_code_used_count (RPC)
    SU->>DB: user_crews UPSERT
    SU->>PH: identify + server_signup_completed
    SU->>SU: revalidatePath('/auth/signup')
    SU-->>U: AuthActionResult
```

---

## C. 기존 사용자 크루 인증 (`app/auth/verify-crew/actions.ts::verifyCrewMembershipAction`)

이미 로그인된 사용자가 초대코드로 특정 크루 소속을 증명하는 흐름.
중복 인증 방지와 감사 로그(IP/UA) 기록이 특징.

```mermaid
sequenceDiagram
    autonumber
    participant U as 사용자 (VerifyCrewPage)
    participant VM as verifyCrewMembershipAction
    participant Auth as Supabase Auth
    participant AP as 인증정책 (lib/domain/auth/policies)
    participant DB as Supabase(attendance)

    U->>VM: verifyCrewMembershipAction(inviteCode)
    VM->>Auth: auth.getUser()
    Auth-->>VM: user
    VM->>DB: users 조회
    VM->>AP: 인증된_사용자인가 → 중복 시 차단
    VM->>DB: crew_invite_codes 조인 조회
    VM->>AP: 초대코드_유효한가(is_active)
    AP-->>VM: 판정
    VM->>DB: users UPDATE (verified_crew_id, is_crew_verified)
    VM->>DB: upsert_user_crew (RPC)
    VM->>DB: invite_code_usage_logs INSERT (IP/UA)
    VM->>VM: revalidatePath('/', '/auth/verify-crew')
    VM-->>U: AuthActionResult
```

---

## D. admin2 뮤테이션 가드 (`lib/admin2/action-auth.ts::assertAdminAction`)

운영진 전용 쓰기 Server Action이 실행 전 통과하는 공통 권한 가드.
role_id + crew_role을 병렬 조회해 `관리자_역할_결정`으로 통합 역할을 산출한다.

```mermaid
sequenceDiagram
    autonumber
    participant SA as Admin Server Action<br/>(예: createBulkAttendanceAction)
    participant G as assertAdminAction<br/>(lib/admin2/action-auth.ts)
    participant Auth as Supabase Auth
    participant DB as Supabase(attendance)
    participant MP as 관리자_역할_결정<br/>(lib/domain/master/policies)
    participant PM as can(role, action)<br/>(lib/admin2/permissions.ts)

    SA->>G: assertAdminAction(action)
    G->>Auth: auth.getUser()
    Auth-->>G: user
    G->>DB: users(is_crew_verified, verified_crew_id) 조회
    par 병렬 조회
        G->>DB: user_roles.role_id
    and
        G->>DB: user_crews.crew_role
    end
    G->>MP: 관리자_역할_결정(role_id, crew_role)
    MP-->>G: owner | admin | null
    G->>PM: can(role, action)
    PM-->>G: 허용/거부
    alt 허용
        G-->>SA: {ok:true, auth:{userId, crewId, role}}
    else 거부
        G-->>SA: 실패 응답
    end
```

---

## E. 홈 활성모임 배너 (`get_recent_active_meet` RPC)

최근 30분 내 같은 크루의 진행중 모임을 홍보하는 홈 배너 흐름.
자기참조 방지(본인 출석 제외)와 표시조건 필터가 핵심.

```mermaid
sequenceDiagram
    autonumber
    participant H as 홈 RSC (app/page.tsx)
    participant RPC as get_recent_active_meet<br/>(SECURITY DEFINER)
    participant VM as 활성모임_배너VM_생성<br/>(lib/domain/...)
    participant B as ActiveMeetBanner (client)
    participant LS as localStorage

    H->>RPC: rpc(get_recent_active_meet)
    Note over RPC: 30분 윈도우 · 본인 제외 ·<br/>location 그룹핑 · 인원 최다 1건
    RPC-->>H: {location, count, ...}
    H->>VM: 활성모임_배너VM_생성(row)
    Note over VM: 표시조건 = location 非공백 ·<br/>count ≥ 1 · 파싱 가능
    VM-->>H: 배너 VM (또는 null)
    H->>B: 렌더 (VM 존재 시)
    B->>LS: dismissKey 조회/저장
    B-->>H: 사용자 dismiss 시 숨김
```

---

## 관련 문서
- 데이터 모델 / 컨테이너: 아키텍처 맵 §5, §8
- 인터페이스(경로/입출력/인증요건): [../04-interface/api-and-actions.md](../04-interface/api-and-actions.md)
