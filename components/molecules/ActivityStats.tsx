"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { TrendingUp, Award, Users } from "lucide-react";
import { UserActivityStatistics } from "@/lib/supabase/admin";

interface ActivityStatsProps {
  userId: string;
  timePeriod: "week" | "month" | "year";
}

const ActivityStats: React.FC<ActivityStatsProps> = ({
  userId,
  timePeriod,
}) => {
  const [stats, setStats] = useState<UserActivityStatistics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (userId && timePeriod) {
      loadStats();
    }
  }, [userId, timePeriod]);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .schema("attendance")
        .rpc("get_user_activity_statistics", {
          p_user_id: userId,
          p_time_period: timePeriod,
        });

      if (error) {
        throw new Error(error.message);
      }

      setStats(data || []);
    } catch (err) {
      //console.error('통계 로딩 오류:', err);
      setError(
        err instanceof Error ? err.message : "통계를 불러올 수 없습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500 text-white";
    if (rank <= 3) return "bg-rh-bg-muted text-white";
    if (rank <= 10) return "bg-blue-500 text-white";
    return "bg-rh-bg-muted text-rh-text-muted";
  };

  if (isLoading) {
    return (
      <div className='space-y-2'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className='bg-rh-bg-surface rounded-rh-xl p-4 animate-pulse'
          >
            <div className='h-[1.5rem] bg-rh-bg-surface rounded mb-4'></div>
            <div className='grid grid-cols-3 gap-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='text-center'>
                  <div className='h-[2rem] bg-rh-bg-surface rounded mb-2'></div>
                  <div className='h-[1rem] bg-rh-bg-surface rounded'></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='w-[4rem] h-[4rem] bg-red-500/20 rounded-full flex items-center justify-center mb-4'>
          <TrendingUp className='w-[1.5rem] h-[1.5rem] text-red-400' />
        </div>
        <p className='text-rh-text-secondary text-[0.875rem] mb-4'>{error}</p>
        <button
          onClick={loadStats}
          className='px-4 py-2 bg-blue-600 text-white rounded-rh-md text-[0.875rem] hover:bg-blue-700 transition-colors'
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='w-[4rem] h-[4rem] bg-rh-bg-muted/20 rounded-full flex items-center justify-center mb-4'>
          <TrendingUp className='w-[1.5rem] h-[1.5rem] text-rh-text-secondary' />
        </div>
        <p className='text-rh-text-secondary text-[0.875rem]'>활동 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {stats.map((stat, index) => (
        <div key={index} className='bg-rh-bg-surface rounded-rh-xl p-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-white font-medium text-[1rem]'>
              {stat.period_label}
            </h3>
            <div
              className={`px-2 py-0.5 rounded-full text-[0.75rem] font-medium flex items-center ${getRankBadgeColor(
                stat.user_rank
              )}`}
            >
              <Award className='w-[0.75rem] h-[0.75rem] mr-0.5' />
              {stat.user_rank}위
            </div>
          </div>

          <div className='grid grid-cols-3 gap-2 mb-4'>
            <div className='text-center'>
              <div className='text-[1.5rem] font-bold text-blue-400'>
                {stat.attendance_count}
              </div>
              <div className='text-[0.75rem] text-rh-text-secondary'>참여 횟수</div>
            </div>
            <div className='text-center'>
              <div className='text-[1.5rem] font-bold text-green-400'>
                {stat.meetings_created_count}
              </div>
              <div className='text-[0.75rem] text-rh-text-secondary'>개설 횟수</div>
            </div>
            <div className='text-center'>
              <div className='text-[1.5rem] font-bold text-rh-text-secondary'>
                {stat.total_participants}
              </div>
              <div className='text-[0.75rem] text-rh-text-secondary flex items-center justify-center'>
                <Users className='w-[0.75rem] h-[0.75rem] mr-0.5' />
                전체 참가자
              </div>
            </div>
          </div>

          {/* 활동 점수 바 */}
          <div>
            <div className='flex items-center justify-between text-[0.75rem] text-rh-text-secondary mb-2'>
              <span>활동 점수</span>
              <span>
                {stat.attendance_count + stat.meetings_created_count}점
              </span>
            </div>
            <div className='w-full bg-rh-bg-surface rounded-full h-0.5'>
              <div
                className='bg-gradient-to-r from-blue-500 to-green-500 h-0.5 rounded-full transition-all duration-300'
                style={{
                  width: `${Math.min(
                    ((stat.attendance_count + stat.meetings_created_count) /
                      Math.max(
                        ...stats.map(
                          (s) => s.attendance_count + s.meetings_created_count
                        )
                      )) *
                      100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityStats;
