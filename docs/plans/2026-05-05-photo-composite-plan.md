# 단체 사진 합성 기능 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 운영진이 `/admin2/photo-composite`에서 단체 사진을 업로드하고, 크루 로고(또는 즉석 PNG)를 프리셋 또는 자유 배치로 합성한 뒤 다운로드할 수 있게 한다.

**Architecture:** 다운로드 전용 — 서버 저장 없음. RSC가 활성 크루의 로고 URL만 1회 조회해 클라이언트로 넘기고, 모든 합성·export는 브라우저에서만 발생. Konva Stage(`react-konva`)는 `next/dynamic({ ssr: false })`로 격리해 일반 사용자 첫 로드에 영향 없음. 도메인 순수 함수는 `lib/domain/photo-composite/`에 두고 Vitest 1:1.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, `konva@^9` + `react-konva@^18` (신규), Zod (검증), Vitest (단위).

**설계 문서:** [`docs/plans/2026-05-05-photo-composite-design.md`](./2026-05-05-photo-composite-design.md)

---

## 진행 원칙

- **TDD**: 도메인 함수는 실패 테스트 → 최소 구현 → 통과 → 커밋 순서.
- **빈번한 커밋**: 각 Task 끝에 1커밋. 메시지는 한국어 (`feat(...)`, `chore(...)`).
- **빌드 게이트**: 큰 분기 변경 후 `npm run build`로 `check:bff` + `vitest` + `lint` + `typecheck` + `next build` 모두 통과 확인.
- **Korean methods**: `lib/domain/photo-composite/`의 함수는 한글, 외부에서 불릴 땐 `import * as 합성정책 from "..."`.

---

## Task 0: 의존성 설치 및 도메인 폴더 스캐폴드

**Files:**
- Modify: `package.json` (의존성 2개 추가)
- Create: `lib/domain/photo-composite/types.ts`
- Create: `lib/domain/photo-composite/index.ts` (배럴, 선택)

**Step 1: konva, react-konva 설치**

Run:
```bash
npm install konva@^9 react-konva@^18
```

Expected: `package.json`/`package-lock.json` 갱신, 에러 없음.

**Step 2: 타입 파일 생성**

Create `lib/domain/photo-composite/types.ts`:

```ts
/**
 * 단체 사진 합성 도메인 타입.
 *
 * 좌표계: 사진 좌상단 (0,0), 단위는 px (편집 캔버스 기준).
 * Konva Stage에 그대로 매핑되며, export 시 출력 캔버스 비율로 스케일된다.
 */

export type PresetPosition =
    | "top-left"
    | "top-right"
    | "center"
    | "bottom-left"
    | "bottom-right";

export type PresetSize = "S" | "M" | "L";

export const PRESET_SIZE_RATIO: Record<PresetSize, number> = {
    S: 0.08,
    M: 0.12,
    L: 0.18,
} as const;

export interface PhotoSize {
    width: number;
    height: number;
}

export interface LogoTransform {
    /** 로고 좌상단 X (편집 캔버스 px) */
    x: number;
    /** 로고 좌상단 Y (편집 캔버스 px) */
    y: number;
    /** 로고 너비 (편집 캔버스 px). 비율 잠금이라 height = width / aspectRatio */
    width: number;
    /** 회전 각도 (deg, 시계방향) */
    rotation: number;
    /** 투명도 (0~1) */
    opacity: number;
}

export type LogoSource =
    | { kind: "crew"; url: string }
    | { kind: "upload"; objectUrl: string };

export interface ComposeInput {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap;
    transform: LogoTransform;
    /** 출력 캔버스 long-edge px (예: 2560) */
    outputLongEdge: number;
}
```

**Step 3: 빌드 게이트 확인**

Run:
```bash
npm run typecheck
```

Expected: 에러 없음 (types.ts는 외부 의존 없음).

**Step 4: 커밋**

```bash
git add package.json package-lock.json lib/domain/photo-composite/types.ts
git commit -m "chore(photo-composite): konva 의존성 추가 + 도메인 타입 정의"
```

---

## Task 1: 다운스케일 계산 (도메인, TDD)

**Files:**
- Create: `lib/domain/photo-composite/transforms.ts`
- Create: `lib/domain/photo-composite/transforms.test.ts`

**Step 1: 실패 테스트 작성**

Create `lib/domain/photo-composite/transforms.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { 다운스케일치수계산 } from "./transforms";

describe("다운스케일치수계산", () => {
    it("long-edge가 한도 이하면 원본 유지", () => {
        const r = 다운스케일치수계산({ width: 1200, height: 800 }, 1600);
        expect(r).toEqual({ width: 1200, height: 800 });
    });

    it("가로 사진은 width 기준 축소, 비율 유지", () => {
        const r = 다운스케일치수계산({ width: 4000, height: 3000 }, 1600);
        expect(r).toEqual({ width: 1600, height: 1200 });
    });

    it("세로 사진은 height 기준 축소, 비율 유지", () => {
        const r = 다운스케일치수계산({ width: 3000, height: 4000 }, 1600);
        expect(r).toEqual({ width: 1200, height: 1600 });
    });

    it("정사각 사진은 양변 동일 축소", () => {
        const r = 다운스케일치수계산({ width: 3200, height: 3200 }, 1600);
        expect(r).toEqual({ width: 1600, height: 1600 });
    });

    it("결과 치수는 정수 (Math.round)", () => {
        const r = 다운스케일치수계산({ width: 4001, height: 3000 }, 1600);
        expect(Number.isInteger(r.width)).toBe(true);
        expect(Number.isInteger(r.height)).toBe(true);
    });
});
```

**Step 2: 테스트 실패 확인**

Run:
```bash
npx vitest run lib/domain/photo-composite/transforms.test.ts
```

Expected: FAIL — `Cannot find module './transforms'`.

**Step 3: 최소 구현**

Create `lib/domain/photo-composite/transforms.ts`:

```ts
import type { PhotoSize } from "./types";

/**
 * 사진 long-edge를 한도 이하로 줄인 새 치수 산출.
 * 비율 유지, 한도 이하면 원본 그대로 반환.
 */
export function 다운스케일치수계산(
    src: PhotoSize,
    longEdgeLimit: number,
): PhotoSize {
    const longEdge = Math.max(src.width, src.height);
    if (longEdge <= longEdgeLimit) return src;
    const ratio = longEdgeLimit / longEdge;
    return {
        width: Math.round(src.width * ratio),
        height: Math.round(src.height * ratio),
    };
}
```

**Step 4: 테스트 통과 확인**

Run:
```bash
npx vitest run lib/domain/photo-composite/transforms.test.ts
```

Expected: 5 passed.

**Step 5: 커밋**

```bash
git add lib/domain/photo-composite/transforms.ts lib/domain/photo-composite/transforms.test.ts
git commit -m "feat(photo-composite): 다운스케일치수계산 도메인 함수"
```

---

## Task 2: 클램프 로직 (도메인, TDD)

**Files:**
- Modify: `lib/domain/photo-composite/transforms.ts`
- Modify: `lib/domain/photo-composite/transforms.test.ts`

**Step 1: 실패 테스트 추가**

Append to `lib/domain/photo-composite/transforms.test.ts`:

