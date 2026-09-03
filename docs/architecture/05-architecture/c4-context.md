---
IEEE 42010 Role: Architecture View — C4 Level 1 (System Context)
Viewpoint: C4 Context Viewpoint (사람·외부시스템 경계)
Stakeholders: 플랫폼 운영/개발자, 크루 운영진, 마스터 관리자, 신규 가입자, 크루 멤버
---

# C4 Context — RunHouse(런하우스) 시스템 컨텍스트

러닝크루 출석/크루 관리 PWA. 사용자 유형과 외부 SaaS 경계를 표현한다.
(근거: 아키텍처 맵 §1 Stakeholders, §8 C4 Context)

## 다이어그램

```mermaid
graph TB
    classDef person fill:#669FF2,stroke:#1D2530,color:#0b1017;
    classDef system fill:#1D2530,stroke:#669FF2,color:#e6eef8;
    classDef ext fill:#2b3442,stroke:#8aa0bd,color:#dbe4f0,stroke-dasharray:4 3;

    member["크루 멤버<br/>(일반 사용자)"]:::person
    owner["크루 운영진<br/>(OWNER / CREW_MANAGER)"]:::person
    master["마스터 관리자<br/>(role_id=1, SUPER_ADMIN)"]:::person
    newbie["신규 가입자"]:::person

    rh["RunHouse PWA<br/>Next.js 14 App Router + Supabase + FCM<br/>출석/크루 관리, 랭킹, 마스터 모니터링"]:::system

    supabase["Supabase<br/>Postgres(attendance 스키마)<br/>Auth(카카오 OAuth) · Storage · RLS · RPC"]:::ext
    kakao["Kakao<br/>OAuth 로그인 공급자"]:::ext
    fcm["Firebase Cloud Messaging<br/>웹푸시"]:::ext
    naver["Naver Maps<br/>지도/지오코딩"]:::ext
    posthog["PostHog<br/>프로덕트 분석(/ingest 프록시)"]:::ext
    sentry["Sentry<br/>에러/성능 모니터링(/monitoring 터널)"]:::ext
    vercel["Vercel<br/>호스팅 · Analytics · waitUntil · Cron"]:::ext

    member -->|출석 등록/조회, 랭킹, 내 활동| rh
    owner -->|멤버·출석·공지·푸시·등급 관리| rh
    master -->|서비스 KPI, 크루 생성, 글로벌 초대코드| rh
    newbie -->|카카오 로그인 → 크루코드 인증 → 약관동의| rh

    rh -->|DB read/write · Auth · RPC · Storage| supabase
    rh -->|OAuth 인증 위임| kakao
    supabase -.->|OAuth 브로커| kakao
    rh -->|운영진 푸시 발송| fcm
    rh -->|지도 렌더/좌표 검증| naver
    rh -->|서버/클라 이벤트| posthog
    rh -->|예외/트레이스| sentry
    rh -->|배포/실행 런타임| vercel
```

## 범례 (Legend)
- 파란 채움: 사람(Person) / 진한 배경: 대상 시스템(RunHouse) / 점선 테두리: 외부 SaaS.
- 실선 화살표: 직접 호출/사용. 점선: 위임(브로커) 관계.

## 핵심 관계 노트
- **인증 경계**: 2단계 인증 — Supabase Auth(카카오 OAuth) + `is_crew_verified`(크루 인증). 카카오는 Supabase가 OAuth 브로커로 중개한다. (맵 §9 보안)
- **service_role(RLS 우회)** 사용은 푸시 발송/dev login으로 제한. (맵 §8)
- **PostHog `/ingest`**, **Sentry `/monitoring`** 은 광고차단 회피용 역프록시/터널 경유. (맵 §8, next.config.js rewrites)
- 맵에 Discord 연동 근거는 없어 컨텍스트에서 제외했다.
