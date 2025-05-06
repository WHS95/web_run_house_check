import React from "react";
import { motion } from "framer-motion";
import { DataPoint } from "@/lib/dashboard-data";

interface LineChartProps {
  data: DataPoint[];
  color: string;
  gradientId: string;
  maxValue: number;
  chartWidth: number;
  chartHeight: number;
}

export default function LineChart({
  data,
  color,
  gradientId,
  maxValue,
  chartWidth,
  chartHeight,
}: LineChartProps) {
  // 애니메이션 변형
  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  const areaVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 0.3,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  // 라인 경로 생성
  const linePath = `M 0 ${
    chartHeight - (data[0].value / maxValue) * chartHeight
  } ${data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - (item.value / maxValue) * chartHeight;
      return `L ${x} ${y}`;
    })
    .join(" ")}`;

  // 영역 경로 생성
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <>
      {/* 그래프 라인 */}
      <motion.path
        d={linePath}
        fill='none'
        stroke={color}
        strokeWidth='2'
        initial='hidden'
        animate='visible'
        variants={lineVariants}
      />

      {/* 그래프 아래 영역 */}
      <motion.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        initial='hidden'
        animate='visible'
        variants={areaVariants}
      />

      {/* 그라데이션 정의 */}
      <defs>
        <linearGradient id={gradientId} x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop offset='0%' stopColor={color} stopOpacity='0.8' />
          <stop offset='100%' stopColor={color} stopOpacity='0.1' />
        </linearGradient>
      </defs>
    </>
  );
}
