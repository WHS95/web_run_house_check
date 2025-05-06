import React from "react";
import ChartWithAxis from "@/components/molecules/ChartWithAxis";
import { memberData } from "@/lib/dashboard-data";

export default function MembershipChart() {
  return (
    <div className='mb-6'>
      <h2 className='text-xl font-semibold mb-4'>월별 회원수</h2>
      <div className='bg-gray-800 p-4 rounded-lg'>
        <ChartWithAxis
          data={memberData}
          height={200}
          color='#3B82F6'
          yAxisLabel='회원수'
        />
      </div>
    </div>
  );
}