```ts
import { 클램프적용하기 } from "./transforms";

describe("클램프적용하기", () => {
    const photo = { width: 1000, height: 800 };

    it("로고가 사진 안에 있으면 변경 없음", () => {
        const t = { x: 100, y: 100, width: 200, rotation: 0, opacity: 1 };
        const r = 클램프적용하기(t, photo, 1.0);
        expect(r.x).toBe(100);
        expect(r.y).toBe(100);
    });

    it("로고가 좌측 경계 밖이면 x를 음수 한도로 클램프", () => {
        // width=200, minVisibleRatio=0.5 → 최대 100px 빠질 수 있음
        const t = { x: -150, y: 100, width: 200, rotation: 0, opacity: 1 };
        const r = 클램프적용하기(t, photo, 1.0);
        expect(r.x).toBe(-100); // 50% 이상 보이도록
    });

    it("로고가 우측 경계 밖이면 우측 한도로 클램프", () => {
        const t = { x: 950, y: 100, width: 200, rotation: 0, opacity: 1 };
        const r = 클램프적용하기(t, photo, 1.0);
        // 사진 width=1000, 로고 right=x+width, 50% 이상 보여야 → x ≤ 1000 - 100 = 900
        expect(r.x).toBe(900);
    });

    it("aspect ratio로 height 계산해 상하 클램프", () => {
        // width 200, aspectRatio 1.0 → height 200, photo.height=800
        const t = { x: 100, y: 750, width: 200, rotation: 0, opacity: 1 };
        const r = 클램프적용하기(t, photo, 1.0);
        // 50% 이상 보여야 → y ≤ 800 - 100 = 700
        expect(r.y).toBe(700);
    });
});
```

**Step 2: 테스트 실패 확인**

Run:
```bash
npx vitest run lib/domain/photo-composite/transforms.test.ts
```

Expected: FAIL — `클램프적용하기` undefined.

**Step 3: 구현**

Append to `lib/domain/photo-composite/transforms.ts`:

```ts
import type { LogoTransform } from "./types";

/**
 * 로고가 사진 영역에서 너무 벗어나지 않도록 위치 보정.
 * minVisibleRatio (0~1): 로고의 최소 가시 면적 비율. 0.5면 절반은 안에 있어야.
 *
 * 회전은 보정하지 않는다 (회전된 로고의 정확한 bounding box는 비싸고,
 * 사용자 의도상 로고 절반만 보이는 정도는 허용).
 */
export function 클램프적용하기(
    t: LogoTransform,
    photo: PhotoSize,
    aspectRatio: number,
): LogoTransform {
    const minVisibleRatio = 0.5;
    const height = t.width / aspectRatio;
    const minXVisible = t.width * minVisibleRatio;
    const minYVisible = height * minVisibleRatio;
    const minX = -(t.width - minXVisible);
    const maxX = photo.width - minXVisible;
    const minY = -(height - minYVisible);
    const maxY = photo.height - minYVisible;
    return {
        ...t,
        x: Math.min(maxX, Math.max(minX, t.x)),
        y: Math.min(maxY, Math.max(minY, t.y)),
    };
}
```

**Step 4: 테스트 통과**

Run:
```bash
npx vitest run lib/domain/photo-composite/transforms.test.ts
```

Expected: 9 passed (5 + 4).

**Step 5: 커밋**

```bash
git add lib/domain/photo-composite/transforms.ts lib/domain/photo-composite/transforms.test.ts
git commit -m "feat(photo-composite): 클램프적용하기 (50% 가시 영역 보장)"
```

---

## Task 3: 프리셋 좌표 산출 (도메인, TDD)

**Files:**
- Create: `lib/domain/photo-composite/presets.ts`
- Create: `lib/domain/photo-composite/presets.test.ts`

**Step 1: 실패 테스트 작성**

Create `lib/domain/photo-composite/presets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { 프리셋좌표산출 } from "./presets";

const PHOTO = { width: 1600, height: 1200 };
const MARGIN = 32;

describe("프리셋좌표산출", () => {
    it("M 사이즈는 long-edge × 0.12 너비", () => {
        const r = 프리셋좌표산출("top-left", "M", PHOTO, 1.0);
        expect(r.width).toBeCloseTo(192); // 1600 * 0.12
    });

    it("S 사이즈는 long-edge × 0.08", () => {
        const r = 프리셋좌표산출("top-left", "S", PHOTO, 1.0);
        expect(r.width).toBeCloseTo(128);
    });

    it("L 사이즈는 long-edge × 0.18", () => {
        const r = 프리셋좌표산출("top-left", "L", PHOTO, 1.0);
        expect(r.width).toBeCloseTo(288);
    });

    it("top-left 위치는 (margin, margin)", () => {
        const r = 프리셋좌표산출("top-left", "M", PHOTO, 1.0);
        expect(r.x).toBe(MARGIN);
        expect(r.y).toBe(MARGIN);
    });

    it("top-right 위치는 사진 우측에 margin 띄움", () => {
        const r = 프리셋좌표산출("top-right", "M", PHOTO, 1.0);
        expect(r.x).toBeCloseTo(1600 - MARGIN - 192);
        expect(r.y).toBe(MARGIN);
    });

    it("center는 사진 중앙", () => {
        const r = 프리셋좌표산출("center", "M", PHOTO, 1.0);
        expect(r.x).toBeCloseTo((1600 - 192) / 2);
        expect(r.y).toBeCloseTo((1200 - 192) / 2);
    });

    it("bottom-left", () => {
        const r = 프리셋좌표산출("bottom-left", "M", PHOTO, 1.0);
        expect(r.x).toBe(MARGIN);
        expect(r.y).toBeCloseTo(1200 - MARGIN - 192);
    });

    it("bottom-right", () => {
        const r = 프리셋좌표산출("bottom-right", "M", PHOTO, 1.0);
        expect(r.x).toBeCloseTo(1600 - MARGIN - 192);
        expect(r.y).toBeCloseTo(1200 - MARGIN - 192);
    });

    it("회전 0, 투명도 1 기본", () => {
        const r = 프리셋좌표산출("top-left", "M", PHOTO, 1.0);
        expect(r.rotation).toBe(0);
        expect(r.opacity).toBe(1);
    });

    it("세로 사진은 short-edge가 아닌 long-edge(=height) 기준", () => {
        const portrait = { width: 1200, height: 1600 };
        const r = 프리셋좌표산출("top-left", "M", portrait, 1.0);
        expect(r.width).toBeCloseTo(192); // 1600 * 0.12
    });

    it("로고 비율이 다르면 height는 width/aspectRatio (배치는 width 기준)", () => {
        const r = 프리셋좌표산출("top-right", "M", PHOTO, 2.0);
        const height = 192 / 2.0; // 96
        // top-right이라 x는 width 기준만 봄
        expect(r.x).toBeCloseTo(1600 - MARGIN - 192);
        // bottom-right은 height도 봐야 함 → 별도 테스트
        const br = 프리셋좌표산출("bottom-right", "M", PHOTO, 2.0);
        expect(br.y).toBeCloseTo(1200 - MARGIN - height);
    });
});
```

**Step 2: 테스트 실패 확인**

Run:
```bash
npx vitest run lib/domain/photo-composite/presets.test.ts
```

Expected: FAIL — module not found.

**Step 3: 구현**

Create `lib/domain/photo-composite/presets.ts`:

```ts
import type {
    LogoTransform,
    PhotoSize,
    PresetPosition,
    PresetSize,
} from "./types";
import { PRESET_SIZE_RATIO } from "./types";

const PRESET_MARGIN = 32;

/**
 * 5개 프리셋 위치 × 3개 사이즈로 로고 transform 산출.
 * 로고 너비는 사진의 long-edge × 사이즈비율(8/12/18%).
 * height는 로고 비율(aspectRatio = width/height)에서 자동 계산.
 */
export function 프리셋좌표산출(
    position: PresetPosition,
    size: PresetSize,
    photo: PhotoSize,
    logoAspectRatio: number,
): LogoTransform {
    const longEdge = Math.max(photo.width, photo.height);
    const width = longEdge * PRESET_SIZE_RATIO[size];
    const height = width / logoAspectRatio;

    let x: number;
    let y: number;

    switch (position) {
        case "top-left":
            x = PRESET_MARGIN;
            y = PRESET_MARGIN;
            break;
        case "top-right":
            x = photo.width - PRESET_MARGIN - width;
            y = PRESET_MARGIN;
            break;
        case "center":
            x = (photo.width - width) / 2;
            y = (photo.height - height) / 2;
            break;
        case "bottom-left":
            x = PRESET_MARGIN;
            y = photo.height - PRESET_MARGIN - height;
            break;
        case "bottom-right":
            x = photo.width - PRESET_MARGIN - width;
            y = photo.height - PRESET_MARGIN - height;
            break;
    }

    return { x, y, width, rotation: 0, opacity: 1 };
}
```

