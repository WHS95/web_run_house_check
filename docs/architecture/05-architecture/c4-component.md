---
IEEE 42010 Role: Architecture View — C4 Level 3 (Component)
Viewpoint: C4 Component Viewpoint (컨테이너 내부 모듈 ↔ 실제 파일 경로)
Stakeholders: 플랫폼 운영/개발자, 디자인/QA 에이전트 파이프라인
---

# C4 Component — RunHouse 주요 컨테이너 내부 컴포넌트

Next.js 앱 컨테이너 내부의 인증 가드·도메인·인프라 모듈을 실제 파일 경로에 매핑한다.
(근거: 맵 §3 Business Rules, §6 Sequence Flows, §8 Notable Components)

## C1. 인증/권한 가드 컴포넌트

```mermaid
graph TB
    classDef comp fill:#1D2530,stroke:#669FF2,color:#e6eef8;
    classDef file fill:#243247,stroke:#8aa0bd,color:#dbe4f0;

    uc["사용자 컨텍스트(React.cache)<br/>lib/access/user-context.ts::사용자_컨텍스트_조회"]:::comp
    aa["admin2 RSC 가드(redirect)<br/>lib/admin2/auth.ts::getAdminAuth"]:::comp
    aaa["admin2 Action 가드<br/>lib/admin2/action-auth.ts::assertAdminAction"]:::comp
    perm["권한 매트릭스<br/>lib/admin2/permissions.ts::can(17 AdminAction)"]:::comp
    ma["마스터 가드<br/>lib/master/auth.ts::마스터_권한_보장"]:::comp
    va["레거시 admin 가드<br/>lib/admin-auth.ts::verifyAdminAuth"]:::comp

    role["관리자_역할_결정 / 마스터_권한인가<br/>lib/domain/master/policies.ts"]:::file
    acc["접근 정책<br/>lib/domain/access/policies.ts"]:::file

    aaa --> role
    aaa --> perm
    aa --> role
    ma --> role
    uc --> acc
```

- 출석 위조 방지: `submitAttendance`가 `사용자_컨텍스트_조회()`의 userId와 입력 userId를 비교. (맵 §6-A)
- admin2 뮤테이션: `assertAdminAction` → `관리자_역할_결정` → `can(role, action)`. (맵 §6-D)

## C2. 도메인 레이어 (lib/domain/**)

```mermaid
graph LR
    classDef file fill:#243247,stroke:#8aa0bd,color:#dbe4f0;

    att["attendance/policies.ts<br/>유효한가(+2h) · 위치기반_출석필요한가 · 미등록허용"]:::file
    access["access/policies.ts<br/>크루멤버_접근가능한가 · 출석등록_가능한가"]:::file
    authp["auth/policies.ts · workflows.ts<br/>초대코드_유효한가 · 크루정보_완전한가 · 가입_upsert_payload_조립"]:::file
    masterp["master/policies.ts<br/>마스터_권한인가 · 관리자_역할_결정"]:::file
    invite["invite/policies.ts<br/>커스텀코드_유효한가 · 어드민/마스터코드_생성"]:::file
    grade["grade/policies.ts<br/>PATCH 필드 화이트리스트(camel→snake)"]:::file
```

- 규약: Supabase/Next/React import 금지(ESLint 룰1~3), Vitest 1:1, 한글 함수명 컨벤션(`~인가`/`~하기`/`~검증`). (맵 §3·§8)

## C3. 인프라/횡단 컴포넌트

```mermaid
graph TB
    classDef comp fill:#1D2530,stroke:#669FF2,color:#e6eef8;
    classDef ext fill:#2b3442,stroke:#8aa0bd,color:#dbe4f0,stroke-dasharray:4 3;

    supa["Supabase 클라이언트<br/>lib/supabase/{server,client,admin,crew-auth,crew-auth-server}.ts"]:::comp
    push["푸시 발송<br/>lib/push/send-notification.ts<br/>(역할 타겟팅·500청크·실패토큰 비활성화)"]:::comp
    fadmin["lib/firebase/{admin,client}.ts"]:::comp
    offq["오프라인 큐<br/>lib/offline/attendance-queue.ts + hooks/useOfflineAttendance.ts"]:::comp
    rl["Rate limit(in-memory Map)<br/>lib/rate-limit.ts (verify 10/min, signup 5/min)"]:::comp
    nav["Naver Map hooks<br/>hooks/useNaverMap.ts · useGeocoding.ts"]:::comp

    fcm["FCM"]:::ext
    push --> fadmin --> fcm
```

- ⚠️ Rate limit은 서버리스 인스턴스별 비영속 상태 — 다중 인스턴스 우회 가능. (맵 §9 Anti-abuse)

## C4. 출석 등록 컴포넌트 상호작용 (Use Case §6-A)

```mermaid
sequenceDiagram
    participant C as ClientAttendancePage / useOfflineAttendance
    participant A as submitAttendance (actions.ts)
    participant D as domain/attendance·access
    participant DB as Supabase(attendance)
    participant N as send-notification + PostHog

    C->>A: submitAttendance(input)
    A->>A: attendanceSubmissionSchema.safeParse
    A->>D: 유효한가(현재, 출석시각) · 출석등록_가능한가
    A->>DB: 사용자_컨텍스트_조회() → userId 위조 검증
    A->>DB: crew_exercise_types 화이트리스트 · crew_locations(is_active) 검증
    A->>DB: attendance_records insert
    A-->>N: waitUntil: 운영진 푸시 + server_attendance_recorded
    A->>A: revalidatePath('/attendance')
```

## 범례 (Legend)
- 진한 배경: 코드 컴포넌트/모듈. 남색: 파일 단위 도메인 정책. 점선 테두리: 외부 시스템.
- 노드 라벨 하단은 실제 파일 경로 및 대표 함수(한글 도메인 함수명 포함).

## 인터랙션 · 모션 레이어 (`lib/motion/`)

제스처 UI의 물리 계산을 격리하는 순수 함수 레이어. `lib/domain/`(비즈니스 룰)과 성격이 다르므로
분리하되, 강제 장치(ESLint 순수성 · 1:1 테스트 · Vitest)는 동일한 것을 공유한다.

```
lib/motion/gesture.ts   모멘텀 투사 · 러버밴딩 · 닫기 판정 · 진행률
lib/motion/spring.ts    Apple 스펙(감쇠비·응답) → Framer Motion(stiffness·damping)
      ↓ (React 의존 금지 — ESLint 강제)
hooks/useDragSheet.ts   포인터 이벤트 → 순수 함수 호출 → 상태
      ↓
components/ui/DragSheet.tsx   포털 · 스크림 동기화 · 접근성
      ↓
바텀시트 5종 (MapBottomSheet, NoticeBottomSheet, NoticeListSheet,
              SortFilterSheet, AdminMemberPickerSheet)
```

- **커버리지 100% 강제** — `lib/motion/**`만 임계를 걸며 `npm run build`에 포함된다.
  `lib/domain/**`은 1:1 테스트 존재만 강제하고 비율 임계는 걸지 않는다.
- **`MapTemplate`은 예외** — collapsed/detail 스냅 포인트를 갖는 다단계 시트라
  열림/닫힘 이분 모델인 `DragSheet`로 대체할 수 없다. 컨테이너는 자체 유지하되
  **판정 물리만** `닫아야_하는가`로 통일했다.
- 상세 규칙: [`lib/motion/README.md`](../../../lib/motion/README.md)
