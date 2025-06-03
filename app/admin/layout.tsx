import { ReactNode } from "react";
import { AdminContextProvider } from "./AdminContextProvider";
import { verifyAdminAuth } from "@/lib/admin-auth";

// 서버 컴포넌트 - Layout
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 서버사이드에서 한 번만 인증 체크
  const authData = await verifyAdminAuth();

  return (
    <AdminContextProvider
      crewId={authData.crewId}
      userId={authData.userId}
      firstName={authData.firstName}
    >
      {children}
    </AdminContextProvider>
  );
}