**Step 4: 테스트 통과**

Run:
```bash
npx vitest run lib/domain/photo-composite/presets.test.ts
```

Expected: 11 passed.

**Step 5: 커밋**

```bash
git add lib/domain/photo-composite/presets.ts lib/domain/photo-composite/presets.test.ts
git commit -m "feat(photo-composite): 프리셋좌표산출 (5위치 × 3사이즈)"
```

---

## Task 4: 업로드 파일 검증 (도메인, TDD)

**Files:**
- Create: `lib/domain/photo-composite/validators.ts`
- Create: `lib/domain/photo-composite/validators.test.ts`

**Step 1: 실패 테스트 작성**

Create `lib/domain/photo-composite/validators.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { 사진업로드_검증, 로고업로드_검증 } from "./validators";

function makeFile(name: string, type: string, size: number): File {
    return new File([new Uint8Array(size)], name, { type });
}

describe("사진업로드_검증", () => {
    it("image/jpeg 5MB는 허용", () => {
        const r = 사진업로드_검증(makeFile("a.jpg", "image/jpeg", 5_000_000));
        expect(r.ok).toBe(true);
    });

    it("image/png 5MB는 허용", () => {
        const r = 사진업로드_검증(makeFile("a.png", "image/png", 5_000_000));
        expect(r.ok).toBe(true);
    });

    it("image/heic는 거부", () => {
        const r = 사진업로드_검증(makeFile("a.heic", "image/heic", 5_000_000));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toMatch(/HEIC|지원/);
    });

    it("20MB 초과는 거부", () => {
        const r = 사진업로드_검증(makeFile("a.jpg", "image/jpeg", 21_000_000));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toMatch(/20MB|크기/);
    });

    it("이미지 아닌 파일 거부", () => {
        const r = 사진업로드_검증(makeFile("a.txt", "text/plain", 100));
        expect(r.ok).toBe(false);
    });
});

describe("로고업로드_검증", () => {
    it("image/png는 허용", () => {
        const r = 로고업로드_검증(makeFile("logo.png", "image/png", 200_000));
        expect(r.ok).toBe(true);
    });

    it("image/jpeg는 거부 (PNG만 허용 — 투명도 보장)", () => {
        const r = 로고업로드_검증(makeFile("logo.jpg", "image/jpeg", 200_000));
        expect(r.ok).toBe(false);
    });

    it("5MB 초과는 거부", () => {
        const r = 로고업로드_검증(makeFile("l.png", "image/png", 6_000_000));
        expect(r.ok).toBe(false);
    });
});
```

**Step 2: 테스트 실패 확인**

Run:
```bash
npx vitest run lib/domain/photo-composite/validators.test.ts
```

Expected: FAIL — module not found.

**Step 3: 구현**

Create `lib/domain/photo-composite/validators.ts`:

```ts
/**
 * 단체사진/로고 업로드 입력 검증.
 *
 * MIME과 크기만 검증하고, 실제 디코딩 가능한지는 호출자가 createImageBitmap에서 판단.
 * (도메인 레이어는 브라우저 API에 의존하지 않는다.)
 */

const PHOTO_MAX_SIZE = 20 * 1024 * 1024; // 20MB
const LOGO_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const PHOTO_ALLOWED_MIME: ReadonlySet<string> = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const LOGO_ALLOWED_MIME: ReadonlySet<string> = new Set(["image/png"]);

export type ValidationResult =
    | { ok: true }
    | { ok: false; reason: string };

export function 사진업로드_검증(file: File): ValidationResult {
    if (file.type === "image/heic" || file.type === "image/heif") {
        return {
            ok: false,
            reason: "HEIC 형식은 아직 지원하지 않아요. JPG로 변환 후 올려주세요.",
        };
    }
    if (!PHOTO_ALLOWED_MIME.has(file.type)) {
        return { ok: false, reason: "이미지 파일만 업로드할 수 있어요." };
    }
    if (file.size > PHOTO_MAX_SIZE) {
        return { ok: false, reason: "사진 크기는 20MB 이하여야 해요." };
    }
    return { ok: true };
}

export function 로고업로드_검증(file: File): ValidationResult {
    if (!LOGO_ALLOWED_MIME.has(file.type)) {
        return { ok: false, reason: "PNG 파일만 업로드할 수 있어요." };
    }
    if (file.size > LOGO_MAX_SIZE) {
        return { ok: false, reason: "로고 크기는 5MB 이하여야 해요." };
    }
    return { ok: true };
}
```

**Step 4: 테스트 통과**

Run:
```bash
npx vitest run lib/domain/photo-composite/validators.test.ts
```

Expected: 8 passed.

**Step 5: 커밋**

```bash
git add lib/domain/photo-composite/validators.ts lib/domain/photo-composite/validators.test.ts
git commit -m "feat(photo-composite): 사진/로고 업로드 검증 (MIME, 크기)"
```

---

## Task 5: 페이지 라우트 + RSC 스캐폴드

**Files:**
- Create: `app/admin2/photo-composite/page.tsx`
- Create: `app/admin2/photo-composite/_components/PhotoComposer.tsx` (placeholder)

**Step 1: page.tsx 생성**

Create `app/admin2/photo-composite/page.tsx`:

```tsx
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getCrewSettingsData } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";

const PhotoComposer = dynamic(
    () => import("./_components/PhotoComposer"),
    {
        ssr: false,
        loading: () => <ComposerSkeleton />,
    },
);

export default async function PhotoCompositePage() {
    const { crewId } = await getAdminAuth();

    return (
        <>
            <PageHeader
                title='단체 사진 합성'
                backLink='/admin2/menu'
                iconColor='white'
                backgroundColor='bg-rh-bg-primary'
            />
            <Suspense fallback={<ComposerSkeleton />}>
                <PhotoComposeData crewId={crewId} />
            </Suspense>
        </>
    );
}

async function PhotoComposeData({ crewId }: { crewId: string }) {
    const { crew } = await getCrewSettingsData(crewId);
    return (
        <PhotoComposer
            crewName={crew?.name ?? ""}
            crewLogoUrl={crew?.profile_image_url ?? null}
        />
    );
}

function ComposerSkeleton() {
    return (
        <div className='flex-1 px-4 pt-6 space-y-4'>
            <div className='h-64 rounded-xl bg-rh-bg-surface' />
            <div className='h-12 rounded-lg bg-rh-bg-surface' />
            <div className='h-12 rounded-lg bg-rh-bg-surface' />
        </div>
    );
}
```

**Step 2: PhotoComposer placeholder**

Create `app/admin2/photo-composite/_components/PhotoComposer.tsx`:

```tsx
"use client";

interface Props {
    crewName: string;
    crewLogoUrl: string | null;
}

export default function PhotoComposer({ crewName, crewLogoUrl }: Props) {
    return (
        <div className='flex-1 px-4 pt-4 pb-4 space-y-4'>
            <div className='rounded-xl bg-rh-bg-surface p-4 text-rh-text-secondary text-sm'>
                {crewName} · 로고 {crewLogoUrl ? "있음" : "없음"}
            </div>
            <p className='text-rh-text-tertiary text-sm'>
                다음 Task에서 업로드/합성 UI가 들어갑니다.
            </p>
        </div>
    );
}
```

**Step 3: BFF 룰 + 빌드 통과 확인**

Run:
```bash
npm run check:bff && npm run typecheck && npm run lint
```

Expected: 모두 통과. (page.tsx에 `revalidatePath`/`revalidateTag` 미사용, `'use client'` 미사용 확인.)

