---
IEEE 42010 역할: Stakeholder Catalog (Overview)
대상 이해관계자: 아키텍처를 참조하는 모든 이해관계자(제품/개발/운영/QA)
근거: Architecture Map §1, §4
---

# 이해관계자 (Stakeholders)

RunHouse(런하우스)는 러닝크루 출석/크루 관리 PWA다. 회사 코어 미션은 **러닝크루 운영진의 출석 관리를 도와 커스텀 러닝 의류 구매로 연결**하는 것이며(참고 메모), 아래 이해관계자 표는 이 미션을 중심으로 각 역할의 관심사와 코드 근거를 정리한다.

## 1. 이해관계자 표

| 이해관계자 | 역할 정의 | 주요 관심사 | 코드 근거 |
|---|---|---|---|
| **크루 멤버(일반 사용자)** | 크루에 소속되어 출석을 등록하는 러너 | 빠른 출석 등록, 오프라인 출석, 랭킹/내 활동 조회, 위치 검증 UX | `app/attendance/`, `app/ranking/`, `app/mypage/`, `hooks/useOfflineAttendance.ts`, `lib/offline/attendance-queue.ts` |
| **크루 운영진(OWNER / CREW_MANAGER)** | admin2 진입 권한(role owner/admin)을 가진 크루 관리자 | 멤버·출석·공지·등급·위치·초대코드 관리, 통계, 푸시 발송 | `app/admin2/**`, `lib/admin2/*`, `components/organisms/Admin*` |
| **마스터 관리자(SUPER_ADMIN, role_id=1)** | 서비스 전체 권한자 | 서비스 전체 KPI, 크루 활성도 모니터링, 크루 생성, 글로벌 초대코드 | `app/master/**`, `lib/master/auth.ts`, `lib/domain/master/*`, master RPCs |
| **신규 가입자** | 아직 크루 인증을 마치지 않은 사용자 | 카카오 OAuth 로그인, 크루 코드 인증, 약관/개인정보 동의 | `app/auth/signup/`, `app/auth/verify-crew/`, `components/molecules/auth/*` |
| **플랫폼 운영/개발자** | 서비스 운영·유지보수 담당 | 관측성(Sentry/PostHog/Vercel Analytics), BFF 규약 강제, 디자인 시스템 준수 | `OBSERVABILITY.md`, `sentry.*.config.ts`, `scripts/check-bff.ts`, `.pen` 파일 |
| **디자인/QA 에이전트 파이프라인** | 스펙-코드 일치 검증 자동화 | `.pen` 스펙 → 코드 일치, 빌드 검증 | `CLAUDE.md` 하네스 섹션, `.claude/agents/*` |

## 2. 권한 계층 요약

권한은 `관리자_역할_결정`(`lib/domain/master/policies.ts`)으로 결정되며 우선순위는 **MASTER > OWNER > ADMIN**이다.

- `role_id=1` → 항상 `owner`(마스터, 크루 무관)
- `crew_role=OWNER` → `owner`
- `role_id=2` → `admin`
- `crew_role ∈ {CREW_MANAGER, ADMIN}` → `admin`
- 그 외 → `null`(관리자 아님)

## 3. 이해관계자 ↔ 유스케이스 매핑

| 이해관계자 | 주요 유스케이스(Map §4) |
|---|---|
| 신규 가입자 | 1. 회원가입 & 크루 인증 |
| 크루 멤버 | 2. 기존 사용자 크루 인증, 3. 출석 등록, 4. 오프라인 출석, 7. 홈 활성모임 배너, 8. 랭킹/내 활동 |
| 크루 운영진 | 5. 운영진 관리(admin2) |
| 마스터 관리자 | 6. 마스터 모니터링 |
| 플랫폼 운영/개발자 | 전 영역 관측성·BFF 규약 강제 |
