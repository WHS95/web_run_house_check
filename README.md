# RunHouse 앱

러닝 커뮤니티 앱 "RunHouse"의 홈 화면 구현 프로젝트입니다.

## 기술 스택

- **프레임워크**: Next.js (App Router)
- **스타일링**: Tailwind CSS
- **백엔드**: Supabase

## 실행 방법

1. 환경 변수 설정
   - `.env.local` 파일을 프로젝트 루트에 생성하고 아래 내용 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL=NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase_anon_key
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 개발 서버 실행
   ```bash
   npm run dev
   ```

4. 브라우저에서 `http://localhost:3000` 열기

## 폴더 구조

- `app/`: Next.js App Router 페이지
- `components/`: Atomic Design 패턴 기반 컴포넌트
  - `atoms/`: 기본 UI 요소 (버튼, 인풋 등)
  - `molecules/`: 아톰의 조합 (카드, 알림 배너 등)
  - `organisms/`: 복잡한 컴포넌트 (헤더, 푸터 등)
  - `templates/`: 페이지 레이아웃
- `lib/`: 유틸리티 및 라이브러리
- `public/`: 정적 파일 (이미지, 아이콘 등) 