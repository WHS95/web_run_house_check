# 2026-05-28 카토그래픽 전면 리빌드 플랜

**기반 레퍼런스**: `/Users/whs-95/Desktop/RunningCrewMap` 디자인 시스템
**현재 상태**: 라임 v2 마이그레이션 완료(`real` 브랜치) — 라임 #B8D964 + 쿨다크 #15181E
**목표**: RunningCrewMap의 *지도 잉크* 절제(웜다크 + 고채도 라임 + 헤어라인 only + 전수치 mono + kicker 패턴)로 강화

## 핵심 차이 요약

| 영역 | 현재 | 타겟 |
|---|---|---|
| 라임 채도 | `#B8D964` (sage, 58% sat) | `#C7FF00` (100% sat) |
| 다크 톤 | `#15181E` (쿨/블루) | `#0B0C0A` (웜/잉크) |
| 인설 | `#1A1E25` | `#141512` (warm) |
| 서피스 | `#21262E` | `#1A1B19` 또는 유지(검토) |
| 보더 | `--rh-border: #2E333D` (혼용) | `rgba(242,242,238,.08)` 시스템 통일 |
| 수치 mono | 부분 | 전면 (모든 카운트/거리/페이스/태그) |
| Kicker | `rh-eye` 부분 | 컴포넌트화(`KickerLabel`) + 0.22em tracking 강제 |

## 페이즈

### Phase A — Foundation (토큰 + 폰트 정합)
**커밋 1건**: `refactor(theme): 카토그래픽 토큰 — 웜다크 + 고채도 라임`

- `app/styles/globals.css` 토큰 교체
  - `--rh-board: #101318 → #0B0C0A`
  - `--rh-bg-primary: #15181E → #0B0C0A`
  - `--rh-bg-inset: #1A1E25 → #141512`
  - `--rh-accent: #B8D964 → #C7FF00`
  - `--rh-accent-hover: #9CBA4A → #A8CC00`
  - `--rh-accent-soft: #D4E899 → #B8D964`  (옛 accent를 soft 역할로)
  - 신규 `--rh-rule: rgba(242,242,238,.08)` (헤어라인 표준)
- shadcn HSL(`--background`/`--card`/`--border`) 동기
- `metadata.themeColor` `#15181E → #0B0C0A`
- 빠른 확인: 모든 페이지 시각 회귀 점검

**리스크**: 라임 채도 점프(58→100%). 일부 페이지의 라임 카드(Hero, 메달, 칩)가 더 "튀게" 보임. 미리보기 필요.

### Phase B — Cartographic Primitives (atoms 도입)
**커밋 1건**: `feat(components): 카토그래픽 원자 컴포넌트 9종`

`components/atoms/cartographic/` 신규:
1. `KickerLabel` — 9px mono uppercase, `tracking-[0.22em]`, lime/muted tone
2. `MonoMetric` — value(mono) + unit(9px, 60% opacity)
3. `HairlineRow` — `border-rh-rule` 1px 분리자
4. `CoordPair` — `LAT 37.55 / LNG 127.04` 9px mono
5. `StatGrid` — 3-up KPI strip(상/하 헤어라인 + 세로 1px)
6. `TagPill` — outline/solid/ghost variants, 8-9px mono
7. `LimeCTA` — 라임 풀와이드 + 우측 mono hint
8. `GhostIconButton` — 38×38 surface + hairline, stroke-only icon
9. `CartographicHeader` — kicker + display title + 선택적 우측 액션

기존 helper(`rh-eye`, `rh-mono`, `rh-live`)는 deprecated 처리하고 컴포넌트 안에서 흡수.

### Phase C — User 페이지 적용 (4개)
**페이지당 1커밋** (atomic, 총 4건):
1. `refactor(/): KickerLabel/LimeCTA로 Hero 재구성`
2. `refactor(/attendance): MonoMetric/CoordPair/HairlineRow 적용`
3. `refactor(/ranking): StatGrid/MonoMetric/CartographicHeader`
4. `refactor(/map): GhostIconButton/HairlineRow/CoordPair`

### Phase D — 보조 페이지 (8개)
**페이지당 1커밋**:
- `/menu`, `/notifications`, `/mypage`, `/mypage/edit`, `/mypage/settings`, `/notifications/notice/[id]`, `/calculator`, `/auth/*`

### Phase E — Admin (admin2 + 관리자 페이지)
**섹션당 1커밋**: `/admin2/users`, `/admin2/attendance`, `/admin2/analyze`, `/admin2/notice` 등

### Phase F — Cleanup
**커밋 1건**:
- Deprecated helper 제거(`rh-eye`, `rh-live` 등 미사용)
- `rh-border` → `rh-rule` 마이그레이션
- 인라인 hex 잔재 정리

## 검증

각 페이즈 종료 시:
- `npm run typecheck`
- `npm run lint`
- `npm run check:bff`
- `npm run test:domain`
- `superpowers:code-reviewer` PASS

Phase A 종료 직후 사용자 시각 확인(스크린샷).

## 비용 추정

| 페이즈 | 커밋 수 | 추정 |
|---|---|---|
| A | 1 | 작음 |
| B | 1 | 중간 |
| C | 4 | 중간 |
| D | 8 | 큼 |
| E | 4~6 | 큼 |
| F | 1 | 작음 |
| **합계** | **19~21** | 다세션 작업 |

## 진행 방식

PM 오케스트레이션 — 각 페이즈마다:
1. 작업 에이전트(opus, general-purpose) 디스패치
2. `superpowers:code-reviewer` 리뷰 → PASS면 커밋
3. 페이즈 종료 후 사용자 확인 → 다음 페이즈

**Phase A 단독 선행 권장**: 토큰만 바뀌어도 톤 자체가 카토그래픽으로 이동하므로, A 끝나고 사용자가 시각 결과 보고 다음 페이즈 진행/조정 결정.
