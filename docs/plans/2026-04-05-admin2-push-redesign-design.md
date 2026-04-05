# Admin2 Push 화면 리빌드 설계

**날짜:** 2026-04-05
**대상:** `/admin2/push` 페이지
**기반 디자인:** `런하우스출석-관리자.pen`
- `Screen/AdminPush-Selected` (bowdH)
- `Screen/AdminPush-SelectMembers` (FRJSo)

## 목적

현재 "전체 크루원"만 지원하는 푸시 발송 화면을 `.pen` 디자인에 맞춰 "전체 / 선택" 모드 토글로 확장한다. 멤버 선택 바텀시트를 구현하여 특정 크루원에게만 푸시를 발송할 수 있게 한다.

## 백엔드

**변경 없음.** `POST /api/push/test`가 이미 `userIds[]` 파라미터를 받아 해당 사용자 토큰에만 발송한다.

- **전체 모드**: 프론트에서 `/api/admin/users?crewId=X`로 크루원 목록 조회 후 모든 ID를 POST
- **선택 모드**: 선택된 ID만 POST

## 신규 컴포넌트

모두 `app/admin2/components/ui/`에 작성하여 디자인 시스템에 포함시킨다.

### ① `AdminSegmentedControl.tsx`
2-way iOS 세그먼트 컨트롤. 활성 탭에 `bg-rh-accent`, 비활성은 투명. 배지 카운트 지원.

```ts
interface Option { value: string; label: string; badge?: number }
interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}
```

### ② `AdminAvatar.tsx`
이니셜 원형 아바타. `first_name.charAt(0)`을 표시하고 `bg-rh-bg-muted`를 배경으로 쓴다.

```ts
interface Props { name: string; size?: number }  // 기본 36px
```

### ③ `AdminMemberChip.tsx`
pill 모양. 작은 아바타(20px) + 이름 + ✕ 버튼. `bg-rh-bg-surface` + `border-rh-border`.

```ts
interface Props { name: string; onRemove: () => void }
```

### ④ `AdminMemberPickerSheet.tsx`
Framer Motion slide-up 바텀시트. `absolute inset-0 z-[100]`에 dim 배경.

구성:
- 드래그 핸들
- 타이틀 "크루원 선택" + "전체 선택" 토글 링크
- `AdminSearchBar` (이름 검색, 클라이언트 필터링)
- 체크박스 리스트 (아바타 + 이름 + "크루원" 서브텍스트)
- 하단 확정 버튼 "N명 선택 완료"

```ts
interface Member { id: string; name: string }
interface Props {
  open: boolean;
  onClose: () => void;
  members: Member[];
  selectedIds: Set<string>;
  onConfirm: (ids: Set<string>) => void;
}
```

**동작:**
- 시트 내부 `draftSelected` state 유지 → 확정 버튼 눌러야 상위로 전달
- 전체 선택: 검색 필터 무시하고 전체 멤버 토글
- 검색은 `name.includes(query)` 단순 필터링

## `PushManagement.tsx` 리팩토링

```ts
const [mode, setMode] = useState<"all" | "select">("all");
const [members, setMembers] = useState<Member[]>([]);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [pickerOpen, setPickerOpen] = useState(false);

useEffect(() => {
  fetch(`/api/admin/users?crewId=${crewId}`)
    .then(res => res.json())
    .then(json => json?.success && setMembers(json.data));
}, [crewId]);

const targetIds = mode === "all"
  ? members.map(m => m.id)
  : Array.from(selectedIds);

const canSend = title.trim() && body.trim()
  && targetIds.length > 0 && !isSending;
```

**UI 구조:**
```
AdminSegmentedControl [전체 | 선택 N]
  ↓ mode === "select"인 경우에만
  ├ 드롭다운 버튼 "크루원 선택 (N명)" → pickerOpen = true
  └ 선택된 멤버 AdminMemberChip 리스트 (wrap, 제거 가능)
AdminLabeledInput (제목)
textarea (내용)
알림 발송 버튼
AdminDivider
최근 발송 내역 (기존 유지)

[오버레이] AdminMemberPickerSheet
```

## 엣지 케이스

- 크루원 API 실패: `members=[]`, 선택 모드 버튼 disabled
- 선택 모드인데 0명: 발송 버튼 disabled
- 발송 후 선택 초기화 **안 함** (반복 발송 편의)
- 푸시 토큰 없는 멤버 선택: 백엔드에서 자동 제외되므로 무시

## 파일 변경 목록

**신규:**
- `app/admin2/components/ui/AdminSegmentedControl.tsx`
- `app/admin2/components/ui/AdminAvatar.tsx`
- `app/admin2/components/ui/AdminMemberChip.tsx`
- `app/admin2/components/ui/AdminMemberPickerSheet.tsx`

**수정:**
- `app/admin2/components/ui/index.ts` (신규 컴포넌트 export)
- `app/admin2/push/components/PushManagement.tsx` (전면 리팩토링)

## 검증

- `npm run build` 통과 (타입/린트 에러 없음)
- 전체 모드 발송 동작 확인
- 선택 모드: 바텀시트 열기 → 검색 → 체크 → 확정 → 칩 표시 → 발송 동작 확인
- 모바일 레이아웃 확인 (390px 기준)
