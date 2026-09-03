---
문서: Architecture Description (AD) 개요
표준: ISO/IEC/IEEE 42010:2022 (Architecture description)
대상 시스템(SOI): web_run_house_check (RunHouse / 런하우스)
대상 이해관계자: 모든 이해관계자
---

# Architecture Description — web_run_house_check

이 문서는 **web_run_house_check**(RunHouse, 런하우스) 시스템의 Architecture Description(AD) 개요다. AD를 구성하는 이해관계자(Stakeholder)·관심사(Concern)·관점(Viewpoint)·뷰(View)의 관계와, 각 View 문서로의 진입점을 제공한다. 문서 전체 지도와 읽는 순서는 [README.md](./README.md)를 참조한다.

## 1. 대상 시스템 (System-of-Interest)

- **시스템**: RunHouse — 러닝크루 출석/크루 관리 PWA (Next.js App Router + Supabase).
- **코어 미션**: 러닝크루 운영진의 출석 관리를 도와 커스텀 러닝 의류 구매로 연결.
- **핵심 아키텍처 특성**: BFF 4계층(page.tsx → actions.ts → lib/domain → Supabase RLS), API 라우트 신규 추가 금지(`scripts/check-bff.ts` 강제), `attendance` 스키마 단일화, PWA/오프라인 출석, 다층 권한(멤버/운영진/마스터).

## 2. Stakeholder → Concern → Viewpoint → View 관계표

이해관계자가 제기하는 관심사를, 그 관심사를 규약화한 관점이, 실제 문서(View)로 실현하는 흐름을 한 표로 정리한다. (근거: [stakeholders.md](./00-overview/stakeholders.md), [concerns.md](./00-overview/concerns.md), [viewpoints.md](./00-overview/viewpoints.md))

| 이해관계자 (Stakeholder) | 관심사 (Concern) | 관점 (Viewpoint) | 실현 뷰 (View 문서) |
|---|---|---|---|
| 크루 멤버·운영진 | 출석 위조 방지 / 서버 재검증, 위치기반 검증 | Behavioral / Business Rules | [03-process/sequences.md](./03-process/sequences.md), [01-domain/business-rules.md](./01-domain/business-rules.md) |
| 크루 멤버 | 오프라인 출석 가용성 | Component / Behavioral | [05-architecture/c4-component.md](./05-architecture/c4-component.md), [03-process/sequences.md](./03-process/sequences.md) |
| 운영진·마스터·개발자 | 다층 권한 / 접근 제어 (가드+RLS+SECURITY DEFINER) | Business Rules / Behavioral | [01-domain/business-rules.md](./01-domain/business-rules.md), [03-process/sequences.md](./03-process/sequences.md) |
| 신규 가입자 | 가입·크루 인증 2단계 흐름 | Behavioral / Business Rules | [01-domain/usecases.md](./01-domain/usecases.md), [03-process/sequences.md](./03-process/sequences.md) |
| 개발자·통합 담당자·QA(check:bff) | 서비스 경계·인터페이스 규약, 캐시 일관성(revalidatePath) | Interface / Component | [04-interface/api-and-actions.md](./04-interface/api-and-actions.md), [05-architecture/c4-component.md](./05-architecture/c4-component.md) |
| 운영/개발자, 운영진, 마스터 | 외부 시스템 의존·컨테이너/컴포넌트 경계 | C4 Context / Container / Component | [05-architecture/c4-context.md](./05-architecture/c4-context.md), [05-architecture/c4-container.md](./05-architecture/c4-container.md), [05-architecture/c4-component.md](./05-architecture/c4-component.md) |
| 운영/개발자, 운영진, 마스터 | 데이터 무결성·도메인 모델 | Data (ERD) | [02-data/erd.md](./02-data/erd.md), [02-data/tables.md](./02-data/tables.md) |
| 전 이해관계자 | 도메인 용어 일관성(유비쿼터스 언어) | Domain / Ubiquitous Language | [01-domain/glossary.md](./01-domain/glossary.md) |
| 운영/개발자, 운영진, 마스터 | 성능·보안·가용성·PWA·anti-abuse | Quality | [06-quality/quality-attributes.md](./06-quality/quality-attributes.md) |

> Concern 카탈로그와 View 매핑의 원본은 [concerns.md](./00-overview/concerns.md), Viewpoint별 표기법·규칙은 [viewpoints.md](./00-overview/viewpoints.md)에 있다.

## 3. View 목록 (AD 구성요소)

| # | View | Viewpoint | 문서 |
|---|---|---|---|
| 1 | Use Case / Functional View | Behavioral(Use Case) | [01-domain/usecases.md](./01-domain/usecases.md) |
| 2 | Business Rules View | Business Rules | [01-domain/business-rules.md](./01-domain/business-rules.md) |
| 3 | Glossary View | Ubiquitous Language | [01-domain/glossary.md](./01-domain/glossary.md) |
| 4 | Data / ERD View | Data(ERD) | [02-data/erd.md](./02-data/erd.md), [02-data/tables.md](./02-data/tables.md) |
| 5 | Process / Sequence View | Behavioral | [03-process/sequences.md](./03-process/sequences.md) |
| 6 | Interface View | Interface | [04-interface/api-and-actions.md](./04-interface/api-and-actions.md) |
| 7 | C4 Context / Container / Component View | C4 L1~L3 | [05-architecture/c4-context.md](./05-architecture/c4-context.md), [05-architecture/c4-container.md](./05-architecture/c4-container.md), [05-architecture/c4-component.md](./05-architecture/c4-component.md) |
| 8 | Quality View | Quality | [06-quality/quality-attributes.md](./06-quality/quality-attributes.md) |

## 4. 표준 준수 매핑 (ISO/IEC/IEEE 42010:2022)

| 42010 개념 | 요구사항 | 본 AD에서의 실현 |
|---|---|---|
| Architecture Description (AD) | SOI에 대한 아키텍처를 문서로 표현 | 본 문서 + `docs/architecture/**` 전체 |
| Stakeholder | 이해관계자 식별 | [00-overview/stakeholders.md](./00-overview/stakeholders.md) |
| Concern | 관심사 식별 및 이해관계자와 연결 | [00-overview/concerns.md](./00-overview/concerns.md), 본문 §2 |
| Architecture Viewpoint | 관점(규약: 관심사·표기법·규칙) 정의 | [00-overview/viewpoints.md](./00-overview/viewpoints.md) |
| Architecture View | 각 Viewpoint를 따르는 View 산출 | 본문 §3 View 목록 문서들 |
| View ↔ Viewpoint 대응 | 모든 View는 하나의 Viewpoint를 따름 | 각 문서 프런트매터의 "IEEE 42010 역할/Viewpoint" 필드 |
| Concern → View 커버리지 | 모든 Concern은 ≥1개 View로 다뤄짐 | 본문 §2 관계표 + [concerns.md](./00-overview/concerns.md) |
| Correspondence / Correspondence Rule | View 간 일관성 규칙 | BFF 4계층 규약, `attendance` 스키마 단일화, 코드 근거(파일 경로) 명시 규칙 — 각 View 프런트매터의 "근거" 필드로 상호 추적 |
| Architecture Rationale | 설계 근거 | [06-quality/quality-attributes.md](./06-quality/quality-attributes.md)의 트레이드오프 표, 각 View의 코드 근거 |

> **AD 완결성 원칙**: 본 AD의 모든 View는 실제 코드베이스(파일 경로·함수명·RPC·마이그레이션)에 근거하며, 코드에 없는 규칙/구조는 기술하지 않거나 "부재"로 명시한다.
