import EditProfileClient from "./_components/EditProfileClient";

/**
 * 프로필 편집 (BFF Controller).
 *
 * `force-dynamic` 이 필요한 이유는 `app/auth/signup/page.tsx` 와 같다 —
 * 클라이언트 컴포넌트가 렌더 중 Supabase 브라우저 클라이언트를 만들기 때문에
 * 정적 프리렌더하면 빌드가 환경변수에 의존하게 된다.
 * 로그인 사용자 데이터가 있어야 의미 있는 화면이라 정적 생성 이득도 없다.
 */
export const dynamic = "force-dynamic";

export default function EditProfilePage() {
    return <EditProfileClient />;
}
