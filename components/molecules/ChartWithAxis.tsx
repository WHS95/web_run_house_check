import React from "react";
import LineChart from "@/components/atoms/LineChart";
import { DataPoint } from "@/lib/dashboard-data";
import DayParticipationItem from "./AxisBar";

interface DayParticipationData {
  dayName: string;
  dayIndex: number;
  participationRate: number;
  totalMembers: number;
  color: string;
}

interface ChartWithAxisProps {
  title: string;
  data: DayParticipationData[];
  year: number;
  month: number;
}

export default function ChartWithAxis({
  title,
  data,
  year,
  month,
}: ChartWithAxisProps) {
  return (
    <div className='p-6 bg-white rounded-lg border border-gray-200 shadow-sm'>
      <div className='mb-6'>
        <h3 className='mb-1 text-lg font-semibold text-gray-900'>{title}</h3>
      </div>

      <div className='space-y-1'>
        {data.length > 0 ? (
          data.map((item, index) => (
            <DayParticipationItem key={item.dayIndex} item={item} />
          ))
        ) : (
          <div className='py-8 text-center text-gray-500'>
            <p>해당 기간의 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
