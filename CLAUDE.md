# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
RunHouse는 러닝 커뮤니티 관리 앱으로, Next.js (App Router)와 Supabase를 사용하여 구축된 출석 관리 및 크루 관리 시스템입니다.

## 주요 명령어

### 개발 서버 실행
```bash
npm run dev
```

### 빌드 및 배포
```bash
npm run build
npm run start
```

### 린트 검사
```bash
npm run lint
```

### 린트 및 타입 검사 (권장)
빌드 과정에서 자동으로 린트와 타입 검사가 실행됩니다. 코드 작성 후 반드시 다음 명령어로 확인하세요:
```bash
npm run build
```

## 기술 스택
- **프레임워크**: Next.js 14 (App Router)
- **스타일링**: Tailwind CSS + Radix UI
- **백엔드**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **상태 관리**: React Context API
- **폼 검증**: Zod + React Hook Form
- **애니메이션**: Framer Motion

## 아키텍처 구조

### 디렉토리 구조 (Atomic Design)
```
/app                 # Next.js App Router 페이지
  /admin            # 관리자 페이지 (크루 관리)
  /api              # API 라우트
  /auth             # 인증 관련 페이지
  /calculator       # 러닝 계산기 도구
/components         # Atomic Design 패턴
  /atoms            # 기본 UI 요소
  /molecules        # 아톰 조합
  /organisms        # 복잡한 컴포넌트
  /templates        # 페이지 레이아웃
  /ui               # shadcn/ui 컴포넌트
/lib                # 유틸리티 및 서비스
  /supabase         # Supabase 관련 로직
  /validators       # Zod 스키마
```

### 데이터베이스 구조
- **스키마**: `attendance` 스키마 사용
- **주요 테이블**: `users`, `crews`, `user_crews`, `attendance_records`, `crew_invite_codes`
- **최적화**: PostgreSQL 함수 사용 (예: `get_admin_users_unified`)

### 인증 시스템
1. **Next.js 미들웨어**: 모든 보호된 라우트에서 인증 확인
2. **2단계 인증**: 
   - Supabase Auth (기본 인증)
   - 크루 인증 (`is_crew_verified`)
3. **공개 라우트**: `/auth/*`, `/api/*`, `/_next/*`

### 관리자 시스템
- **AdminContextProvider**: 관리자 전용 컨텍스트 제공
- **크루 관리**: 사용자 관리, 출석 관리, 통계 분석
- **권한 관리**: 크루별 분리된 데이터 접근

## 주요 개발 패턴

### Supabase 클라이언트 사용
```typescript
// 서버 컴포넌트
import { createClient } from "@/lib/supabase/server";

// 클라이언트 컴포넌트
import { createClient } from "@/lib/supabase/client";

// 관리자 기능
import { createClient } from "@/lib/supabase/admin";
```

### API 라우트 구조
- **서버 액션**: `"use server"` 지시문 사용
- **에러 핸들링**: 일관된 에러 응답 구조
- **타입 안전성**: TypeScript 인터페이스 활용

### 컴포넌트 패턴
- **서버 컴포넌트**: 데이터 페칭 및 초기 렌더링
- **클라이언트 컴포넌트**: 인터랙티브 기능
- **Context API**: 상태 관리 (AdminContext 등)

## 중요 규칙

### 코딩 컨벤션
- 4 스페이스 들여쓰기
- 80자 줄 길이 제한
- 한국어 주석 및 에러 메시지
- 명확한 변수/함수명 사용

### 보안 가이드라인
- 환경 변수에 민감 정보 저장
- 입력 값 검증 및 살균
- SQL 인젝션 방지
- XSS 공격 방지

### 성능 최적화
- 데이터베이스 쿼리 최적화
- 불필요한 API 호출 최소화
- 대용량 데이터 페이지네이션
- 비동기 처리 활용

## 주요 기능 모듈

### 관리자 기능 (`/lib/supabase/admin.ts`)
- 크루 관리 함수
- 사용자 관리 함수
- 출석 기록 관리
- 통계 및 분석 함수
- 활동 분석 시스템

### 인증 시스템 (`/lib/supabase/`)
- 크루 인증 (`crew-auth.ts`)
- 서버 클라이언트 (`server.ts`)
- 미들웨어 (`middleware.ts`)

### UI 컴포넌트
- **반응형 디자인**: 모바일 우선 설계
- **아코디언 UI**: 사용자 정보 관리
- **모달 시스템**: 팝업 및 폼 인터페이스
- **차트 시스템**: 통계 시각화

## 개발 시 주의사항

### Supabase MCP 사용
- 데이터 관련 기능 구현 시 Supabase MCP 도구 활용
- 신규 기능 개발 시 context 7 참조

