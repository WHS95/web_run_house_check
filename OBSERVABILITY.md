# 관측 스택 사용 가이드 (PostHog + Sentry)

RunHouse는 **PostHog**(제품 분석·세션 리플레이·기능 플래그)와
**Sentry**(에러·성능 모니터링) 두 가지 SDK가 연결되어 있습니다.
이 문서는 최초 설정, 배포 체크리스트, 실제 코드 사용법을 정리합니다.

---

## 1. 최초 계정 / 프로젝트 생성

### PostHog
1. <https://us.posthog.com/signup> 에서 가입 (US 리전 선택)
2. 프로젝트 생성 → **Project Settings → Project API Key** 복사
   (`phc_...` 로 시작, 공개 가능)
3. 동일 화면의 "API Host"가 `https://us.i.posthog.com` 인지 확인

### Sentry
1. <https://sentry.io/signup> 에서 가입 (무료 플랜 충분)
2. 프로젝트 생성 시 플랫폼은 **Next.js** 선택
3. 생성 직후 **DSN** (`https://...@...ingest.sentry.io/...`) 표시됨 → 복사
4. **Settings → Developer Settings → Auth Tokens** 에서
   `project:read` `project:write` `project:releases` 스코프로 토큰 발급
   (`sntrys_...` — 소스맵 업로드용, 절대 클라이언트에 노출 금지)
5. Organization slug와 Project slug도 확인 (URL에 표시됨)

---

## 2. 로컬 환경 변수 (.env.local)

```bash
# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 선택: 자체 프록시 대신 직접 지정하고 싶을 때만. 기본값은 /ingest
# NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Sentry — 클라이언트에서도 읽히므로 NEXT_PUBLIC_ 접두
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxx@oXXXXXX.ingest.sentry.io/XXXXXX
# 선택: 환경 구분 태그. 미설정 시 NODE_ENV 사용
# NEXT_PUBLIC_SENTRY_ENV=staging

# Sentry 소스맵 업로드용 (로컬에서도 production 빌드 테스트 시 필요)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxx
```

> `NEXT_PUBLIC_*` 변수만 브라우저로 노출됩니다. `SENTRY_AUTH_TOKEN` 은
> 반드시 CI/Vercel 서버 측 환경변수에만 등록하세요.

---

## 3. Vercel 배포 환경 변수

Vercel → Project → Settings → Environment Variables 에 **모두** 추가:

| 키 | 값 | 환경 |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | phc_... | Production / Preview |
| `NEXT_PUBLIC_SENTRY_DSN` | https://…sentry.io/… | Production / Preview |
| `NEXT_PUBLIC_SENTRY_ENV` | `production` / `preview` | 각 환경별 |
| `SENTRY_ORG` | org slug | All |
| `SENTRY_PROJECT` | project slug | All |
| `SENTRY_AUTH_TOKEN` | sntrys_... | All (Secret 체크) |

배포 전 로컬 검증:
```bash
npm run build
```
빌드 로그에 `Sentry: Source maps uploaded` 혹은 `Skipping sourcemap upload`
중 하나가 출력되면 정상. DSN 없이도 빌드는 통과합니다.

---

## 4. Sentry 자동 설정(선택)

수동 세팅이 이미 커밋돼 있지만, 계정 생성 후 **마법사**로 릴리즈 설정을
자동으로 연결하려면:

```bash
npx @sentry/wizard@latest -i nextjs --saas
```

- 브라우저가 열리며 Sentry 계정 로그인 / 프로젝트 선택
- `.sentryclirc`, `.env.sentry-build-plugin` 자동 생성
- 기존 설정 파일과 충돌하면 Wizard가 병합 여부를 묻습니다

---

## 5. PostHog 사용 패턴

### 5-1. 로그인 시 사용자 식별

```tsx
"use client";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export default function Identify({ user }: { user: { id: string; email?: string; crewId?: string } }) {
    const posthog = usePostHog();

    useEffect(() => {
        if (!posthog || !user?.id) return;
        posthog.identify(user.id, {
            email: user.email,
            crew_id: user.crewId,
        });
    }, [posthog, user]);

    return null;
}
```

### 5-2. 이벤트 캡처 (클라이언트)

```tsx
"use client";
import { usePostHog } from "posthog-js/react";

export function AttendButton() {
    const posthog = usePostHog();
    return (
        <button
            onClick={() => {
                posthog?.capture("attendance_submitted", {
                    source: "attendance_page",
                });
            }}
        >
            출석하기
        </button>
    );
}
```

### 5-3. 서버 이벤트 (Route Handler / Server Action)

```ts
import { getPostHogServer, flushPostHog } from "@/lib/posthog/server";

export async function POST(req: Request) {
    const body = await req.json();
    const ph = getPostHogServer();
    ph?.capture({
        distinctId: body.userId,
        event: "crew_invite_accepted",
        properties: { crew_id: body.crewId },
    });
    await flushPostHog(); // 서버리스에선 반드시 호출
    return Response.json({ ok: true });
}
```

