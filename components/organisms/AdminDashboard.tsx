"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Bell,
  Settings,
  UserCheck,
  UserPlus,
  MapPin,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";

// 임시 데이터
const stats = {
  totalMembers: 156,
  todayAttendance: 23,
  todayMeetingCount: 3, // 오늘 모임 건수
  newMembersThisMonth: 8, // 이달 신규 가입 인원
  newMembersThisMonthChange: 25, // 신규 가입 증감률
  // 이미지 기반 새로운 통계 데이터
  monthlyMeetingCount: 8,
  monthlyMeetingCountChange: -46.7, // 감소
  monthlyParticipationCount: 57,
  monthlyParticipationCountChange: 3.6, // 증가
  monthlyParticipantCount: 25,
  monthlyParticipantCountChange: 13, // 증가
  monthlyHostCount: 6,
  monthlyHostCountChange: null, // 저번달 데이터 없음 예시
};

const recentActivities = [
  {
    id: 1,
    user: "김철수",
    action: "출석 체크",
    time: "2분 전",
    avatar: "/avatars/01.png",
  },
  {
    id: 2,
    user: "이영희",
    action: "회원가입",
    time: "15분 전",
    avatar: "/avatars/02.png",
  },
  {
    id: 3,
    user: "박민수",
    action: "프로필 수정",
    time: "1시간 전",
    avatar: "/avatars/03.png",
  },
  {
    id: 4,
    user: "정수진",
    action: "출석 체크",
    time: "2시간 전",
    avatar: "/avatars/04.png",
  },
];

const quickActions = [
  {
    title: "회원 관리",
    description: "회원 정보 조회 및 관리",
    icon: Users,
    href: "/admin/user",
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "출석 관리",
    description: "출석 현황 및 통계",
    icon: Calendar,
    href: "/admin/attendance",
    color: "bg-green-50 text-green-600",
  },
  {
    title: "알림 설정",
    description: "푸시 알림 및 공지사항",
    icon: Bell,
    href: "/admin/notifications",
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "시스템 설정",
    description: "앱 설정 및 관리",
    icon: Settings,
    href: "/admin/settings",
    color: "bg-gray-50 text-gray-600",
  },
];

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
      {isPositive && <TrendingUp className='w-3 h-3 mr-1 text-green-600' />}
      {isNegative && <TrendingDown className='w-3 h-3 mr-1 text-red-600' />}
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

export default function AdminDashboard() {
  return (
    <div className='flex flex-col h-screen'>
      {/* iOS 스타일 헤더 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>관리자</h1>
              <p className='text-sm text-gray-500'>운영 관리</p>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto bg-gray-50'>
        <div className='max-w-md px-4 py-3 mx-auto'>
          {/* 기본 통계 섹션 */}
          <div className='space-y-4'>
            {/* 섹션 헤더 */}
            {/* <div className='flex items-center px-2 space-x-2'>
              <BarChart3 className='w-5 h-5 text-blue-600' />
              <h2 className='text-lg font-semibold text-gray-900'>기본 통계</h2>
            </div> */}

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

              {/* 신규 가입자 */}
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
                이달 활동 현황
              </h2>
            </div>

            <div className='space-y-3'>
              {/* 모임 건수 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600'>모임 건수</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.monthlyMeetingCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          건
                        </span>
                      </p>
                    </div>
                    {renderChangeIndicator(stats.monthlyMeetingCountChange)}
                  </div>
                </CardContent>
              </Card>

              {/* 모임 참여 횟수 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600'>모임 참여 횟수</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.monthlyParticipationCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          건
                        </span>
                      </p>
                    </div>
                    {renderChangeIndicator(
                      stats.monthlyParticipationCountChange
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 참여 크루원 수 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600'>참여 크루원 수</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.monthlyParticipantCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    {renderChangeIndicator(stats.monthlyParticipantCountChange)}
                  </div>
                </CardContent>
              </Card>

              {/* 모임개설 크루원 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600'>모임개설 크루원</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.monthlyHostCount}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    {renderChangeIndicator(stats.monthlyHostCountChange)}
                  </div>
                </CardContent>
              </Card>

              {/* 신규 가입 인원 */}
              <Card className='ios-card'>
                <CardContent className='p-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600'>신규 가입 인원</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {stats.newMembersThisMonth}
                        <span className='ml-1 text-sm font-normal text-gray-500'>
                          명
                        </span>
                      </p>
                    </div>
                    {renderChangeIndicator(stats.newMembersThisMonthChange)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AdminBottomNavigation />
    </div>
  );
}