### 테스트 및 배포
- 코드 변경 후 반드시 `npm run build`로 빌드 테스트
- 타입 에러 및 린트 에러 해결 필수
- 모바일 환경 테스트 필수

## Design Rules

### ⚠️ 디자인 시스템 필수 준수 규칙 (CRITICAL)
- **모든 UI 구현은 반드시 `.pen` 파일의 디자인 시스템을 기반으로 해야 합니다.**
- 새로운 UI 컴포넌트를 만들기 전, `.pen` 파일에서 해당 컴포넌트가 정의되어 있는지 확인하세요.
- `.pen` 파일에 정의된 컴포넌트가 있다면, 해당 디자인의 색상, 크기, 간격, 폰트 등을 **정확히** 코드에 반영하세요.
- `.pen` 파일에 해당 디자인이 **없는 경우**, 임의로 디자인하지 말고 **사용자에게 먼저 물어보세요.**
  - 예: "이 컴포넌트는 .pen 디자인 시스템에 정의되어 있지 않습니다. 디자인을 추가하시겠습니까, 아니면 기존 스타일을 기반으로 구현할까요?"
- 기존에 정의된 공통 컴포넌트(`Switch`, `Button`, `Card` 등)가 있다면 **인라인 코드 대신 해당 컴포넌트를 재사용**하세요.

### 디자인 시스템 컴포넌트 매핑 (.pen → 코드)
| .pen 컴포넌트 | 코드 컴포넌트 | 경로 |
|---|---|---|
| Component/Switch/On, Off | `<Switch />` | `components/ui/switch.tsx` |
| Component/SwitchRow | SwitchRow 패턴 (bg-surface 카드 + Switch) | 인라인 패턴 |
| Component/Button/Primary | `bg-rh-accent` 버튼 | - |
| Component/Card/Default | `ios-card` 클래스 | globals.css |

### Color Palette (RunHouse Design Tokens)
RunHouse 프로젝트의 일관된 색상 시스템 (.pen 디자인 기준):

```css
/* Background */
--rh-bg-primary: #1D2530;    /* 기본 배경색 */
--rh-bg-inset: #1A2029;      /* 인셋 배경 */
--rh-bg-surface: #2B3644;    /* 컴포넌트, 헤더, 카드, 모달 */
--rh-bg-muted: #4C525E;      /* 보조 요소 */

/* Accent */
--rh-accent: #669FF2;        /* 강조 및 액션 버튼 */
--rh-accent-hover: #5A8FE0;  /* 호버 상태 */

/* Border */
--rh-border: #374151;        /* 기본 테두리 */
--rh-border-subtle: #1A2029; /* 미세 테두리 */

/* Text */
--rh-text-primary: #FFFFFF;
--rh-text-secondary: #94A3B8;
--rh-text-tertiary: #64748B;
--rh-text-muted: #475569;

/* Status */
--rh-status-success: #4ADE80;
--rh-status-warning: #FBBF24;
--rh-status-error: #F87171;
```

#### Tailwind 사용 규칙
- **기본 배경**: `bg-rh-bg-primary`
- **컴포넌트 배경**: `bg-rh-bg-surface` (헤더, 바텀네비, 카드, 모달 등)
- **텍스트**: `text-white` 또는 `text-rh-text-primary`
- **보조 텍스트**: `text-rh-text-secondary`, `text-rh-text-tertiary`
- **강조 요소**: `bg-rh-accent` (버튼, 링크, 하이라이트)
- **보조 요소**: `bg-rh-bg-muted` (비활성 상태, 보조 정보)
- **테두리**: `border-rh-border`
- **투명도**: `bg-rh-bg-primary/50`, `bg-rh-accent/20`

### UI Design Guidelines
Please design the project with a clean, modern, and consistent iOS-style interface.
	•	Follow Apple's Human Interface Guidelines: use rounded corners, soft shadows, clean layouts, and intuitive navigation.
	•	Use the shadcn/ui component library as the foundation for all UI elements.
	•	Style everything using TailwindCSS as much as possible — avoid custom CSS unless strictly necessary.
	•	Ensure visual and functional consistency across all pages:
	•	Unified dark-mode color palette (위의 색상 가이드라인 준수)
	•	Standardized typography and spacing
	•	Smooth transitions and system-like interactions
	•	Always build with responsive design in mind.
	•	Optimize for both mobile and desktop screens.
	•	Layouts and components must adapt gracefully to different screen sizes.
	•	Prioritize mobile user experience:
	•	Ensure good touch targets, spacing, and performance on mobile
	•	Design interactions to feel natural and intuitive on smartphones

The result should feel like a native iOS web app: elegant, lightweight, and user-focused.