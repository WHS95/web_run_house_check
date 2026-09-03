import SignupClient from "./_components/SignupClient";

/**
 * 회원가입 (BFF Controller).
 *
 * 화면 자체는 클라이언트 상태가 전부라 페치할 것이 없지만, page.tsx 는
 * Server Component 로 둔다 (BFF 4계층 · ESLint 룰 5).
 *
 * `force-dynamic` 이 필요한 이유: 클라이언트 컴포넌트가 렌더 중
 * `createClient()` 로 Supabase 브라우저 클라이언트를 만든다. 정적 프리렌더
 * 대상이면 이 호출이 **빌드 타임에** 실행되어, `NEXT_PUBLIC_SUPABASE_*` 가
 * 없는 환경(Vercel Preview 등)에서 빌드가 통째로 깨진다.
 * 세션에 따라 매번 달라지는 화면이라 정적 생성으로 얻는 이득도 없다.
 *
 * ⚠️ 이 설정은 Server Component 에서만 동작한다. `"use client"` 파일에
 *    `export const dynamic` 을 써도 무시된다.
 */
export const dynamic = "force-dynamic";

export default function SignupPage() {
    return <SignupClient />;
}