**Step 4: 메뉴에 항목 추가**

Edit `app/admin2/menu/page.tsx` — `menuItems` 배열 끝에 추가:

```tsx
{
    title: "단체 사진 합성",
    subtitle: "사진에 크루 로고 얹기",
    href: "/admin2/photo-composite",
},
```

**Step 5: 빌드 통과 확인**

Run:
```bash
npm run typecheck && npm run lint
```

Expected: 통과.

**Step 6: 커밋**

```bash
git add app/admin2/photo-composite app/admin2/menu/page.tsx
git commit -m "feat(photo-composite): 페이지 라우트 + 메뉴 진입점 추가"
```

---

## Task 6: 사진 업로드 + 클라이언트 다운스케일

**Files:**
- Modify: `app/admin2/photo-composite/_components/PhotoComposer.tsx`
- Create: `app/admin2/photo-composite/_components/PhotoUploadStep.tsx`
- Create: `app/admin2/photo-composite/_lib/loadImage.ts` (브라우저 헬퍼)

**Step 1: 이미지 로딩 헬퍼**

Create `app/admin2/photo-composite/_lib/loadImage.ts`:

```ts
import { 다운스케일치수계산 } from "@/lib/domain/photo-composite/transforms";

/**
 * File → ImageBitmap 다운스케일.
 * EXIF 회전 자동 보정, long-edge 한도까지 축소.
 *
 * 도메인 함수(다운스케일치수계산)를 호출해 비율 계산만 위임받고,
 * 실제 디코딩/리사이즈는 브라우저 API에 위임.
 */
export async function loadAndDownscale(
    file: File,
    longEdgeLimit: number,
): Promise<ImageBitmap> {
    const original = await createImageBitmap(file, {
        imageOrientation: "from-image",
    });
    const { width, height } = 다운스케일치수계산(
        { width: original.width, height: original.height },
        longEdgeLimit,
    );
    if (width === original.width && height === original.height) {
        return original;
    }
    const resized = await createImageBitmap(original, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: "high",
    });
    original.close();
    return resized;
}

/**
 * 외부 URL → ImageBitmap (크루 로고용).
 * CORS는 Supabase public bucket이라 기본 허용.
 */
export async function loadImageFromUrl(url: string): Promise<ImageBitmap> {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`로고 로드 실패: ${res.status}`);
    const blob = await res.blob();
    return createImageBitmap(blob);
}
```

**Step 2: 업로드 UI 컴포넌트**

Create `app/admin2/photo-composite/_components/PhotoUploadStep.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { 사진업로드_검증 } from "@/lib/domain/photo-composite/validators";
import { loadAndDownscale } from "../_lib/loadImage";

interface Props {
    onLoaded: (bitmap: ImageBitmap) => void;
}

const EDIT_LONG_EDGE = 1600;

export default function PhotoUploadStep({ onLoaded }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function handleFile(file: File) {
        setError(null);
        const v = 사진업로드_검증(file);
        if (!v.ok) {
            setError(v.reason);
            return;
        }
        setBusy(true);
        try {
            const bitmap = await loadAndDownscale(file, EDIT_LONG_EDGE);
            onLoaded(bitmap);
        } catch {
            setError("사진을 불러올 수 없어요. 다른 파일을 시도해주세요.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className='flex-1 flex flex-col items-center justify-center px-4 gap-4'>
            <button
                type='button'
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className='w-full max-w-xs h-32 rounded-xl bg-rh-bg-surface border-2 border-dashed border-rh-border text-rh-text-secondary text-sm disabled:opacity-50'
            >
                {busy ? "불러오는 중…" : "단체 사진 선택"}
            </button>
            <input
                ref={inputRef}
                type='file'
                accept='image/*'
                capture='environment'
                className='hidden'
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
            {error && (
                <p className='text-rh-status-error text-sm text-center'>
                    {error}
                </p>
            )}
        </div>
    );
}
```

**Step 3: PhotoComposer에 통합**

Replace `app/admin2/photo-composite/_components/PhotoComposer.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import PhotoUploadStep from "./PhotoUploadStep";

interface Props {
    crewName: string;
    crewLogoUrl: string | null;
}

export default function PhotoComposer({ crewName, crewLogoUrl }: Props) {
    const [photoBitmap, setPhotoBitmap] = useState<ImageBitmap | null>(null);

    useEffect(() => {
        return () => {
            photoBitmap?.close();
        };
    }, [photoBitmap]);

    if (!photoBitmap) {
        return <PhotoUploadStep onLoaded={setPhotoBitmap} />;
    }

    return (
        <div className='flex-1 px-4 pt-4 pb-4 space-y-3'>
            <div className='text-rh-text-secondary text-sm'>
                {crewName} · 사진 {photoBitmap.width}×{photoBitmap.height}
            </div>
            <div className='aspect-video rounded-xl bg-rh-bg-surface flex items-center justify-center text-rh-text-tertiary text-sm'>
                다음 Task에서 합성 캔버스 진입
            </div>
            <button
                type='button'
                onClick={() => {
                    photoBitmap.close();
                    setPhotoBitmap(null);
                }}
                className='w-full h-12 rounded-lg bg-rh-bg-surface text-rh-text-primary'
            >
                다른 사진 선택
            </button>
        </div>
    );
}
```

**Step 4: dev 서버에서 수동 확인**

Run:
```bash
npm run dev
```

Visit http://localhost:3000/admin2/photo-composite — 사진 선택 → 치수 표시 확인 → 다른 사진 선택 동작 확인.

**Step 5: 빌드 통과**

Run:
```bash
npm run typecheck && npm run lint
```

Expected: 통과.

**Step 6: 커밋**

```bash
git add app/admin2/photo-composite
git commit -m "feat(photo-composite): 사진 업로드 + 다운스케일 (편집 1600px)"
```

---

## Task 7: 로고 로딩 (크루 로고 + 즉석 PNG 토글)

**Files:**
- Create: `app/admin2/photo-composite/_components/LogoSourcePicker.tsx`
- Modify: `app/admin2/photo-composite/_components/PhotoComposer.tsx`

**Step 1: 로고 소스 피커**

Create `app/admin2/photo-composite/_components/LogoSourcePicker.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { 로고업로드_검증 } from "@/lib/domain/photo-composite/validators";
import { loadImageFromUrl } from "../_lib/loadImage";
import type { LogoSource } from "@/lib/domain/photo-composite/types";

interface Props {
    crewLogoUrl: string | null;
    onSelected: (source: LogoSource, bitmap: ImageBitmap) => void;
}

export default function LogoSourcePicker({ crewLogoUrl, onSelected }: Props) {
    const [mode, setMode] = useState<"crew" | "upload">(
        crewLogoUrl ? "crew" : "upload",
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (mode !== "crew" || !crewLogoUrl) return;
        let cancelled = false;
        setBusy(true);
        setError(null);
        loadImageFromUrl(crewLogoUrl)
            .then((bitmap) => {
                if (cancelled) {
                    bitmap.close();
                    return;
                }
                onSelected({ kind: "crew", url: crewLogoUrl }, bitmap);
            })
            .catch(() => {
                if (!cancelled) setError("크루 로고를 불러올 수 없어요.");
            })
            .finally(() => {
                if (!cancelled) setBusy(false);
            });
        return () => {
            cancelled = true;
        };
    }, [mode, crewLogoUrl, onSelected]);

    async function handleFile(file: File) {
        setError(null);
        const v = 로고업로드_검증(file);
        if (!v.ok) {
            setError(v.reason);
            return;
        }
        setBusy(true);
        try {
            const objectUrl = URL.createObjectURL(file);
            const bitmap = await createImageBitmap(file);
            onSelected({ kind: "upload", objectUrl }, bitmap);
        } catch {
            setError("로고를 불러올 수 없어요.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className='space-y-2'>
            <div className='flex gap-2'>
                <button
                    type='button'
                    disabled={!crewLogoUrl}
                    onClick={() => setMode("crew")}
                    className={`flex-1 h-10 rounded-lg text-sm ${
                        mode === "crew"
                            ? "bg-rh-accent text-white"
                            : "bg-rh-bg-surface text-rh-text-secondary"
                    } disabled:opacity-40`}
                >
                    크루 로고
                </button>
                <button
                    type='button'
                    onClick={() => {
                        setMode("upload");
                        inputRef.current?.click();
                    }}
                    className={`flex-1 h-10 rounded-lg text-sm ${
                        mode === "upload"
                            ? "bg-rh-accent text-white"
                            : "bg-rh-bg-surface text-rh-text-secondary"
                    }`}
                >
                    PNG 업로드
                </button>
            </div>
            <input
                ref={inputRef}
                type='file'
                accept='image/png'
                className='hidden'
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
            {busy && (
                <p className='text-rh-text-tertiary text-xs'>
                    로고 불러오는 중…
                </p>
            )}
            {error && (
                <p className='text-rh-status-error text-xs'>{error}</p>
            )}
        </div>
    );
}
```

