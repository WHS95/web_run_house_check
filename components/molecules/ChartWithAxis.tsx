import React from "react";
import LineChart from "@/components/atoms/LineChart";
import { DataPoint } from "@/lib/dashboard-data";

interface ChartWithAxisProps {
  data: DataPoint[];
  color: string;
  height?: number;
  yAxisLabel?: string;
  title?: string;
  gradientId?: string;
}

export default function ChartWithAxis({
  data,
  color,
  height = 200,
  yAxisLabel = "",
  title,
  gradientId = "chartGradient",
}: ChartWithAxisProps) {
  // 그래프 최대 값 계산 (스케일링을 위해)
  const maxValue = Math.max(...data.map((item) => item.value));

  // Y축 값 자동 생성 (0부터 최대값까지 균등하게 나눔)
  const yAxisValues = Array.from({ length: 6 }, (_, i) =>
    Math.round((maxValue * (5 - i)) / 5)
  );
  yAxisValues.push(0);

  // 차트 크기
  const chartHeight = height;
  const chartWidth = 400;

  return (
    <div className='relative'>
      {title && (
        <h2 className='text-lg font-medium mb-3 text-white'>{title}</h2>
      )}
      <div
        className='relative'
        style={{ height: `${height + 30}px`, width: "100%" }}
      >
        {/* 그리드 라인 */}
        <div className='absolute inset-0 grid grid-cols-6 grid-rows-5'>
          {Array.from({ length: 6 }).map((_, colIndex) => (
            <div
              key={`col-${colIndex}`}
              className='border-l h-full border-gray-700'
            ></div>
          ))}
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className='border-b w-full border-gray-700'
            ></div>
          ))}
        </div>

        {/* Y축 값 및 라벨 */}
        <div className='absolute left-[-10px] inset-y-0 w-10 flex flex-col justify-between text-xs text-gray-400'>
          {yAxisValues.map((value, index) => (
            <span key={index}>{value}</span>
          ))}
        </div>

        {yAxisLabel && (
          <div className='absolute left-[-30px] top-1/2 transform -rotate-90 text-xs text-gray-400'>
            {yAxisLabel}
          </div>
        )}

        {/* X축 값 */}
        <div className='absolute bottom-[-20px] inset-x-0 flex justify-between px-8 text-xs text-gray-400'>
          {data.map((item, index) => (
            <span key={index}>{item.month}</span>
          ))}
        </div>

        {/* 그래프 SVG */}
        <svg
          className='absolute inset-0 w-full h-full px-12 pt-4'
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio='none'
        >
          <LineChart
            data={data}
            color={color}
            gradientId={gradientId}
            maxValue={maxValue}
            chartWidth={chartWidth}
            chartHeight={chartHeight}
          />
        </svg>
      </div>
    </div>
  );
}
