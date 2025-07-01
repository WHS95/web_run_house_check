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
}

// 변화량 표시 함수
const renderChangeIndicator = (change: number | null) => {
  if (change === null) {
    return (
      <div className='flex items-center px-2 py-1 text-xs bg-gray-100 rounded'>
        <span className='font-medium text-gray-500'>-</span>
      </div>
    );
  }

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div
      className={`flex items-center px-1 py-1 rounded text-xs ${
        isPositive ? "bg-green-100" : isNegative ? "bg-red-100" : "bg-gray-100"
      }`}
    >
      {isPositive && <TrendingUp className='mr-1 w-3 h-3 text-green-600' />}
      {isNegative && <TrendingDown className='mr-1 w-3 h-3 text-red-600' />}
      <span
        className={`font-medium ${
          isPositive
            ? "text-green-600"
            : isNegative
            ? "text-red-600"
            : "text-gray-500"
        }`}
      >
        {Math.abs(change)}%
      </span>
    </div>
  );
};

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  return (
    <div className='flex flex-col h-screen'>
      <div className='overflow-y-auto flex-1 pb-24 bg-gray-50'>
        <div className='px-4 py-6 mx-auto max-w-md'>
          {/* 기본 통계 섹션 */}
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-3'>
              {/* 총 회원수 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex flex-col items-center space-y-2 text-center'>
                    <div className='p-2 bg-blue-100 rounded-xl'>
                      <Users className='w-4 h-4 text-blue-600' />
                    </div>
                    <div>
                      <p className='text-xs text-gray-600'>총 회원</p>
                      <p className='text-lg font-bold text-gray-900'>
                        {stats.totalMembers}명
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 오늘 모임 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex flex-col items-center space-y-2 text-center'>
                    <div className='p-2 bg-purple-100 rounded-xl'>
                      <Calendar className='w-4 h-4 text-purple-600' />
                    </div>
                    <div>
                      <p className='text-xs text-gray-600'>오늘 모임</p>
                      <p className='text-lg font-bold text-gray-900'>
                        {stats.todayMeetingCount}건
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 오늘 출석 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex flex-col items-center space-y-2 text-center'>
                    <div className='p-2 bg-green-100 rounded-xl'>
                      <UserCheck className='w-4 h-4 text-green-600' />
                    </div>
                    <div>
                      <p className='text-xs text-gray-600'>오늘 출석</p>
                      <p className='text-lg font-bold text-gray-900'>
                        {stats.todayAttendance}명
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 이달 활동 현황 섹션 */}
          <div>
            {/* 섹션 헤더 */}
            <div className='flex items-center p-2 space-x-2'>
              <TrendingUp className='w-5 h-5 text-green-600' />
              <h2 className='text-lg font-semibold text-gray-900'>
                이번 달 현황
              </h2>
            </div>

            <div className='space-y-3'>
              {/* 모임 건수 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm text-gray-600'>모임 건수</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.monthlyMeetingCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          건
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-1'>
                      {renderChangeIndicator(stats.monthlyMeetingCountChange)}
                      <p className='text-xs text-gray-400'>
                        지난달: {stats.lastMonthMeetingCount}건
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 모임 참여 횟수 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm text-gray-600'>출석 횟수</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.monthlyParticipationCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          건
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-1'>
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
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm text-gray-600'>참여 크루원 수</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.monthlyParticipantCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-1'>
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
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm text-gray-600'>모임개설 크루원</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.monthlyHostCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-1'>
                      {renderChangeIndicator(stats.monthlyHostCountChange)}
                      <p className='text-xs text-gray-400'>
                        지난달: {stats.lastMonthHostCount}명
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 신규 가입 인원 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm text-gray-600'>신규 가입 인원</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.newMembersThisMonth}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    <div className='flex flex-col items-end space-y-1'>
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

      {/* 하단 네비게이션 */}
      <AdminBottomNavigation />
    </div>
  );
}
