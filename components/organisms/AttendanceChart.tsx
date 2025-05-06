import React from "react";
import ChartWithAxis from "@/components/molecules/ChartWithAxis";
import { attendanceData } from "@/lib/dashboard-data";

export default function AttendanceChart() {
  return (
    <div className='mb-6'>
      <h2 className='text-xl font-semibold mb-4'>월별 출석 횟수</h2>
      <div className='bg-gray-800 p-4 rounded-lg'>
        <ChartWithAxis
          data={attendanceData}
          height={200}
          color='#10B981'
          yAxisLabel='출석 횟수'
        />
      </div>
    </div>
  );
}
