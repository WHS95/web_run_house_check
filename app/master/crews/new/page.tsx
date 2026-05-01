import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import NewCrewForm from "./NewCrewForm";

export const dynamic = "force-dynamic";

export default function NewCrewPage() {
    return (
        <div className="flex flex-col">
            <PageHeader title="크루 등록" backLink="/master/crews" />
            <FadeIn className="px-4 pt-4 pb-6">
                <NewCrewForm />
            </FadeIn>
        </div>
    );
}