**Step 2: PhotoComposer에 LogoSourcePicker 통합**

Replace `app/admin2/photo-composite/_components/PhotoComposer.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import PhotoUploadStep from "./PhotoUploadStep";
import LogoSourcePicker from "./LogoSourcePicker";
import type { LogoSource } from "@/lib/domain/photo-composite/types";

interface Props {
    crewName: string;
    crewLogoUrl: string | null;
}

export default function PhotoComposer({ crewName, crewLogoUrl }: Props) {
    const [photoBitmap, setPhotoBitmap] = useState<ImageBitmap | null>(null);
    const [logoBitmap, setLogoBitmap] = useState<ImageBitmap | null>(null);
    const [logoSource, setLogoSource] = useState<LogoSource | null>(null);

    useEffect(() => {
        return () => {
            photoBitmap?.close();
            logoBitmap?.close();
            if (logoSource?.kind === "upload") {
                URL.revokeObjectURL(logoSource.objectUrl);
            }
        };
    }, [photoBitmap, logoBitmap, logoSource]);

    const handleLogoSelected = useCallback(
        (source: LogoSource, bitmap: ImageBitmap) => {
            setLogoBitmap((prev) => {
                prev?.close();
                return bitmap;
            });
            setLogoSource((prev) => {
                if (prev?.kind === "upload") {
                    URL.revokeObjectURL(prev.objectUrl);
                }
                return source;
            });
        },
        [],
    );

    if (!photoBitmap) {
        return <PhotoUploadStep onLoaded={setPhotoBitmap} />;
    }

    return (
        <div className='flex-1 px-4 pt-4 pb-4 space-y-3 overflow-y-auto'>
            <div className='text-rh-text-secondary text-xs'>
                {crewName} · {photoBitmap.width}×{photoBitmap.height}
            </div>
            <LogoSourcePicker
                crewLogoUrl={crewLogoUrl}
                onSelected={handleLogoSelected}
            />
            <div className='aspect-video rounded-xl bg-rh-bg-surface flex items-center justify-center text-rh-text-tertiary text-xs'>
                {logoBitmap
                    ? `로고 로드 완료 (${logoBitmap.width}×${logoBitmap.height})`
                    : "로고를 선택해주세요"}
            </div>
        </div>
    );
}
```

**Step 3: 수동 확인**

Run:
```bash
npm run dev
```

크루 로고 있는 계정으로 진입 → 자동 로드 확인. PNG 업로드 토글 → 다른 PNG 업로드 → 메모리에서만 사용 확인. JPG 업로드 시도 → 거부 메시지 확인.

**Step 4: 빌드 통과**

Run:
```bash
npm run typecheck && npm run lint
```

Expected: 통과.

**Step 5: 커밋**

```bash
git add app/admin2/photo-composite
git commit -m "feat(photo-composite): 크루 로고 + PNG 업로드 토글"
```

---

## Task 8: 프리셋 모드 합성 UI

**Files:**
- Create: `app/admin2/photo-composite/_components/PresetPanel.tsx`
- Create: `app/admin2/photo-composite/_components/KonvaStage.tsx`
- Modify: `app/admin2/photo-composite/_components/PhotoComposer.tsx`

**Step 1: KonvaStage 컴포넌트**

Create `app/admin2/photo-composite/_components/KonvaStage.tsx`:

```tsx
"use client";

import { Stage, Layer, Image as KonvaImage } from "react-konva";
import type { LogoTransform } from "@/lib/domain/photo-composite/types";

interface Props {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap | null;
    transform: LogoTransform | null;
    /** 컨테이너 가로 폭. height는 사진 비율로 계산 */
    containerWidth: number;
    /** 자유 배치 모드일 때만 onChange 호출, 프리셋 모드는 readonly */
    onTransformChange?: (next: LogoTransform) => void;
    selectable?: boolean;
}

export default function KonvaStage({
    photoBitmap,
    logoBitmap,
    transform,
    containerWidth,
}: Props) {
    const scale = containerWidth / photoBitmap.width;
    const stageHeight = photoBitmap.height * scale;

    return (
        <Stage
            width={containerWidth}
            height={stageHeight}
            scale={{ x: scale, y: scale }}
            style={{ touchAction: "none" }}
        >
            <Layer>
                <KonvaImage
                    image={photoBitmap as unknown as CanvasImageSource}
                    width={photoBitmap.width}
                    height={photoBitmap.height}
                    listening={false}
                />
                {logoBitmap && transform && (
                    <KonvaImage
                        image={logoBitmap as unknown as CanvasImageSource}
                        x={transform.x}
                        y={transform.y}
                        width={transform.width}
                        height={transform.width / (logoBitmap.width / logoBitmap.height)}
                        rotation={transform.rotation}
                        opacity={transform.opacity}
                        listening={false}
                    />
                )}
            </Layer>
        </Stage>
    );
}
```

**Step 2: PresetPanel**

Create `app/admin2/photo-composite/_components/PresetPanel.tsx`:

```tsx
"use client";

import type {
    PresetPosition,
    PresetSize,
} from "@/lib/domain/photo-composite/types";

const POSITIONS: { value: PresetPosition; label: string }[] = [
    { value: "top-left", label: "↖" },
    { value: "top-right", label: "↗" },
    { value: "center", label: "◯" },
    { value: "bottom-left", label: "↙" },
    { value: "bottom-right", label: "↘" },
];

const SIZES: PresetSize[] = ["S", "M", "L"];

interface Props {
    position: PresetPosition;
    size: PresetSize;
    opacity: number;
    onChange: (next: {
        position?: PresetPosition;
        size?: PresetSize;
        opacity?: number;
    }) => void;
    onEnterFreeMode: () => void;
}

export default function PresetPanel({
    position,
    size,
    opacity,
    onChange,
    onEnterFreeMode,
}: Props) {
    return (
        <div className='space-y-3 p-3 rounded-xl bg-rh-bg-surface'>
            <div>
                <p className='text-xs text-rh-text-tertiary mb-1.5'>위치</p>
                <div className='grid grid-cols-5 gap-1.5'>
                    {POSITIONS.map((p) => (
                        <button
                            key={p.value}
                            type='button'
                            onClick={() => onChange({ position: p.value })}
                            className={`h-10 rounded-md text-base ${
                                position === p.value
                                    ? "bg-rh-accent text-white"
                                    : "bg-rh-bg-muted text-rh-text-secondary"
                            }`}
                            aria-label={p.value}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className='text-xs text-rh-text-tertiary mb-1.5'>크기</p>
                <div className='grid grid-cols-3 gap-1.5'>
                    {SIZES.map((s) => (
                        <button
                            key={s}
                            type='button'
                            onClick={() => onChange({ size: s })}
                            className={`h-10 rounded-md text-sm ${
                                size === s
                                    ? "bg-rh-accent text-white"
                                    : "bg-rh-bg-muted text-rh-text-secondary"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className='text-xs text-rh-text-tertiary mb-1.5'>
                    투명도 {Math.round(opacity * 100)}%
                </p>
                <input
                    type='range'
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) =>
                        onChange({ opacity: Number(e.target.value) })
                    }
                    className='w-full accent-rh-accent'
                />
            </div>
            <button
                type='button'
                onClick={onEnterFreeMode}
                className='w-full h-10 rounded-md bg-rh-bg-muted text-rh-text-primary text-sm'
            >
                직접 조정
            </button>
        </div>
    );
}
```

**Step 3: PhotoComposer에 프리셋 통합**

Replace `app/admin2/photo-composite/_components/PhotoComposer.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhotoUploadStep from "./PhotoUploadStep";
import LogoSourcePicker from "./LogoSourcePicker";
import PresetPanel from "./PresetPanel";
import KonvaStage from "./KonvaStage";
import { 프리셋좌표산출 } from "@/lib/domain/photo-composite/presets";
import type {
    LogoSource,
    LogoTransform,
    PresetPosition,
    PresetSize,
} from "@/lib/domain/photo-composite/types";

