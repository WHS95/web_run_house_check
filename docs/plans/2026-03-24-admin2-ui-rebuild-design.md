# Admin2 UI 전체 리빌드 디자인 문서

## 개요
admin2 페이지 전체를 .pen 디자인 기준으로 리빌드한다.
백엔드 로직(Supabase 쿼리, 서버 액션)은 유지하고 프론트엔드 UI만 교체한다.

## 접근 방식
**컴포넌트 우선 (Component-first)**
1. .pen 디자인에서 공통 컴포넌트를 추출하여 먼저 생성
2. 각 페이지를 공통 컴포넌트로 조립

## 디렉토리 구조
```
app/admin2/components/
  ui/                    ← 공통 UI 컴포넌트
  dashboard/             ← 대시보드 전용
  attendance/            ← 출석 관리 전용
  user/                  ← 회원 관리 전용
  analytics/             ← 통계 분석 전용
  settings/              ← 설정 전용
  notice/                ← 공지사항 전용
  push/                  ← 푸시 알림 전용
  crew-edit/             ← 크루 편집 전용
```

## 공통 컴포넌트 목록

### 기존 유지
| 컴포넌트 | 경로 |
|---|---|
| PageHeader | organisms/common/PageHeader |
| AdminBottomNavigation | organisms/AdminBottomNavigation |
| Switch | ui/switch |

### 신규 생성 (admin2/components/ui/)
| 컴포넌트 | .pen 대응 | 용도 |
|---|---|---|
| AdminStatCard | Dashboard stat cards | 숫자 통계 카드 (90px, bg-surface, 라운드12) |
| AdminListItem | Component/ListItem | 메뉴/목록 아이템 (chevron 포함) |
| AdminSearchBar | Component/SearchBar | 검색 입력 (44px, bg-surface, 라운드md) |
| AdminTabBar | Component/TabBar | 탭 전환 (bg-surface, 라운드md, 40px) |
| AdminLabeledInput | Component/Input/Labeled | 라벨 + 인풋 필드 |
| AdminSelect | Component/Select | 드롭다운 선택 (48px, chevron-down) |
| AdminBadge | Component/Badge 3종 | accent / outline / muted 변형 |
| AdminDivider | Component/Divider | 1px 구분선 |
| AttendanceRow | Component/AttendanceRow | 상태dot + 이름 + 장소/시간 + 배지 |
| AdminSmallButton | Component/Button/Small | 작은 액션 버튼 (32px, 라운드md) |
| AdminSwitchRow | Component/SwitchRow | 라벨 + Switch 행 (52px, bg-surface) |
| AdminModal | Component/Modal | 모달 (bg-surface, 라운드xl, 24px 패딩) |
| AdminAlertDialog | Component/AlertDialog | 확인/취소 다이얼로그 |
| AdminMonthNav | Dashboard/Attendance | 월 네비게이션 (< 2026년 2월 >) |
| NoticeCard | AdminNotice 전용 | 배지 + 날짜 + 제목 + 설명 카드 |
| PushHistoryItem | AdminPush 전용 | 발송 내역 아이템 |

## 페이지별 구성

### 1. Dashboard (/admin2)
- PageHeader("관리자 대시보드")
- AdminMonthNav
- AdminStatCard × 3 (전체 멤버, 월 출석, 호스트)
- SectionLabel("관리 메뉴")
- AdminListItem × 4

### 2. User (/admin2/user)
- PageHeader("회원 관리", backLink)
- AdminSearchBar
- CountRow + AdminSmallButton("필터")
- UserCard 리스트 (bg-surface, 유저 정보 + 배지)

### 3. Attendance (/admin2/attendance)
- PageHeader("출석 관리", backLink)
- AdminMonthNav
- CalendarGrid (7일 × N주)
- DateLabel + AdminSmallButton("일괄 등록")
- AttendanceRow × N

### 4. Analytics (/admin2/analyze)
- PageHeader("통계 분석", backLink)
- YearMonthSelector
- DayChart, PlaceChart, OverallCard (bg-surface 카드)

### 5. Settings (/admin2/settings)
- PageHeader("설정", backLink)
- AdminTabBar(장소 | 운영진 | 초대코드)
- 탭별 콘텐츠

### 6. Menu (/admin2/menu)
- PageHeader("메뉴")
- SectionLabel("관리 기능")
- AdminListItem × 5

### 7. Notice (/admin2/notice) — 신규
- PageHeader("공지사항 관리", backLink)
- CountRow + AdminSmallButton("+ 새 공지")
- NoticeCard × N

### 8. Push (/admin2/push) — 신규
- PageHeader("푸시 알림 발송", backLink)
- AdminSelect("발송 대상")
- AdminLabeledInput("알림 제목")
- TextArea("알림 내용")
- Button/Primary("알림 발송")
- AdminDivider
- PushHistoryItem × N

### 9. Crew-Edit (/admin2/crew-edit) — 신규
- PageHeader("크루 정보 편집", backLink)
- LogoSection (80px 원형)
- AdminLabeledInput × 3
- TextArea("크루 소개")
- AdminDivider
- InfoRow × 2 (생성일, 현재 인원)
- Button/Primary("저장")

### 10. Grade (/admin2/settings/grade)
- PageHeader("설정", backLink)
- AdminTabBar(장소 | 운영진 | 초대코드 | 등급)
- SubTabBar(등급 설정 | 추천 확인 | 수동 지정)
- 서브탭별 콘텐츠

## 디자인 시스템 준수 사항
- 모든 색상: CSS 변수(--rh-*) 또는 Tailwind 클래스(bg-rh-*, text-rh-*) 사용
- 금지 색상: #4ADE80(초록), #FBBF24(노랑), #F87171(빨강)
- fixed 포지셔닝 금지, sticky top-0 사용
- animate-pulse 스켈레톤 금지 (정적 플레이스홀더)
- 리스트: AnimatedList/AnimatedItem 적용
- 비리스트 콘텐츠: FadeIn 래퍼
- hydration 방지: mounted 패턴 사용

## 데이터 흐름
기존 패턴 유지:
- 서버 컴포넌트 (page.tsx) → Supabase 쿼리 → props → 클라이언트 컴포넌트
- 서버 액션 (mutations) → revalidatePath
