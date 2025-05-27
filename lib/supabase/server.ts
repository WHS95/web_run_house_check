// import { createServerClient, type CookieOptions } from "@supabase/ssr";
// import { cookies } from "next/headers";

// export async function createClient() {
//   const cookieStore = cookies();

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return cookieStore.get(name)?.value;
//         },
//         set(name: string, value: string, options: CookieOptions) {
//           try {
//             cookieStore.set({ name, value, ...options });
//           } catch (error) {
//             // 서버 컴포넌트에서 쿠키를 설정하려고 할 때 발생하는 오류입니다.
//             // Next.js 미들웨어가 세션을 새로고침해야 하므로 이 오류는 무시할 수 있습니다.
//           }
//         },
//         remove(name: string, options: CookieOptions) {
//           try {
//             cookieStore.set({ name, value: "", ...options });
//           } catch (error) {
//             // 서버 컴포넌트에서 쿠키를 제거하려고 할 때 발생하는 오류입니다.
//             // Next.js 미들웨어가 세션을 새로고침해야 하므로 이 오류는 무시할 수 있습니다.
//           }
//         },
//       },
//     }
//   );
// }
