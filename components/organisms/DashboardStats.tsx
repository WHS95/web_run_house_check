import React from "react";
import StatCardList from "@/components/molecules/StatCardList";
import { getStatsCardsData } from "@/lib/dashboard-data";

export default function DashboardStats() {
  const statsData = getStatsCardsData();

  return (
    <div className='mb-6'>
      <StatCardList cards={statsData} />
    </div>
  );
}
