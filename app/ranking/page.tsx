import React from "react";
import UltraFastRankingTemplate from "@/components/templates/UltraFastRankingTemplate";

// 동적 렌더링 강제 (클라이언트 렌더링)
export const dynamic = "force-dynamic";

export default function RankingPage() {
  return <UltraFastRankingTemplate />;
}
