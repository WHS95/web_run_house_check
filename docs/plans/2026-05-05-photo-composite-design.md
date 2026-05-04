# 단체 사진 합성 기능 설계 (Photo Composite)

- 작성일: 2026-05-05
- 대상: `/app/admin2/photo-composite` (운영진 전용)
- 상태: 설계 승인 완료, 실행 계획 수립 예정

## 목적

운영진이 모임/정모에서 찍은 단체 사진에 크루 로고(또는 즉석 업로드한 PNG)를 워터마크처럼 얹어 다운로드할 수 있게 한다. 캔바와 같이 자유 배치도 가능하지만, 90% 케이스는 프리셋 한두 번 탭으로 끝나도록 하이브리드 UX로 설계한다. 결과물은 서버에 저장하지 않고 다운로드만 한다.

## 결정 사항 요약

| 항목 | 값 | 비고 |
|---|---|---|
| 합성 방식 | 하이브리드 (프리셋 기본 + 직접 조정 모드) | Q1=C |
| 결과물 사용처 | 다운로드 전용 (서버 저장 X) | Q2=A |
| 로고 소스 | 크루 로고 + 즉석 PNG 업로드 (메모리에서만) | Q3=B |
| 자유 배치 조작 | 드래그 + 비율잠금 리사이즈 + 회전 + 투명도 | Q4=B |
| 출력 사양 | 편집 1600px / 출력 2560px JPEG q0.92 | Q5=B |
| 자동 워터마크/타임스탬프 | 없음 | - |
| 사진 비율 | 원본 유지 (크롭 단계 없음) | - |
| 멀티 로고 | 미지원 (YAGNI) | - |
| Undo | 미지원, "원위치 리셋" 버튼만 | YAGNI |

## 기술 스택

- **Canvas 라이브러리**: `konva` ^9 + `react-konva` ^18
  - `Transformer` 컴포넌트가 드래그/비율잠금 리사이즈/회전 핸들 + 멀티터치 핀치를 모두 처리
  - 운영진 전용 라우트라 `next/dynamic({ ssr: false })`로 동적 로드 → 일반 사용자 첫 로드 영향 0
  - 번들 영향: ~140KB gzip, photo-composite 라우트 한정
- 대안 비교
  - `fabric.js`: 동등 기능이지만 ~250KB gzip + 명령형 API로 React 통합 어색 → 기각
  - HTMLCanvas + pointer events 직접 구현: 회전·핀치 직접 처리 비용이 너무 큼 → 기각

## 4계층 매핑 (BFF)

```
app/admin2/photo-composite/
├── page.tsx                       # RSC, 크루 로고 URL 조회 + ViewModel 전달
└── _components/
    ├── PhotoComposer.tsx          # 클라이언트 상위 (모드 토글 + 상태)
    ├── KonvaStage.tsx             # next/dynamic({ ssr: false })로 격리
    ├── PresetPanel.tsx            # 프리셋 모드 UI
    └── FreePanel.tsx              # 자유 배치 모드 UI

lib/domain/photo-composite/
├── types.ts                       # LogoTransform, PresetPosition 등
├── validators.ts                  # Zod: 업로드 파일 MIME/크기/차원
├── transforms.ts                  # 다운스케일 계산, 클램프, 프리셋 좌표
├── presets.ts                     # 5위치 × 3사이즈 좌표 매핑
├── transforms.test.ts             # Vitest 1:1
├── validators.test.ts
└── presets.test.ts
```

- `_vm/` 디렉토리 미사용: 데이터 페치 1쿼리 + 30줄 미만 → 도입 기준 미충족
- `actions.ts` 미사용: 다운로드 전용으로 서버 mutation 없음
- `app/api/` 사용 안 함 (BFF 룰)

## UX 플로우

```
[1] 사진 업로드
    ├─ <input type="file" accept="image/*" capture="environment">
    └─ 클라이언트에서 long-edge 1600px로 다운스케일 (편집용)
       ↓
[2] 프리셋 모드 (기본 진입)
    ├─ 5개 위치 그리드: ↖ ↗ ◯ ↙ ↘
    ├─ 크기: S(8%) / M(12%) / L(18%)  (사진 long-edge 기준)
    ├─ 투명도 슬라이더 (10~100%)
    ├─ 로고 소스 토글: "크루 로고" / "PNG 업로드"
    └─ [직접 조정] 버튼 → 모드 [3]으로 전환
       ↓
[3] 자유 배치 모드 (Konva Transformer)
    ├─ 드래그(이동), 꼭짓점 핸들(비율잠금 리사이즈), 회전 핸들/제스처
    ├─ 모바일: 핀치 줌 + 회전 동시 제스처 지원
    ├─ 투명도 슬라이더
    └─ [원위치 리셋] · [프리셋으로 복귀]
       ↓
[4] 저장 (다운로드)
    ├─ 출력 캔버스(2560px) 재합성 → JPEG q0.92 → blob
    ├─ Web Share API 사용 가능 → 공유 시트 (iOS/Android)
    ├─ 미지원 환경 → a[download] 폴백
    └─ 토스트: "이미지가 저장됐어요"
```

## 데이터 플로우

```
[client only]
  사진 File
    → createImageBitmap({ imageOrientation: 'from-image' })  # EXIF 회전 보정
    → 다운스케일 (long-edge 1600px) → editBitmap

  크루 로고 URL (props로 전달받음)
    → fetch → Blob → createImageBitmap → logoBitmap

  Konva Stage (editBitmap + logoBitmap, transform state)
    ↓
  [Save] 클릭
    → 오프스크린 캔버스(long-edge 2560px)에 사진 + 로고 재드로잉
    → canvas.toBlob('image/jpeg', 0.92)
    → URL.createObjectURL → Web Share / a.download
    → unmount 시 revokeObjectURL
```

