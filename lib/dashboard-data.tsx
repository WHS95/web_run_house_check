import { Users, Calendar, DollarSign } from "lucide-react";
import React from "react";

export interface DataPoint {
  month: string;
  value: number;
}

export interface StatsCardData {
  icon: React.ReactNode;
  title: string;
  value: string;
  bgColor: string;
  subtitle?: string;
}

// 월별 회원수 데이터
export const memberData: DataPoint[] = [
  { month: "Jan", value: 30 },
  { month: "Feb", value: 60 },
  { month: "Mar", value: 180 },
  { month: "Apr", value: 100 },
  { month: "Mai", value: 140 },
  { month: "Jun", value: 20 },
];

// 월별 출석 횟수 데이터
export const attendanceData: DataPoint[] = [
  { month: "Jan", value: 20 },
  { month: "Feb", value: 60 },
  { month: "Mar", value: 180 },
  { month: "Apr", value: 100 },
  { month: "Mai", value: 140 },
  { month: "Jun", value: 20 },
];

// 통계 카드 데이터 가져오기 함수
export const getStatsCardsData = (): StatsCardData[] => [
  {
    icon: <Users size={20} className='text-white' />,
    title: "총 크루원",
    value: "240명",
    bgColor: "bg-blue-900",
  },
  //   {
  //     icon: <DollarSign size={20} className="text-white" />,
  //     title: "예산",
  //     value: "3,845,200원",
  //     bgColor: "bg-amber-500",
  //   },
  {
    icon: <Calendar size={20} className='text-white' />,
    title: "오늘 출석자",
    subtitle: "2024/05/01(수)",
    value: "6명",
    bgColor: "bg-gray-700",
  },
];
