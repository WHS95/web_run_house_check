"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2,
  Key,
  Users,
  Activity,
  TrendingUp,
  Clock,
  Shield
} from "lucide-react";

interface Crew {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface InviteCode {
  id: number;
  crew_id: string;
  invite_code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  crew_name?: string;
}

interface MasterDashboardProps {
  crews: Crew[];
  inviteCodes: InviteCode[];
}

export default function MasterDashboard({ crews, inviteCodes }: MasterDashboardProps) {
  // 통계 계산
  const totalCrews = crews.length;
  const totalInviteCodes = inviteCodes.length;
  const activeInviteCodes = inviteCodes.filter(code => code.is_active).length;
  const recentCrews = crews.filter(crew => {
    const createdDate = new Date(crew.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate >= weekAgo;
  }).length;

  // 최근 활동
  const recentActivities = [
    ...crews.slice(0, 3).map(crew => ({
      type: "crew_created",
      title: `새 크루 생성: ${crew.name}`,
      time: crew.created_at,
      icon: Building2,
    })),
    ...inviteCodes.slice(0, 3).map(code => ({
      type: "code_created",
      title: `초대 코드 생성: ${code.crew_name || '크루'}`,
      time: code.created_at,
      icon: Key,
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center space-x-3">
        <Shield className="w-6 h-6 text-basic-blue" />
        <div>
          <h1 className="text-xl font-semibold text-white">마스터 대시보드</h1>
          <p className="text-sm text-gray-300">전체 크루 및 초대 코드 현황을 확인합니다.</p>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-basic-black-gray border-basic-gray">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  총 크루 수
                </p>
                <p className="text-2xl font-bold text-white">{totalCrews}</p>
              </div>
              <Building2 className="w-8 h-8 text-basic-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-basic-black-gray border-basic-gray">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  총 초대 코드
                </p>
                <p className="text-2xl font-bold text-white">{totalInviteCodes}</p>
              </div>
              <Key className="w-8 h-8 text-basic-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-basic-black-gray border-basic-gray">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  활성 코드
                </p>
                <p className="text-2xl font-bold text-white">{activeInviteCodes}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-basic-black-gray border-basic-gray">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  이번 주 신규
                </p>
                <p className="text-2xl font-bold text-white">{recentCrews}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 */}
      <Card className="bg-basic-black-gray border-basic-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>최근 활동</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-gray-400 text-center py-4">최근 활동이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-basic-black rounded-lg">
                    <Icon className="w-5 h-5 text-basic-blue" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.time).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        activity.type === 'crew_created' 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-green-600 text-white border-green-600"
                      }
                    >
                      {activity.type === 'crew_created' ? 'CREW' : 'CODE'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 크루별 초대 코드 현황 */}
      <Card className="bg-basic-black-gray border-basic-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>크루별 초대 코드 현황</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {crews.length === 0 ? (
            <p className="text-gray-400 text-center py-4">생성된 크루가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {crews.map((crew) => {
                const crewCodes = inviteCodes.filter(code => code.crew_id === crew.id);
                const activeCodes = crewCodes.filter(code => code.is_active);
                
                return (
                  <div key={crew.id} className="flex items-center justify-between p-3 bg-basic-black rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{crew.name}</h4>
                      <p className="text-xs text-gray-400">
                        생성: {new Date(crew.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-basic-blue text-white border-basic-blue">
                        총 {crewCodes.length}개
                      </Badge>
                      <Badge variant="outline" className="bg-green-600 text-white border-green-600">
                        활성 {activeCodes.length}개
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}