interface Props {
    crewName: string;
    crewLogoUrl: string | null;
}

export default function PhotoComposer({ crewName, crewLogoUrl }: Props) {
    const [photoBitmap, setPhotoBitmap] = useState<ImageBitmap | null>(null);
    const [logoBitmap, setLogoBitmap] = useState<ImageBitmap | null>(null);
    const [logoSource, setLogoSource] = useState<LogoSource | null>(null);

    const [mode, setMode] = useState<"preset" | "free">("preset");
    const [presetPosition, setPresetPosition] =
        useState<PresetPosition>("bottom-right");
    const [presetSize, setPresetSize] = useState<PresetSize>("M");
    const [opacity, setOpacity] = useState(1);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                setContainerWidth(e.contentRect.width);
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [photoBitmap]);

    useEffect(() => {
        return () => {
            photoBitmap?.close();
            logoBitmap?.close();
            if (logoSource?.kind === "upload") {
                URL.revokeObjectURL(logoSource.objectUrl);
            }
        };
    }, [photoBitmap, logoBitmap, logoSource]);

    const handleLogoSelected = useCallback(
        (source: LogoSource, bitmap: ImageBitmap) => {
            setLogoBitmap((prev) => {
                prev?.close();
                return bitmap;
            });
            setLogoSource((prev) => {
                if (prev?.kind === "upload") {
                    URL.revokeObjectURL(prev.objectUrl);
                }
                return source;
            });
        },
        [],
    );

    const transform = useMemo<LogoTransform | null>(() => {
        if (!photoBitmap || !logoBitmap) return null;
        const aspectRatio = logoBitmap.width / logoBitmap.height;
        const t = 프리셋좌표산출(
            presetPosition,
            presetSize,
            { width: photoBitmap.width, height: photoBitmap.height },
            aspectRatio,
        );
        return { ...t, opacity };
    }, [photoBitmap, logoBitmap, presetPosition, presetSize, opacity]);

    if (!photoBitmap) {
        return <PhotoUploadStep onLoaded={setPhotoBitmap} />;
    }

    return (
        <div className='flex-1 px-4 pt-4 pb-4 space-y-3 overflow-y-auto'>
            <div className='text-rh-text-secondary text-xs'>{crewName}</div>
            <LogoSourcePicker
                crewLogoUrl={crewLogoUrl}
                onSelected={handleLogoSelected}
            />
            <div
                ref={containerRef}
                className='rounded-xl overflow-hidden bg-black'
            >
                {containerWidth > 0 && (
                    <KonvaStage
                        photoBitmap={photoBitmap}
                        logoBitmap={logoBitmap}
                        transform={transform}
                        containerWidth={containerWidth}
                    />
                )}
            </div>
            {mode === "preset" && (
                <PresetPanel
                    position={presetPosition}
                    size={presetSize}
                    opacity={opacity}
                    onChange={(next) => {
                        if (next.position) setPresetPosition(next.position);
                        if (next.size) setPresetSize(next.size);
                        if (next.opacity !== undefined)
                            setOpacity(next.opacity);
                    }}
                    onEnterFreeMode={() => setMode("free")}
                />
            )}
            {mode === "free" && (
                <div className='p-3 rounded-xl bg-rh-bg-surface text-rh-text-tertiary text-xs'>
                    자유 배치 모드는 다음 Task에서 활성화됩니다.
                    <button
                        type='button'
                        onClick={() => setMode("preset")}
                        className='mt-2 w-full h-9 rounded bg-rh-bg-muted'
                    >
                        프리셋으로 복귀
                    </button>
                </div>
            )}
        </div>
    );
}
```

**Step 4: 수동 확인**

Run:
```bash
npm run dev
```

사진 업로드 → 로고 로드 → 5위치 × 3사이즈 × 투명도 즉시 반영 확인. 모바일 뷰포트(개발자도구)에서도 컨테이너 width에 맞춰 사진 fit 확인.

**Step 5: 빌드 통과**

Run:
```bash
npm run typecheck && npm run lint
```

Expected: 통과.

**Step 6: 커밋**

```bash
git add app/admin2/photo-composite
git commit -m "feat(photo-composite): 프리셋 모드 합성 (5위치 × 3크기 × 투명도)"
```

---

## Task 9: 자유 배치 모드 (Konva Transformer)

**Files:**
- Modify: `app/admin2/photo-composite/_components/KonvaStage.tsx`
- Create: `app/admin2/photo-composite/_components/FreePanel.tsx`
- Modify: `app/admin2/photo-composite/_components/PhotoComposer.tsx`

**Step 1: KonvaStage에 Transformer 추가 (selectable 분기)**

Replace `app/admin2/photo-composite/_components/KonvaStage.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import type Konva from "konva";
import { 클램프적용하기 } from "@/lib/domain/photo-composite/transforms";
import type { LogoTransform } from "@/lib/domain/photo-composite/types";

interface Props {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap | null;
    transform: LogoTransform | null;
    containerWidth: number;
    onTransformChange?: (next: LogoTransform) => void;
    selectable?: boolean;
}