### 5-4. 로그아웃

```ts
posthog?.reset(); // identify 초기화
```

### 5-5. 기능 플래그 (선택)

```tsx
const flag = posthog?.isFeatureEnabled("new_attendance_ui");
```

---

## 6. Sentry 사용 패턴

### 6-1. 예외 수동 보고

```ts
import * as Sentry from "@sentry/nextjs";

try {
    await riskyCall();
} catch (err) {
    Sentry.captureException(err, {
        tags: { feature: "attendance" },
        extra: { crewId },
    });
    throw err;
}
```

### 6-2. 메시지 / 수준 지정

```ts
Sentry.captureMessage("결제 웹훅 누락", "warning");
```

### 6-3. 사용자 컨텍스트 연결

```ts
Sentry.setUser({ id: user.id, email: user.email });
// 로그아웃 시
Sentry.setUser(null);
```

### 6-4. 브레드크럼 (이벤트 흐름 기록)

```ts
Sentry.addBreadcrumb({
    category: "ui.click",
    message: "attendance-submit",
    level: "info",
});
```

### 6-5. Route Handler 자동 래핑

Next 14 + @sentry/nextjs v10 환경에서는 `instrumentation.ts` 의
`onRequestError = Sentry.captureRequestError` 덕분에
Server Component / Route Handler / Middleware 에서 던진 에러는
**자동으로** Sentry에 전송됩니다. 수동 `captureException` 은
catch 블록에서만 필요합니다.

### 6-6. 성능 트레이싱

자동 browserTracingIntegration 로 페이지 이동·fetch 호출이
트랜잭션으로 수집됩니다. 샘플링은 `tracesSampleRate` 로 조절:
- 개발: 1.0 (100%)
- 프로덕션: 0.1 (10%) — `sentry.client.config.ts` 조정

---

## 7. 세션 리플레이 & 프라이버시

`sentry.client.config.ts` 에서 기본값은 다음과 같이 강하게 마스킹:

```ts
Sentry.replayIntegration({
    maskAllText: true,     // 모든 텍스트 ●●●
    maskAllInputs: true,   // input 값 전부 마스킹
    blockAllMedia: true,   // 이미지·비디오 회색 박스
});
replaysSessionSampleRate: 0.1   // 전체 세션 10%
replaysOnErrorSampleRate: 1.0   // 에러 발생 세션 100%
```

- 특정 요소만 노출하려면 DOM에 `data-sentry-unmask` 속성 부여
- 특정 요소를 추가로 블록하려면 `data-sentry-block`

---

## 8. 배포 체크리스트

- [ ] Vercel 환경변수 6종 모두 등록 (위 3번 표)
- [ ] `SENTRY_AUTH_TOKEN` 은 Secret 플래그로 저장
- [ ] PostHog 대시보드에서 `$pageview` 이벤트 수신 확인
      (배포 직후 본인 세션으로 몇 페이지 이동)
- [ ] Sentry 대시보드에 프로젝트 이벤트 `Issues` 탭 수신 확인
      ([테스트 에러 버튼](https://docs.sentry.io/platforms/javascript/guides/nextjs/#verify)
      로 검증)
- [ ] 운영 도메인에서 광고 차단기(uBlock Origin 등) 켠 상태로
      `/ingest` 와 `/monitoring` 요청이 200 응답하는지 확인

---

## 9. 비활성화 / 트러블슈팅

- **DSN·API Key 미설정**: 두 SDK 모두 초기화 단계에서 early-return 하므로
  빌드와 런타임에 영향을 주지 않습니다.
- **First Load JS 사이즈 증가**: Sentry 세션 리플레이가 ~200KB 차지.
  필요 없다면 `sentry.client.config.ts` 에서 `replayIntegration()` 제거.
- **소스맵 업로드 실패**: `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`
  셋 중 하나라도 누락되면 `sourcemaps.disable: true` 로 자동 전환되어
  빌드는 통과하나 스택 트레이스가 minified 상태로 표시됩니다.
- **프록시 404**: `/ingest/*` 또는 `/monitoring/*` 가 404면
  `next.config.js` rewrites / tunnelRoute 와 `middleware.ts` skip 로직을
  다시 확인하세요.

---

## 10. 관련 파일

| 경로 | 역할 |
|---|---|
| `components/providers/PostHogProvider.tsx` | 클라이언트 초기화 + $pageview |
| `lib/posthog/server.ts` | 서버 측 PostHog 헬퍼 |
| `sentry.client.config.ts` | 브라우저 Sentry SDK |
| `sentry.server.config.ts` | Node 런타임 Sentry SDK |
| `sentry.edge.config.ts` | Edge 런타임 Sentry SDK |
| `instrumentation.ts` | Next 14 instrumentation hook 등록 |
| `app/global-error.tsx` | 루트 레이아웃 폴백 & 수동 captureException |
| `next.config.js` | rewrites(/ingest), withSentryConfig(tunnelRoute /monitoring) |
| `middleware.ts` | `/ingest` `/monitoring` 경로 auth 스킵 |
