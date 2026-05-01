import { ReactNode } from "react";
import type { Metadata } from "next";
import { 마스터_권한_보장 } from "@/lib/master/auth";
import MasterNav from "./_components/MasterNav";

export const metadata: Metadata = {
    title: "런하우스 - 마스터",
    description: "런하우스 마스터 어드민",
    robots: { index: false, follow: false },
};

export default async function MasterLayout({
    children,
}: {
    children: ReactNode;
}) {
    await 마스터_권한_보장();

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <div className="flex-1">{children}</div>
            <MasterNav />
        </div>
    );
}