export default function KonvaStage({
    photoBitmap,
    logoBitmap,
    transform,
    containerWidth,
    onTransformChange,
    selectable = false,
}: Props) {
    const scale = containerWidth / photoBitmap.width;
    const stageHeight = photoBitmap.height * scale;
    const logoRef = useRef<Konva.Image>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (selectable && logoRef.current && trRef.current) {
            trRef.current.nodes([logoRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selectable, logoBitmap]);

    if (!logoBitmap || !transform) {
        return (
            <Stage
                width={containerWidth}
                height={stageHeight}
                scale={{ x: scale, y: scale }}
            >
                <Layer>
                    <KonvaImage
                        image={photoBitmap as unknown as CanvasImageSource}
                        width={photoBitmap.width}
                        height={photoBitmap.height}
                        listening={false}
                    />
                </Layer>
            </Stage>
        );
    }

    const aspectRatio = logoBitmap.width / logoBitmap.height;
    const photoBounds = {
        width: photoBitmap.width,
        height: photoBitmap.height,
    };

    return (
        <Stage
            width={containerWidth}
            height={stageHeight}
            scale={{ x: scale, y: scale }}
            style={{ touchAction: "none" }}
        >
            <Layer>
                <KonvaImage
                    image={photoBitmap as unknown as CanvasImageSource}
                    width={photoBitmap.width}
                    height={photoBitmap.height}
                    listening={false}
                />
                <KonvaImage
                    ref={logoRef}
                    image={logoBitmap as unknown as CanvasImageSource}
                    x={transform.x}
                    y={transform.y}
                    width={transform.width}
                    height={transform.width / aspectRatio}
                    rotation={transform.rotation}
                    opacity={transform.opacity}
                    draggable={selectable}
                    listening={selectable}
                    onDragEnd={(e) => {
                        if (!onTransformChange) return;
                        const next = 클램프적용하기(
                            {
                                ...transform,
                                x: e.target.x(),
                                y: e.target.y(),
                            },
                            photoBounds,
                            aspectRatio,
                        );
                        onTransformChange(next);
                    }}
                    onTransformEnd={(e) => {
                        if (!onTransformChange) return;
                        const node = e.target as Konva.Image;
                        const scaleX = node.scaleX();
                        const newWidth = transform.width * scaleX;
                        node.scaleX(1);
                        node.scaleY(1);
                        const next = 클램프적용하기(
                            {
                                x: node.x(),
                                y: node.y(),
                                width: newWidth,
                                rotation: node.rotation(),
                                opacity: transform.opacity,
                            },
                            photoBounds,
                            aspectRatio,
                        );
                        onTransformChange(next);
                    }}
                />
                {selectable && (
                    <Transformer
                        ref={trRef}
                        keepRatio
                        enabledAnchors={[
                            "top-left",
                            "top-right",
                            "bottom-left",
                            "bottom-right",
                        ]}
                        rotateEnabled
                        boundBoxFunc={(oldBox, newBox) => {
                            // 최소 32px 보장
                            if (newBox.width < 32) return oldBox;
                            return newBox;
                        }}
                    />
                )}
            </Layer>
        </Stage>
    );
}
```

**Step 2: FreePanel**

Create `app/admin2/photo-composite/_components/FreePanel.tsx`:

```tsx
"use client";

interface Props {
    opacity: number;
    onOpacityChange: (v: number) => void;
    onReset: () => void;
    onBackToPreset: () => void;
}

export default function FreePanel({
    opacity,
    onOpacityChange,
    onReset,
    onBackToPreset,
}: Props) {
    return (
        <div className='space-y-3 p-3 rounded-xl bg-rh-bg-surface'>
            <p className='text-xs text-rh-text-tertiary'>
                로고를 드래그·핀치(크기/회전)로 직접 조정하세요.
            </p>
            <div>
                <p className='text-xs text-rh-text-tertiary mb-1.5'>
                    투명도 {Math.round(opacity * 100)}%
                </p>
                <input
                    type='range'
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => onOpacityChange(Number(e.target.value))}
                    className='w-full accent-rh-accent'
                />
            </div>
            <div className='flex gap-2'>
                <button
                    type='button'
                    onClick={onReset}
                    className='flex-1 h-10 rounded-md bg-rh-bg-muted text-rh-text-secondary text-sm'
                >
                    원위치 리셋
                </button>
                <button
                    type='button'
                    onClick={onBackToPreset}
                    className='flex-1 h-10 rounded-md bg-rh-bg-muted text-rh-text-secondary text-sm'
                >
                    프리셋으로 복귀
                </button>
            </div>
        </div>
    );
}
```

**Step 3: PhotoComposer 모드 분기 완성**

Replace mode handling in `app/admin2/photo-composite/_components/PhotoComposer.tsx` — `transform` 계산 부분과 KonvaStage 호출, 모드 panel 부분을 다음으로 교체:

```tsx
// 기존 상태 + 추가:
const [freeTransform, setFreeTransform] = useState<LogoTransform | null>(null);

// transform 계산: 모드 분기
const presetTransform = useMemo<LogoTransform | null>(() => {
    if (!photoBitmap || !logoBitmap) return null;
    const aspectRatio = logoBitmap.width / logoBitmap.height;
    const t = 프리셋좌표산출(
        presetPosition,
        presetSize,
        { width: photoBitmap.width, height: photoBitmap.height },
        aspectRatio,
    );
    return { ...t, opacity };
}, [photoBitmap, logoBitmap, presetPosition, presetSize, opacity]);

const activeTransform =
    mode === "free" && freeTransform
        ? { ...freeTransform, opacity }
        : presetTransform;

// 자유 모드 진입 시 현재 프리셋을 시드로
function enterFreeMode() {
    if (presetTransform) setFreeTransform(presetTransform);
    setMode("free");
}

function exitToPreset() {
    setFreeTransform(null);
    setMode("preset");
}

// KonvaStage 호출:
<KonvaStage
    photoBitmap={photoBitmap}
    logoBitmap={logoBitmap}
    transform={activeTransform}
    containerWidth={containerWidth}
    selectable={mode === "free"}
    onTransformChange={(next) => setFreeTransform(next)}
/>

// 모드 panel:
{mode === "preset" ? (
    <PresetPanel
        position={presetPosition}
        size={presetSize}
        opacity={opacity}
        onChange={(next) => {
            if (next.position) setPresetPosition(next.position);
            if (next.size) setPresetSize(next.size);
            if (next.opacity !== undefined) setOpacity(next.opacity);
        }}
        onEnterFreeMode={enterFreeMode}
    />
) : (
    <FreePanel
        opacity={opacity}
        onOpacityChange={setOpacity}
        onReset={() => {
            if (presetTransform) setFreeTransform(presetTransform);
        }}
        onBackToPreset={exitToPreset}
    />
)}
```

(주의: 위는 변경 영역만 표시 — 기존 import/state/effect는 유지하고 해당 줄들만 위 내용으로 정리.)

**Step 4: 수동 확인 (실기 권장)**

Run:
```bash
npm run dev
```

데스크톱: 직접 조정 → 드래그/꼭짓점 리사이즈/회전 핸들 동작.
모바일: ngrok이나 LAN으로 접속 → 핀치 줌(리사이즈) + 두 손가락 회전 동시 동작 확인. 회전된 로고 드래그 → 사진 영역 안에 50% 보이는지 클램프 작동 확인.

**Step 5: 빌드 통과**

Run:
```bash
npm run typecheck && npm run lint
```

Expected: 통과.

**Step 6: 커밋**

```bash
git add app/admin2/photo-composite
git commit -m "feat(photo-composite): 자유 배치 모드 (드래그/리사이즈/회전 + 클램프)"
```

---

## Task 10: 합성 결과 export + 다운로드/공유

**Files:**
- Create: `app/admin2/photo-composite/_lib/exportImage.ts`
- Create: `app/admin2/photo-composite/_components/SaveButton.tsx`
- Modify: `app/admin2/photo-composite/_components/PhotoComposer.tsx`

**Step 1: export 헬퍼**

Create `app/admin2/photo-composite/_lib/exportImage.ts`:

```ts
import { 다운스케일치수계산 } from "@/lib/domain/photo-composite/transforms";
import type { LogoTransform } from "@/lib/domain/photo-composite/types";

interface ExportInput {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap;
    transform: LogoTransform;
    /** 출력 long-edge px (예: 2560) */
    outputLongEdge: number;
}

/**
 * 편집 좌표계의 transform을 출력 캔버스 좌표계로 스케일하고
 * JPEG q0.92로 export.
 */
export async function exportComposite({
    photoBitmap,
    logoBitmap,
    transform,
    outputLongEdge,
}: ExportInput): Promise<Blob> {
    const out = 다운스케일치수계산(
        { width: photoBitmap.width, height: photoBitmap.height },
        outputLongEdge,
    );
    const ratio = out.width / photoBitmap.width;

    const canvas = document.createElement("canvas");
    canvas.width = out.width;
    canvas.height = out.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // 1) 사진 그리기
    ctx.drawImage(photoBitmap, 0, 0, out.width, out.height);

    // 2) 로고 그리기 (회전·투명도 포함)
    const logoAspect = logoBitmap.width / logoBitmap.height;
    const lw = transform.width * ratio;
    const lh = (transform.width / logoAspect) * ratio;
    const lx = transform.x * ratio;
    const ly = transform.y * ratio;

    ctx.save();
    ctx.globalAlpha = transform.opacity;
    // 회전축은 로고 중심
    ctx.translate(lx + lw / 2, ly + lh / 2);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.drawImage(logoBitmap, -lw / 2, -lh / 2, lw, lh);
    ctx.restore();

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("toBlob 실패"));
            },
            "image/jpeg",
            0.92,
        );
    });
}

