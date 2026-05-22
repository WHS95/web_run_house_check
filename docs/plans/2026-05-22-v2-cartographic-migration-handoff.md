# v2 라임 카토그래픽 마이그레이션 핸드오프

작성: 2026-05-22 / 브랜치: `real`

## 목적
RunHouse 사용자(User) 영역 10페이지를 Anthropic Design Service Map(`sc-*` 사양)의
v2 라임 카토그래픽 디자인으로 재구성. 토큰/폰트/공통 UI는 Phase 1에서 일괄 전환했고,
Phase 2는 페이지 단위로 진행 중.

## 완료된 커밋 (시간 순, 가장 최근이 위)

| # | 해시 | 대상 |
|---|------|------|
| 9 | `d61aead5` | `/notifications/notice/[id]` (sc-notice-det) |
| 8 | `1f03ff56` | `/mypage/edit` (sc-my-edit) |
| 7 | `43ae82b2` | `/mypage` (sc-my) |
| 6 | `24c490ac` | `/mypage/settings` (sc-my-set) |
| 5 | `9d5ef1ce` | `/notifications` (sc-notif) |
| 4 | `abbdf160` | `/menu` (sc-menu) |
| 3 | `2f280bcb` | components/ui v2 토큰 정합화 (button/badge/input/select) |
| 2 | `4c0cdf08` | Inter / Archivo / JetBrains Mono 폰트 + themeColor |
| 1 | `eabcec94` | 디자인 토큰 v2 (라임 카토그래픽) 전면 전환 |

## 남은 작업 (다음 세션)

### Phase 2 — 페이지 재구성 4개

| 페이지 | 사양 | 디자인 ref | 난이도 | 주요 작업 |
|--------|------|------------|--------|----------|
| `/` (홈) | sc-home | `/tmp/design_pkg4/runhouse/project/js/user.js` #1 | 高 | 라임 Hero CTA + contour SVG + 공지 box + 2열 통계 + 28일 heatmap(14열). 기존 `ClientHomePage` 와 RPC `get_home_page_data` 보존 |
| `/attendance` | sc-att | user.js #2 | 高 | 미니맵 + GPS 핀(점선 원) + chip(장소/운동/시간) + 라임 풀버튼. 출석 등록 액션 보존 |
| `/ranking` | sc-rank | user.js #3 | 高 | tabs(출석/개설) + chip(월 필터) + TOP 3 podium(1위 xl lime + 2/3위 lg) + YOU lime tint row |
| `/map` | sc-map | user.js #4 | 中 | 풀스크린 map + 라임 핀 + dim 핀 + 우측 +/-/타겟 컨트롤 + 하단 floating 카드. `MapBottomSheet` 도 재구성 |

### Phase 3 — 빌드 검증
- `npm run typecheck` (필수)
- `npm run lint` (warn 신규 발생 확인)
- `npm run test` (도메인 단위 테스트 회귀 없는지)
- `npm run build` (배포 직전 풀빌드)

### 후속 cleanup (별도 PR 권장, 차단 사항 아님)

리뷰어가 batch 2에서 지적한 비차단 제안:

- **S1 (우선)**: `components/templates/MemberDetailTemplate.tsx` L113/L166/L177 의 `new Date()` 3곳에 `mounted` 게이트 추가 (hydration mismatch 가능성). 패턴은 `app/page.tsx` 또는 `components/templates/NotificationsTemplate.tsx`의 `timeFor` 참고.
- **S2**: `MemberDetailTemplate`의 `participationRate` 산식 검토 — 월초에 0~3% 만 나오는 문제. 분모를 `min(today, daysInMonth)`로 변경 또는 모임 수 기준으로 재정의. 디자이너 확인 필요.
- **S4**: `app/mypage/edit/page.tsx` L119/L135/L141/L189 의 `alert()` 4곳을 `AlertDialog` 로 통일.
- **S6**: `app/notifications/notice/[id]/page.tsx` 의 chip 라벨이 DB enum "공지" → 표시 "모임" 으로 매핑되는 부분. 디자인 의도 확인 후 enum 자체를 바꾸거나 매핑 유지 결정.

## 작업 패턴 (다음 세션이 따를 것)

PM 오케스트레이션 모드 (메모리 `feedback_pm_orchestration` 참조):
1. 페이지 1~3개를 묶어서 작업 에이전트(general-purpose, opus)에 병렬 위임
2. 모두 완료되면 코드 리뷰 에이전트(`superpowers:code-reviewer`)로 일괄 검증
3. PASS 시 페이지당 1개 atomic 커밋 (한국어, prefix `refactor(/path):`)
4. FAIL 시 작업 에이전트에 재위임

### 작업 에이전트 브리핑 템플릿
앞선 batch 1/2에서 효과적이었던 브리핑 구조:
- 작업 디렉토리 명시
- 컨텍스트 (v2 전환 단계 + 이미 완료된 페이지들 = 패턴 레퍼런스)
- 디자인 스펙 (user.js 해당 섹션 발췌 그대로)
- 현재 코드 위치 (`app/<route>/page.tsx` + 관련 템플릿 컴포넌트)
- 작업 순서 (읽기 → 기능 보존 확인 → UI 교체 → typecheck)
- 절대 규칙 (하드코딩 hex 금지 / `position:fixed` 금지 / BottomNavigation 직접 import 금지 / 한글 함수명은 `lib/domain/`에만)
- 산출물 형식 (변경 파일 + diff 요약 + typecheck + 기능 보존 체크리스트)
- git add/commit 금지 (PM이 처리)

### 디자인 토큰 빠른 참조
- 라임: `bg-rh-accent`, `text-rh-accent` (#B8D964)
- 라임 위 텍스트: `text-rh-text-inverted` (#1a1e0a) ← 필수
- 배경: `bg-rh-bg-primary` (#15181E), 컴포넌트: `bg-rh-bg-surface`
- 텍스트: `text-rh-text-primary/secondary/tertiary/muted`
- 테두리: `border-rh-border`, `border-rh-border-strong`
- Status (블루 톤): `text-rh-status-success/warning/error`
- 헬퍼 클래스 (globals.css 정의): `rh-eye`, `rh-eye-lime`, `rh-display`, `rh-mono`, `rh-chip[data-on]`, `rh-box`, `rh-box-tight`, `rh-box-alt`, `rh-heat`, `rh-heat-cell.l1~l4`, `rh-contour`, `rh-sep-dash`, `rh-live`

### 디자인 소스
- HTML 번들: `/tmp/design_pkg4/runhouse/project/`
- User 영역 사양: `/tmp/design_pkg4/runhouse/project/js/user.js` (10개 화면 #1~#11, 본 핸드오프와 동일 인덱싱)
- 토큰 ref: `/tmp/design_pkg4/runhouse/project/styles.css`

⚠ `/tmp`는 재부팅 시 사라질 수 있음. 필요하면 Anthropic Design API에서 재다운로드:
`https://api.anthropic.com/v1/design/h/_D1kwo0vkSI5SbOTRibVCw?open_file=RunHouse+Service+Map.html`
(WebFetch는 gzip 반환 → `tar -xf`로 압축 해제 필요)
