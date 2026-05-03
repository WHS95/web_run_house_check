import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { 사용자_컨텍스트_조회 } from "@/lib/access/user-context";
import * as 접근정책 from "@/lib/domain/access/policies";

const MyPageSettingsTemplate = dynamic(
    () => import("@/components/templates/MyPageSettingsTemplate"),
    { ssr: true }
);

const SettingsSkeleton = () => (
    <div className='flex flex-col min-h-screen bg-rh-bg-primary'>
        <div className='h-14 border-b border-rh-border bg-rh-bg-primary' />
        <div className='flex-1 px-4 pt-4 space-y-5'>
            <div className='h-[120px] rounded-rh-md bg-rh-bg-surface' />
            <div className='h-[120px] rounded-rh-md bg-rh-bg-surface' />
        </div>
    </div>
);

export default async function MyPageSettings() {
    const ctx = await 사용자_컨텍스트_조회();
    if (!ctx) {
        redirect("/auth/login");
    }

    if (
        !접근정책.크루멤버_접근가능한가({
            userStatus: ctx.userStatus,
            userCrewStatus: ctx.userCrewStatus,
            isCrewVerified: ctx.isCrewVerified,
        })
    ) {
        redirect("/");
    }

    return (
        <Suspense fallback={<SettingsSkeleton />}>
            <MyPageSettingsTemplate crewId={ctx.verifiedCrewId} />
        </Suspense>
    );
}
