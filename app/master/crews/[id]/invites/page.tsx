import { notFound } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import { 크루상세VM_조립 } from "../_vm/detail";
import { 크루초대코드VM_조립 } from "./_vm/list";
import CrewInvitesClient from "./CrewInvitesClient";

export const dynamic = "force-dynamic";

interface CrewInvitesPageProps {
    params: { id: string };
}

export default async function CrewInvitesPage({
    params,
}: CrewInvitesPageProps) {
    const detail = await 크루상세VM_조립(params.id);
    if (!detail) notFound();

    const codes = await 크루초대코드VM_조립(params.id);

    return (
        <div className="flex flex-col">
            <PageHeader
                title={`초대코드: ${detail.crew.name}`}
                backLink={`/master/crews/${params.id}`}
            />
            <FadeIn className="px-4 pt-4 pb-6">
                <CrewInvitesClient
                    crewId={params.id}
                    crewName={detail.crew.name}
                    initialCodes={codes}
                />
            </FadeIn>
        </div>
    );
}