서버 통신: 페이지 진입 시 크루 로고 URL 조회 1회만. 합성·다운로드 사이클 동안 0회.

## 도메인 함수 (한글 메소드명, 순수)

```ts
// transforms.ts
export function 다운스케일치수계산(
  src: { width: number; height: number },
  longEdge: number,
): { width: number; height: number };

export function 클램프적용하기(
  transform: LogoTransform,
  bounds: { width: number; height: number },
  logoSize: { width: number; height: number },
  minVisibleRatio: number,  // 0.5 = 50% 면적 유지
): LogoTransform;

// presets.ts
export function 프리셋좌표산출(
  position: PresetPosition,        // 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'
  size: PresetSize,                // 'S' | 'M' | 'L'
  photoSize: { width: number; height: number },
  logoAspectRatio: number,
): LogoTransform;

// validators.ts
export const 사진파일스키마 = z.object({...});  // MIME, size 검증
export function 사진업로드검증(file: File): ValidationResult;
```

`lib/domain/`은 Supabase/Next/React import 금지 — 모두 순수 함수.

## 에러 / 엣지 케이스

| 케이스 | 처리 |
|---|---|
| 로고 미등록 크루 | 프리셋 모드 진입 시 안내 + "PNG 업로드"로 폴백 |
| HEIC 사진 (구형 iOS) | `createImageBitmap` 미지원 → 안내 토스트, reject |
| 너무 작은 사진 (long-edge < 800px) | 화질 경고 토스트, 진행은 허용 |
| EXIF 회전 사진 | `imageOrientation: 'from-image'`으로 자동 보정 |
| 로고 PNG가 아님 | Zod 검증으로 차단 (image/png만 허용) |
| 사진 파일 > 20MB | 검증 단에서 reject (다운스케일 전 메모리 안전) |
| Web Share API 미지원 | a[download] 폴백 |
| 메모리 압박 (저사양 안드로이드) | 편집 1600px 고정으로 첫 메모리 피크 제한 + export 직후 캔버스 dispose |

## 테스트 전략

- **단위 테스트** (Vitest 1:1):
  - `transforms.test.ts` — 다운스케일 비율, 클램프 경계, 다양한 사진 비율
  - `presets.test.ts` — 5위치 × 3사이즈 좌표 정확성, 가로/세로/정사각 사진
  - `validators.test.ts` — MIME/크기 경계값
- **단위 테스트 제외**: Konva Stage 자체는 jsdom에서 캔버스 미지원으로 단위 테스트 불가 → 도메인 순수 함수만 검증
- **수동 QA**: iPhone Safari + Android Chrome 실기에서 멀티터치/회전 제스처 + 다운로드 흐름 확인

## 보안 / RLS

- 크루 로고 URL 조회: 기존 `crews` RLS 정책 내에서 동작 (운영진은 본인 크루만 조회)
- 합성·다운로드는 클라이언트 only → 서비스롤 미사용, RLS 경계 영향 없음
- 즉석 PNG 업로드: `URL.createObjectURL`로 메모리에서만 사용, unmount 시 `revokeObjectURL` (메모리 누수 방지)
- 합성 결과물도 서버 저장 X → 개인정보 처리 범위 확장 없음

## 성능 가드레일

- Konva 번들은 운영진 라우트 한정 동적 로드 → 일반 사용자 첫 로드 영향 0
- 편집 캔버스 1600px 고정 → 저사양 단말도 60fps 드래그 유지
- 출력 캔버스(2560px)는 export 직전에만 생성 → 메모리 피크 짧음, 직후 dispose
- 사진 업로드 직후 원본 File 참조 해제 → GC 유도

## 의존성 변경

- 추가: `konva@^9`, `react-konva@^18`
- `next.config.js` 변경 없음 (Konva는 `<img>` 직접 로드, Next/Image 미사용)
- 새 Supabase 버킷 추가 없음 (기존 `crewLogos` 읽기만)

## 메뉴 통합

`/app/admin2/menu/page.tsx`의 `menuItems` 배열에 항목 1개 추가:

```tsx
{
  title: "단체 사진 합성",
  subtitle: "사진에 크루 로고 얹기",
  href: "/admin2/photo-composite",
  // 기존 패턴에 맞는 아이콘
}
```

## 빌드 게이트

`npm run build`가 다음을 모두 통과해야 한다:
- `check:bff` (BFF 4계층 룰)
- `vitest` (도메인 단위 테스트)
- `lint` (ESLint 룰 1~6)
- `typecheck`
- `next build`

## 다음 단계

- `superpowers:writing-plans` 스킬로 단계별 실행 계획 작성 (`docs/plans/2026-05-05-photo-composite-plan.md`)
- 실행 계획에서는 다음을 포함:
  - Step 0: 의존성 설치 + 도메인 레이어 스켈레톤 + 테스트
  - Step 1: 페이지 + RSC + 클라이언트 컴포넌트 골격
  - Step 2: 사진 업로드 + 다운스케일
  - Step 3: 프리셋 모드 합성
  - Step 4: 자유 배치 모드 (Konva Transformer)
  - Step 5: 저장/공유 + Web Share API
  - Step 6: 메뉴 통합 + QA
