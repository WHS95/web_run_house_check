import PageHeader from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import { 마스터_권한_보장 } from "@/lib/master/auth";
import PushTestClient from "./PushTestClient";
import HomeAction from "../_components/HomeAction";

export const dynamic = "force-dynamic";

export default async function PushPage() {
    // layout이 이미 마스터_권한_보장을 호출하지만, 명시적 가드를 페이지에서도
    // 호출하여 안전망 확보. React.cache로 비용 거의 없음.
    await 마스터_권한_보장();

    return (
        <div className="flex flex-col">
            <PageHeader
                title="푸시 테스트"
                rightAction={<HomeAction />}
            />
            <FadeIn className="px-4 pt-4 pb-6">
                <PushTestClient />
            </FadeIn>
        </div>
    );
}
