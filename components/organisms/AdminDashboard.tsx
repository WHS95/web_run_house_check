"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Calendar,
  TrendingUp,
  UserCheck,
  TrendingDown,
} from "lucide-react";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";
// AdminStats 타입 정의
interface AdminStats {
  totalMembers: number;
  todayAttendance: number;
  todayMeetingCount: number;
  newMembersThisMonth: number;
  newMembersThisMonthChange: number | null;
  lastMonthNewMembers: number;
  monthlyMeetingCount: number;
  monthlyMeetingCountChange: number | null;
  lastMonthMeetingCount: number;
  monthlyParticipationCount: number;
  monthlyParticipationCountChange: number | null;
  lastMonthParticipationCount: number;
  monthlyParticipantCount: number;
  monthlyParticipantCountChange: number | null;
  lastMonthParticipantCount: number;
  monthlyHostCount: number;
  monthlyHostCountChange: number | null;
  lastMonthHostCount: number;
}

interface AdminDashboardProps {
  stats: AdminStats;
  selectedMonth: number;
}

// 변화량 표시 함수
const renderChangeIndicator = (change: number | null) => {
  if (change === null) {
    return (
      <div className='flex items-center px-3 py-1 text-xs bg-gray-100 rounded-full'>
        <span className='font-medium text-gray-500'>-</span>
      </div>
    );
  }

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div
      className={`flex items-center px-3 py-1 rounded-full text-xs ${
        isPositive ? "bg-green-100" : isNegative ? "bg-red-100" : "bg-gray-100"
      }`}
    >
      {isPositive && <TrendingUp className='mr-1 w-2 h-2 text-basic-blue' />}
      {isNegative && <TrendingDown className='mr-1 w-2 h-2 text-red-400' />}
      <span
        className={`font-normal text-xs ${
          isPositive
            ? "text-basic-blue"
            : isNegative
            ? "text-red-400"
            : "text-gray-500"
        }`}
      >
        {/* {isPositive ? "+" : ""} */}
        {Math.abs(change) ? Math.abs(change) + "%" : "-"}
      </span>
    </div>
  );
};

export default function AdminDashboard({
  stats,
  selectedMonth,
}: AdminDashboardProps) {
  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <div className='overflow-y-auto flex-1 pb-20'>
        <div className='px-4 py-4 mx-auto max-w-lg'>
          {/* iOS 스타일 기본 통계 섹션 */}
          <div className='mb-3 space-y-6'>
            <div className='grid grid-cols-3 gap-4'>
              {/* 총 회원수 */}
              <Card className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
                <CardContent className='p-2'>
                  <div className='flex flex-col items-center space-y-3 text-center'>
                    <div className='flex justify-center items-center w-5 h-5 bg-blue-100 rounded-2xl'>
                      <Users className='w-3 h-3 text-blue-600' />
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-600'>
                        총 회원
                      </p>
                      <p className='mt-1 text-lg font-bold text-gray-900'>
                        {stats.totalMembers}명
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 오늘 모임 */}
              <Card className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
                <CardContent className='p-2'>
                  <div className='flex flex-col items-center space-y-3 text-center'>
                    <div className='flex justify-center items-center w-5 h-5 bg-purple-100 rounded-2xl'>
                      <Calendar className='w-3 h-3 text-purple-600' />
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-600'>
                        오늘 모임
                      </p>
                      <p className='mt-1 text-lg font-bold text-gray-900'>
                        {stats.todayMeetingCount}건
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 오늘 출석 */}
              <Card className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
                <CardContent className='p-2'>
                  <div className='flex flex-col items-center space-y-3 text-center'>
                    <div className='flex justify-center items-center w-5 h-5 bg-green-100 rounded-2xl'>
                      <UserCheck className='w-3 h-3 text-green-600' />
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-600'>
                        오늘 출석
                      </p>
                      <p className='mt-1 text-lg font-bold text-gray-900'>
                        {stats.todayAttendance}명
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* iOS 스타일 이달 활동 현황 섹션 */}
          <div>
            {/* 섹션 헤더 */}
            <div className='flex items-center mb-3 space-x-3'>
              <div className='flex justify-center items-center w-5 h-5 bg-green-100 rounded-full'>
                <TrendingUp className='w-3 h-3 text-green-600' />
              </div>
              <h2 className='font-medium'>{selectedMonth}월 현황</h2>
            </div>

            <div className='space-y-3'>
              {/* 모임 건수 */}
              <Card className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
                <CardContent className='px-4 py-2'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        모임 건수
                      </p>
                      <p className='mt-1 text-xl font-bold text-gray-900'>
                        {stats.monthlyMeetingCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          건
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-2'>
                      {renderChangeIndicator(stats.monthlyMeetingCountChange)}
                      <p className='text-xs text-gray-400'>
                        지난달: {stats.lastMonthMeetingCount}건
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 모임 참여 횟수 */}
              <Card className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
                <CardContent className='px-4 py-2'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        출석 횟수
                      </p>
                      <p className='mt-1 text-xl font-bold text-gray-900'>
                        {stats.monthlyParticipationCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          건
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-2'>
                      {renderChangeIndicator(
                        stats.monthlyParticipationCountChange
                      )}
                      <p className='text-xs text-gray-400'>
                        지난달: {stats.lastMonthParticipationCount}건
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 참여 크루원 수 */}
              <Card className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
                <CardContent className='px-4 py-2'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        참여 크루원 수
                      </p>
                      <p className='mt-1 text-xl font-bold text-gray-900'>
                        {stats.monthlyParticipantCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-2'>
                      {renderChangeIndicator(
                        stats.monthlyParticipantCountChange
                      )}
                      <p className='text-xs text-gray-400'>
                        지난달: {stats.lastMonthParticipantCount}명
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 모임개설 크루원 */}
              <Card className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
                <CardContent className='px-4 py-2'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        모임개설 크루원
                      </p>
                      <p className='mt-1 text-xl font-bold text-gray-900'>
                        {stats.monthlyHostCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-2'>
                      {renderChangeIndicator(stats.monthlyHostCountChange)}
                      <p className='text-xs text-gray-400'>
                        지난달: {stats.lastMonthHostCount}명
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 신규 가입 인원 */}
              <Card className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
                <CardContent className='px-4 py-2'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>
                        신규 가입 인원
                      </p>
                      <p className='mt-1 text-xl font-bold text-gray-900'>
                        {stats.newMembersThisMonth}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-2'>
                      {renderChangeIndicator(stats.newMembersThisMonthChange)}
                      <p className='text-xs text-gray-400'>
                        지난달: {stats.lastMonthNewMembers}명
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
