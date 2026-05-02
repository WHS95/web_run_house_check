import { notFound } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import { 크루상세VM_조립 } from "./_vm/detail";
import CrewMetaCard from "./_components/CrewMetaCard";
import CrewKpiGrid from "./_components/CrewKpiGrid";
import CrewSubMenu from "./_components/CrewSubMenu";

export const dynamic = "force-dynamic";

interface CrewDetailPageProps {
    params: { id: string };
}

export default async function CrewDetailPage({
    params,
}: CrewDetailPageProps) {
    const vm = await 크루상세VM_조립(params.id);
    if (!vm) notFound();

    return (
        <div className="flex flex-col">
            <PageHeader
                title={vm.crew.name}
                backLink="/master/crews"
            />
            <FadeIn className="px-4 pt-4 pb-6 space-y-5">
                <CrewMetaCard crew={vm.crew} />
                <CrewKpiGrid kpi={vm.kpi} />
                <CrewSubMenu crewId={vm.crew.id} />
            </FadeIn>
        </div>
    );
}
