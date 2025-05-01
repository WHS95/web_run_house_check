import MemberDetailTemplate from "@/components/templates/MemberDetailTemplate";

// TODO: 동적 경로 파라미터(memberId) 처리 필요
export default function MemberDetailPage({
  params,
}: {
  params: { memberId: string };
}) {
  return <MemberDetailTemplate memberId={params.memberId} />;
}
