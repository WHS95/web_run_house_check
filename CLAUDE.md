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

### ⚠️ 레이아웃 규칙 (CRITICAL)

루트 레이아웃(`app/layout.tsx`)이 **flex column** 구조로 바텀 내비를 자동 관리합니다.

**루트 레이아웃 구조:**
```
html, body (overflow: hidden, overscroll-behavior: none)
  └── mobile-viewport (flex column, height: 100dvh, overflow: hidden)
        ├── main-content (flex: 1, overflow-y: auto, overscroll-behavior-y: contain)  ← 유일한 스크롤 영역
        │     └── {children} (각 페이지)
        └── ConditionalBottomNav (shrink-0)            ← 자동 배치
```

**반드시 지켜야 할 규칙:**
1. **`<BottomNavigation />`을 개별 페이지에서 렌더링하지 마세요.** 루트 레이아웃의 `ConditionalBottomNav`이 자동으로 처리합니다.
   - 예외: `ConditionalBottomNav`이 숨기는 페이지(`/admin`, `/auth/*`, `/map`)에서 자체 바텀 내비가 필요한 경우만 허용
2. **`scroll-area-bottom` 클래스는 더 이상 필요하지 않습니다.** `main-content`가 자동으로 바텀 내비 위 영역만 차지합니다.
3. **페이지에서 `min-h-screen` 사용 시 자동으로 `main-content` 높이 기준으로 변환됩니다.** (CSS에서 `100%`로 오버라이드)
4. **페이지 내부 스크롤 컨테이너가 필요한 경우**, `flex-1 overflow-y-auto`를 사용하되 바텀 패딩은 불필요합니다.
5. **헤더는 반드시 `sticky top-0`을 사용하세요.** `main-content`가 스크롤 컨테이너이므로 `fixed`가 아닌 `sticky`만 올바르게 동작합니다.
6. **스크롤은 `.main-content`에서만 발생해야 합니다.** `html`, `body`, `.mobile-viewport`는 모두 `overflow: hidden`이므로 스크롤 불가. 이를 통해 모바일에서 격한 스크롤 시에도 헤더/바텀이 흔들리지 않습니다 (네이티브 앱 동작).
   - 페이지 내부에 별도 스크롤 컨테이너를 만들 때는 반드시 `overscroll-behavior: contain`을 추가하세요.
   - `position: fixed` → **사용 금지** (스크롤 컨테이너 내부에서 의도대로 작동하지 않음)
   - `position: sticky; top: 0;` → **올바른 패턴** (스크롤 시 헤더가 상단에 고정)
   - 헤더에 `fixed`를 쓰면 `pt-[80px]` 같은 상단 여백 hack이 필요하지만, `sticky`는 자연스럽게 공간을 차지하므로 불필요

**올바른 페이지 구조 예시:**
```tsx
// ✅ 올바른 패턴
export default function MyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* 헤더: sticky top-0 (PageHeader는 이미 내장) */}
            <PageHeader title="제목" />
            <div className="flex-1 px-4 pt-4 pb-4">
                {/* 콘텐츠 */}
            </div>
            {/* BottomNavigation 불필요 - 루트 레이아웃이 자동 처리 */}
        </div>
    );
}

// ❌ 잘못된 패턴
export default function MyPage() {
    return (
        <div>
            <div className="fixed top-0">  {/* fixed 금지! sticky 사용 */}
                <PageHeader title="제목" />
            </div>
            <div className="pt-[80px]">  {/* fixed 헤더용 hack 불필요 */}
                {/* 콘텐츠 */}
            </div>
            <BottomNavigation />  {/* 중복! 절대 하지 마세요 */}
        </div>
    );
}
```

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

### ⚠️ 애니메이션 규칙 (CRITICAL)

루트 레이아웃에 **PageTransition** (Framer Motion, 0.15초 fade-in)이 적용되어 있습니다. 모든 페이지 전환 시 자동으로 fade-in됩니다.

**반드시 지켜야 할 규칙:**

1. **페이지 레벨 스켈레톤(Suspense fallback, loading.tsx, dynamic import loading)에서 `animate-pulse` 사용 금지**
   - PageTransition fade-in과 animate-pulse가 동시에 실행되면 시각적 충돌 발생
   - 스켈레톤은 정적 플레이스홀더(배경색만)로 구현할 것
   - 예외: 클라이언트 컴포넌트 내부의 `isLoading` 상태 스켈레톤은 페이지 전환 후 실행되므로 `animate-pulse` 사용 가능

