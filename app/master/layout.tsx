import { ReactNode } from "react";
import type { Metadata } from "next";
import { 마스터_권한_보장 } from "@/lib/master/auth";

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

    return <>{children}</>;
}
