import { notFound } from "next/navigation";
import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import { 크루상세VM_조립 } from "../_vm/detail";
import EditCrewForm from "./EditCrewForm";

export const dynamic = "force-dynamic";

interface EditCrewPageProps {
    params: { id: string };
}

export default async function EditCrewPage({ params }: EditCrewPageProps) {
    const detail = await 크루상세VM_조립(params.id);
    if (!detail) notFound();

    return (
        <div className="flex flex-col">
            <PageHeader
                title="크루 수정"
                backLink={`/master/crews/${params.id}`}
            />
            <FadeIn className="px-4 pt-4 pb-6">
                <EditCrewForm
                    crew={{
                        id: detail.crew.id,
                        name: detail.crew.name,
                        description: detail.crew.description,
                        region: detail.crew.region,
                        location_based_attendance:
                            detail.crew.location_based_attendance,
                        accuracy_range: detail.crew.accuracy_range,
                        allow_unregistered_location:
                            detail.crew.allow_unregistered_location,
                    }}
                />
            </FadeIn>
        </div>
    );
}