2. **리스트형 UI에는 `AnimatedList` + `AnimatedItem` 사용**
   - `import { AnimatedList, AnimatedItem } from '@/components/atoms/AnimatedList'`
   - stagger 효과: 항목당 0.05초 간격으로 순차 등장
   - 적용 대상: 랭킹 리스트, 활동 내역, 멤버 목록 등 반복 렌더링 리스트

3. **콘텐츠 등장 시 `FadeIn` 래퍼 사용**
   - `import FadeIn from '@/components/atoms/FadeIn'`
   - Suspense 해소 후 콘텐츠가 마운트될 때 0.2초 fade-in
   - 적용 대상: 폼, 상세 페이지 등 비리스트 콘텐츠

4. **새 페이지 추가 시 애니메이션 체크리스트**
   - [ ] PageTransition이 자동 적용되므로 별도 페이지 전환 애니메이션 불필요
   - [ ] Suspense fallback 스켈레톤에 `animate-pulse` 없는지 확인
   - [ ] 리스트가 있으면 `AnimatedList`/`AnimatedItem` 적용
   - [ ] 비리스트 콘텐츠는 `FadeIn`으로 감싸기

```tsx
// ✅ 올바른 스켈레톤 (정적)
const MySkeleton = () => (
    <div className="space-y-3">
        <div className="h-12 rounded-xl bg-rh-bg-surface" />
        <div className="h-12 rounded-xl bg-rh-bg-surface" />
    </div>
);

// ❌ 잘못된 스켈레톤 (PageTransition과 충돌)
const MySkeleton = () => (
    <div className="space-y-3 animate-pulse">
        <div className="h-12 rounded-xl bg-rh-bg-surface" />
    </div>
);

// ✅ 리스트 애니메이션
<AnimatedList className="space-y-2">
    {items.map(item => (
        <AnimatedItem key={item.id}>
            <ListItemComponent {...item} />
        </AnimatedItem>
    ))}
</AnimatedList>
```

### Hydration 에러 방지 (CRITICAL)
- **`new Date()` 등 시간 기반 계산**은 서버/클라이언트 간 값이 달라 hydration 불일치를 유발합니다.
  - 반드시 `mounted` 상태를 사용하여 클라이언트에서만 시간 계산을 수행하세요.
  - SSR 시에는 고정된 포맷(예: `formatDate`)을 반환하고, mount 후 상대 시간으로 전환합니다.
  ```typescript
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // mounted 전: formatDate(dateStr) / mounted 후: "30분 전"
  ```
- **`nextDynamic`의 `ssr` 옵션**: Suspense boundary 내에서 `ssr: false`를 사용하면 hydration 에러가 발생할 수 있습니다.
  - 가능하면 `ssr: true` (기본값)를 사용하세요.
  - `ssr: false`가 필요하면 Suspense boundary 밖에서 사용하세요.
- **조건부 렌더링**: 서버와 클라이언트에서 다른 결과를 내는 조건(window, localStorage, 현재 시간 등)은 `useEffect` + `useState`로 클라이언트에서만 처리하세요.

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

/* Status (블루 톤 테마 — 아래 값만 사용!) */
--rh-status-success: #8BB5F5;
--rh-status-warning: #5580C0;
--rh-status-error: #3E6496;
```

### ⛔ 색상 사용 금지 규칙 (CRITICAL)
**프로젝트 전체에서 아래 컬러풀 색상은 절대 사용 금지입니다.**
절대 하드코딩하거나 인라인 style로 사용하지 마세요.

| 금지 색상 | 대체 색상 (블루 톤) | Tailwind 클래스 |
|-----------|---------------------|-----------------|
| ~~#4ADE80~~ (초록) | #8BB5F5 | `bg-rh-status-success`, `text-rh-status-success` |
| ~~#FBBF24~~ (노랑) | #5580C0 | `bg-rh-status-warning`, `text-rh-status-warning` |
| ~~#F87171~~ (빨강) | #3E6496 | `bg-rh-status-error`, `text-rh-status-error` |

**이유:** RunHouse는 블루 톤 다크 테마를 사용합니다. 원색 계열(초록/노랑/빨강)은 디자인 시스템에 맞지 않습니다.

**반드시 지켜야 할 원칙:**
- 모든 색상은 `globals.css`에 정의된 CSS 변수(`--rh-*`)만 사용
- 인라인 `style={{ color: '#xxx' }}` 대신 Tailwind 클래스(`bg-rh-*`, `text-rh-*`) 사용
- 새로운 색상이 필요하면 globals.css에 변수로 추가하고 사용자에게 확인 받을 것

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