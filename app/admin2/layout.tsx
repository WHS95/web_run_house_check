import { ReactNode } from "react";
import { verifyAdminAuth } from "@/lib/admin-auth";
import BottomNavigation from "@/components/organisms/BottomNavigation";
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
    await verifyAdminAuth();

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {children}
            <div className="shrink-0">
                <BottomNavigation />
            </div>
        </div>
    );
}
