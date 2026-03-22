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
    <div>
      {title && (
        <div className='mb-4'>
          <h3 className='text-sm font-semibold text-white'>{title}</h3>
        </div>
      )}

      <div className='space-y-1'>
        {data.length > 0 ? (
          data.map((item) => (
            <DayParticipationItem key={item.dayIndex} item={item} />
          ))
        ) : (
          <div className='py-6 text-center text-rh-text-secondary text-sm'>
            <p>해당 기간의 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
