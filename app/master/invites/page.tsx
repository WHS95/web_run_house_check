import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import { getMasterInviteCodesAction } from "@/app/master/invite-codes/actions";
import { 마스터_권한_보장 } from "@/lib/master/auth";
import { createClient } from "@/lib/supabase/server";
import InvitesGlobalClient from "./InvitesGlobalClient";

export const dynamic = "force-dynamic";

interface CrewOption {
    id: string;
    name: string;
}

async function fetchAllCrews(): Promise<CrewOption[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .schema("attendance")
        .from("crews")
        .select("id, name")
        .order("name");
    return (data ?? []) as CrewOption[];
}

export default async function InvitesPage() {
    // layout이 이미 마스터_권한_보장을 호출하지만, 명시적 가드를 페이지에서도
    // 호출하여 안전망 확보. React.cache로 비용 거의 없음.
    await 마스터_권한_보장();

    const [crews, inviteResult] = await Promise.all([
        fetchAllCrews(),
        getMasterInviteCodesAction(),
    ]);
    const codes =
        inviteResult.success && inviteResult.data ? inviteResult.data : [];

    return (
        <div className="flex flex-col">
            <PageHeader title="초대코드 통합 관리" />
            <FadeIn className="px-4 pt-4 pb-6">
                <InvitesGlobalClient
                    crews={crews}
                    initialCodes={codes}
                />
            </FadeIn>
        </div>
    );
}
