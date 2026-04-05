import { ReactNode } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { AdminProvider } from "./providers/AdminProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "런하우스 - 관리자",
    description: "러닝크루 관리자 대시보드",
    robots: { index: false, follow: false },
};

export default async function Admin2Layout({
    children,
}: {
    children: ReactNode;
}) {
    const auth = await getAdminAuth();
    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <AdminProvider value={auth}>{children}</AdminProvider>
        </div>
    );
}
