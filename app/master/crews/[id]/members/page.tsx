import { notFound } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import { 크루상세VM_조립 } from "../_vm/detail";
import { getCrewMembersAction } from "@/app/master/actions";
import MembersClient from "./MembersClient";

export const dynamic = "force-dynamic";

interface CrewMembersPageProps {
    params: { id: string };
}

export default async function CrewMembersPage({
    params,
}: CrewMembersPageProps) {
    const detail = await 크루상세VM_조립(params.id);
    if (!detail) notFound();

    const result = await getCrewMembersAction({ crewId: params.id });
    const members = result.success && result.data ? result.data : [];

    return (
        <div className="flex flex-col">
            <PageHeader
                title={`멤버: ${detail.crew.name}`}
                backLink={`/master/crews/${params.id}`}
            />
            <FadeIn className="px-4 pt-4 pb-6">
                <MembersClient
                    crewId={params.id}
                    initialMembers={members}
                />
            </FadeIn>
        </div>
    );
}