/**
 * 다운로드/공유 폴백.
 * Web Share API 가능하면 공유 시트, 아니면 a[download]로 강제 저장.
 */
export async function downloadOrShare(
    blob: Blob,
    filename: string,
): Promise<void> {
    const file = new File([blob], filename, { type: blob.type });

    if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] })
    ) {
        try {
            await navigator.share({ files: [file] });
            return;
        } catch (err) {
            // user cancel은 무시
            if ((err as Error).name === "AbortError") return;
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
```

**Step 2: SaveButton**

Create `app/admin2/photo-composite/_components/SaveButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { exportComposite, downloadOrShare } from "../_lib/exportImage";
import type { LogoTransform } from "@/lib/domain/photo-composite/types";

interface Props {
    photoBitmap: ImageBitmap;
    logoBitmap: ImageBitmap | null;
    transform: LogoTransform | null;
    crewName: string;
}

const OUTPUT_LONG_EDGE = 2560;

export default function SaveButton({
    photoBitmap,
    logoBitmap,
    transform,
    crewName,
}: Props) {
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const disabled = !logoBitmap || !transform || busy;

    async function handleSave() {
        if (!logoBitmap || !transform) return;
        setBusy(true);
        setToast(null);
        try {
            const blob = await exportComposite({
                photoBitmap,
                logoBitmap,
                transform,
                outputLongEdge: OUTPUT_LONG_EDGE,
            });
            const stamp = new Date()
                .toISOString()
                .slice(0, 10)
                .replaceAll("-", "");
            const safeName = (crewName || "crew").replace(/\s+/g, "-");
            await downloadOrShare(blob, `${safeName}-${stamp}.jpg`);
            setToast("이미지가 저장됐어요");
        } catch {
            setToast("저장에 실패했어요. 다시 시도해주세요.");
        } finally {
            setBusy(false);
            setTimeout(() => setToast(null), 2500);
        }
    }

    return (
        <div className='space-y-2'>
            <button
                type='button'
                onClick={handleSave}
                disabled={disabled}
                className='w-full h-12 rounded-lg bg-rh-accent text-white font-semibold disabled:opacity-50'
            >
                {busy ? "저장 중…" : "저장 / 공유"}
            </button>
            {toast && (
                <p className='text-center text-sm text-rh-text-secondary'>
                    {toast}
                </p>
            )}
        </div>
    );
}
```

**Step 3: PhotoComposer에 SaveButton 추가**

Add to `PhotoComposer.tsx` 본문 (KonvaStage 아래, panel 위):

```tsx
import SaveButton from "./SaveButton";

// JSX 본문 panel 영역 위에:
<SaveButton
    photoBitmap={photoBitmap}
    logoBitmap={logoBitmap}
    transform={activeTransform}
    crewName={crewName}
/>
```

**Step 4: 수동 확인**

Run:
```bash
npm run dev
```

- 데스크톱 Chrome: 사진 + 로고 → 저장 클릭 → 다운로드 폴더에 `<crew>-YYYYMMDD.jpg` 생성. 결과물 long-edge 2560px 확인.
- iOS Safari (LAN): 저장 → 공유 시트 등장 → "이미지 저장" 가능 확인.
- 회전 + 투명도 적용된 로고가 export 결과에 정확히 반영되는지 시각 확인.

**Step 5: 빌드 통과**

Run:
```bash
npm run typecheck && npm run lint
```

Expected: 통과.

**Step 6: 커밋**

```bash
git add app/admin2/photo-composite
git commit -m "feat(photo-composite): 합성 결과 JPEG export + 다운로드/Web Share"
```

---

## Task 11: 최종 빌드 게이트 + QA 체크리스트

**Files:** 없음 (검증만)

**Step 1: 풀 빌드**

Run:
```bash
npm run build
```

Expected: `check:bff` + `check:rls` + `vitest` + `lint` + `typecheck` + `next build` 모두 통과. 실패 시 해당 단계 메시지 따라 fix → 재실행.

**Step 2: 모바일 실기 QA 체크리스트**

LAN/ngrok으로 모바일에서 접속해 다음을 직접 확인:

- [ ] iOS Safari: 사진 선택(앨범) + 카메라 직접 촬영 둘 다 동작
- [ ] 안드로이드 Chrome: 동일
- [ ] 큰 사진(4K) 업로드 → 다운스케일 후 즉시 편집 가능 (3초 이내)
- [ ] HEIC 사진 업로드 시도 → 친절한 에러 메시지
- [ ] 회전된 EXIF 사진 → 자동으로 올바른 방향 표시
- [ ] 프리셋 모드: 5위치 × 3사이즈 × 투명도 즉시 반영
- [ ] 자유 모드: 드래그, 핀치 리사이즈, 두 손가락 회전 모두 동작
- [ ] 자유 모드: 로고가 사진 영역 밖으로 50% 이상 안 빠지는지 (클램프)
- [ ] "원위치 리셋" / "프리셋으로 복귀" 동작
- [ ] PNG 업로드(즉석) → JPG 거부 메시지 / PNG는 통과
- [ ] 저장: iOS는 공유 시트, 안드로이드는 다운로드, 데스크톱은 다운로드
- [ ] 결과물 화질: 인스타에서 깨지지 않는 수준 (long-edge 2560px JPEG)
- [ ] 페이지 언마운트 후 메모리 누수 없음 (개발자도구 Memory 스냅샷 비교)

**Step 3: 일반 사용자 첫 로드 영향 확인**

빌드 결과 `.next/` 분석:

```bash
npm run build 2>&1 | grep -E "First Load|admin2/photo-composite"
```

Expected: konva 번들이 `/admin2/photo-composite` 라우트에만 포함, 다른 라우트의 First Load JS 증가 없음.

**Step 4: 메뉴 전체 흐름 통합 확인**

Run:
```bash
npm run dev
```

`/admin2/menu` → "단체 사진 합성" 클릭 → 페이지 진입 → 전체 플로우 1회 완주.

**Step 5: 최종 커밋(필요 시)**

QA 중 발견한 마이크로 픽스가 있으면 별도 커밋:
```bash
git add ...
git commit -m "fix(photo-composite): <간단한 한국어 설명>"
```

QA 통과 후 모든 변경 사항이 깨끗하게 커밋된 상태인지 확인:
```bash
git status
```

Expected: clean working tree.

---

## 변경 요약

- **신규 파일**: 18개 (도메인 4 + 테스트 3 + RSC/컴포넌트/헬퍼 11)
- **수정 파일**: `app/admin2/menu/page.tsx`, `package.json`, `package-lock.json`
- **신규 의존성**: `konva@^9`, `react-konva@^18` (admin2 라우트만 동적 로드)
- **DB 변경**: 없음
- **서버 액션 / API 라우트**: 없음 (다운로드 전용)
- **Supabase 새 버킷**: 없음

## YAGNI로 의도적으로 뺀 것

- 멀티 로고 z-order — 단체사진에 로고 2개 이상 케이스 드물고 모바일 UI 복잡
- Undo/Redo — "원위치 리셋" 1버튼으로 충분
- 자동 워터마크/타임스탬프 — 프리셋 위치 자체가 워터마크 역할
- 사진 크롭 단계 — 원본 비율 유지 (별도 크롭은 OS 갤러리에서 가능)
- 결과물 갤러리 보관 — Q2=A 합의 (다운로드 전용)
- PNG 출력 옵션 — 베이스가 JPEG 사진이라 사실상 무의미
