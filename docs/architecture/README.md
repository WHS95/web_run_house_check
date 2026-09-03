# RunHouse 아키텍처 문서 지도

RunHouse(런하우스)는 러닝크루 출석/크루 관리 PWA다. 회사 코어 미션은 **러닝크루 운영진의 출석 관리를 도와 커스텀 러닝 의류 구매로 연결**하는 것이다.

이 디렉터리는 `web_run_house_check` 시스템의 아키텍처를 **ISO/IEC/IEEE 42010:2022** 프레임을 따라 기술한다. AD 전체 개요와 표준 준수 매핑은 [architecture-description.md](./architecture-description.md)를 먼저 참조한다.

---

## 문서 지도

### 00-overview — 42010 골격 (이해관계자·관심사·관점)
| 문서 | 한 줄 설명 |
|---|---|
| [00-overview/stakeholders.md](./00-overview/stakeholders.md) | 이해관계자 카탈로그 — 역할·주요 관심사·코드 근거 |
| [00-overview/concerns.md](./00-overview/concerns.md) | 관심사(Concern) 목록과 이를 다루는 View 매핑 |
| [00-overview/viewpoints.md](./00-overview/viewpoints.md) | 관점(Viewpoint) 정의 — 각 View의 표기법·규칙·산출 위치 |

### 01-domain — 도메인 (유비쿼터스 언어·규칙·유스케이스)
| 문서 | 한 줄 설명 |
|---|---|
| [01-domain/glossary.md](./01-domain/glossary.md) | 도메인 용어집 — 한글 용어 ↔ 코드/DB(`attendance` 스키마) 1:1 고정 |
| [01-domain/business-rules.md](./01-domain/business-rules.md) | 코드로 강제되는 비즈니스 규칙과 근거 파일(2단계 인증·권한·캐시 규약) |
| [01-domain/usecases.md](./01-domain/usecases.md) | 액터별 주요 유스케이스와 실제 Server Action/RPC 실행 흐름 |

### 02-data — 데이터 뷰
| 문서 | 한 줄 설명 |
|---|---|
| [02-data/erd.md](./02-data/erd.md) | 데이터 ERD — `attendance` 스키마 엔티티와 관계 |
| [02-data/tables.md](./02-data/tables.md) | 테이블 상세 — 컬럼/제약/설명 (코드·RPC·마이그레이션 관측 기준) |

### 03-process — 프로세스(런타임) 뷰
| 문서 | 한 줄 설명 |
|---|---|
| [03-process/sequences.md](./03-process/sequences.md) | 핵심 시퀀스 플로우 — 출석 등록·가입·권한(위조방지/접근제어) |

### 04-interface — 인터페이스 뷰
| 문서 | 한 줄 설명 |
|---|---|
| [04-interface/api-and-actions.md](./04-interface/api-and-actions.md) | 서비스 경계 카탈로그 — HTTP 라우트 + Server Action 규약과 인증 요건 |

### 05-architecture — C4 구조 뷰
| 문서 | 한 줄 설명 |
|---|---|
| [05-architecture/c4-context.md](./05-architecture/c4-context.md) | C4 L1 System Context — 사람·외부 SaaS 경계 |
| [05-architecture/c4-container.md](./05-architecture/c4-container.md) | C4 L2 Container — 배포/실행 단위와 BFF 4계층 흐름 |
| [05-architecture/c4-component.md](./05-architecture/c4-component.md) | C4 L3 Component — 컨테이너 내부 모듈 ↔ 실제 파일 경로 |

### 06-quality — 품질 뷰
| 문서 | 한 줄 설명 |
|---|---|
| [06-quality/quality-attributes.md](./06-quality/quality-attributes.md) | 품질속성별 실현 방식·코드 근거·트레이드오프(성능·보안·가용성·PWA) |

---

## 읽는 순서 가이드

1. **처음 오는 사람** → [architecture-description.md](./architecture-description.md)로 AD 전체 구조와 42010 매핑 파악.
2. **골격 이해** → 00-overview의 [stakeholders](./00-overview/stakeholders.md) → [concerns](./00-overview/concerns.md) → [viewpoints](./00-overview/viewpoints.md) 순으로 "누가·무엇을·어떤 관점으로" 파악.
3. **도메인 언어 습득** → [glossary](./01-domain/glossary.md) → [business-rules](./01-domain/business-rules.md) → [usecases](./01-domain/usecases.md).
4. **구조 파악** → 05-architecture의 [context](./05-architecture/c4-context.md) → [container](./05-architecture/c4-container.md) → [component](./05-architecture/c4-component.md) (큰 것에서 작은 것으로).
5. **데이터·인터페이스** → [erd](./02-data/erd.md)/[tables](./02-data/tables.md), [api-and-actions](./04-interface/api-and-actions.md).
6. **동작 이해** → [sequences](./03-process/sequences.md)로 런타임 흐름 추적.
7. **품질/트레이드오프** → [quality-attributes](./06-quality/quality-attributes.md).

> 목적별 진입: 신규 개발자는 4→6, 데이터 작업자는 5, 통합/API 작업자는 4-interface, 운영/QA는 6-quality를 우선 참조.
