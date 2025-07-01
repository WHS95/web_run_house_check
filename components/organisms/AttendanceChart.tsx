import React from "react";
import ChartWithAxis from "@/components/molecules/ChartWithAxis";
import { attendanceData, DataPoint } from "@/lib/dashboard-data";

// DataPoint를 DayParticipationData로 변환하는 함수
const convertToChartData = (data: DataPoint[]) => {
  return data.map((item, index) => ({
    dayName: item.month,
    dayIndex: index,
    participationRate: item.value,
    participantCount: item.value,
    totalMembers: 100, // 기본값
    color: "#10B981",
  }));
};

export default function AttendanceChart() {
  const chartData = convertToChartData(attendanceData);
  const currentDate = new Date();

  return (
    <div className='mb-6'>
      <h2 className='mb-4 text-xl font-semibold'>월별 출석 횟수</h2>
      <ChartWithAxis
        title='월별 출석 분석'
        data={chartData}
        year={currentDate.getFullYear()}
        month={currentDate.getMonth() + 1}
      />
    </div>
  );
}
