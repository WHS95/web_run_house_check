"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface Recommendation {
    user_id: string;
    user_name: string;
    current_grade_id: number | null;
    current_grade_name: string;
    recommended_grade_id: number | null;
    recommended_grade_name: string;
    attendance_count: number;
    hosting_count: number;
}

interface AdminGradeRecommendationsProps {
    crewId: string;
}

export default function AdminGradeRecommendations({
    crewId,
}: AdminGradeRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState<Set<string>>(
        new Set()
    );
    const [approvingAll, setApprovingAll] = useState(false);

    const fetchRecommendations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/grade-recommendations?crewId=${crewId}`
            );
            if (res.ok) {
                const data = await res.json();
                setRecommendations(data);
            }
        } catch (error) {
            console.error(
                "등급 추천 데이터를 불러오는 중 오류 발생:",
                error
            );
        } finally {
            setLoading(false);
        }
    }, [crewId]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    const handleApprove = useCallback(
        async (userId: string, newGradeId: number | null) => {
            haptic.light();
            setProcessingIds((prev) => new Set(prev).add(userId));
            try {
                const res = await fetch(
                    "/api/admin/grade-recommendations/approve",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId,
                            crewId,
                            newGradeId,
                        }),
                    }
                );
                if (res.ok) {
                    haptic.success();
                    await fetchRecommendations();
                }
            } catch (error) {
                console.error("승인 처리 중 오류 발생:", error);
            } finally {
                setProcessingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            }
        },
        [crewId, fetchRecommendations]
    );

    const handleDeny = useCallback(
        async (userId: string) => {
            haptic.light();
            setProcessingIds((prev) => new Set(prev).add(userId));
            try {
                const res = await fetch(
                    "/api/admin/grade-recommendations/deny",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, crewId }),
                    }
                );
                if (res.ok) {
                    await fetchRecommendations();
                }
            } catch (error) {
                console.error("거부 처리 중 오류 발생:", error);
            } finally {
                setProcessingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            }
        },
        [crewId, fetchRecommendations]
    );

    const handleApproveAll = useCallback(async () => {
        haptic.medium();
        setApprovingAll(true);
        try {
            const res = await fetch(
                "/api/admin/grade-recommendations/approve-all",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ crewId }),
                }
            );
            if (res.ok) {
                haptic.success();
                await fetchRecommendations();
            }
        } catch (error) {
            console.error("전체 승인 처리 중 오류 발생:", error);
        } finally {
            setApprovingAll(false);
        }
    }, [crewId, fetchRecommendations]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-rh-bg-surface rounded-xl p-4 animate-pulse"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-4 w-20 bg-rh-bg-muted rounded" />
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-12 bg-rh-bg-muted rounded-full" />
                                <div className="h-3 w-3 bg-rh-bg-muted rounded" />
                                <div className="h-5 w-12 bg-rh-bg-muted rounded-full" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="h-3 w-16 bg-rh-bg-muted rounded" />
                            <div className="h-3 w-16 bg-rh-bg-muted rounded" />
                        </div>
                        <div className="flex gap-2">
                            <div className="h-9 flex-1 bg-rh-bg-muted rounded-xl" />
                            <div className="h-9 flex-1 bg-rh-bg-muted rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="w-12 h-12 text-rh-text-tertiary mb-3" />
                <p className="text-rh-text-tertiary text-sm">
                    변경 추천이 없습니다
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-white text-base font-semibold">
                        등급 변경 추천
                    </h3>
                    <span className="bg-rh-accent rounded-full w-5 h-5 flex items-center justify-center text-xs text-white font-bold">
                        {recommendations.length}
                    </span>
                </div>
                <button
                    onClick={handleApproveAll}
                    disabled={approvingAll}
                    className="bg-rh-accent text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition-opacity"
                >
                    {approvingAll ? "처리 중..." : "전체 승인"}
                </button>
            </div>

            {/* 추천 카드 목록 */}
            <div className="space-y-3">
                {recommendations.map((rec) => {
                    const isProcessing = processingIds.has(rec.user_id);

                    return (
                        <div
                            key={rec.user_id}
                            className="bg-rh-bg-surface rounded-xl p-4"
                        >
                            {/* 사용자 이름 및 등급 변경 */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-white text-sm font-semibold">
                                    {rec.user_name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="bg-rh-bg-muted rounded-full px-2 py-0.5 text-xs text-rh-text-secondary">
                                        {rec.current_grade_name}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-green-400" />
                                    <span className="bg-green-500/10 rounded-full px-2 py-0.5 text-xs text-green-400 font-semibold">
                                        {rec.recommended_grade_name}
                                    </span>
                                </div>
                            </div>

                            {/* 통계 */}
                            <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-1">
                                    <span className="text-rh-text-tertiary text-xs">
                                        참여 횟수
                                    </span>
                                    <span className="text-white text-sm font-semibold">
                                        {rec.attendance_count}회
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-rh-text-tertiary text-xs">
                                        개설 횟수
                                    </span>
                                    <span className="text-white text-sm font-semibold">
                                        {rec.hosting_count}회
                                    </span>
                                </div>
                            </div>

                            {/* 버튼 */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        handleDeny(rec.user_id)
                                    }
                                    disabled={isProcessing}
                                    className="bg-rh-bg-surface border border-rh-border text-white rounded-xl py-2 text-sm flex-1 disabled:opacity-50 transition-opacity"
                                >
                                    거부
                                </button>
                                <button
                                    onClick={() =>
                                        handleApprove(
                                            rec.user_id,
                                            rec.recommended_grade_id
                                        )
                                    }
                                    disabled={isProcessing}
                                    className="bg-rh-accent text-white rounded-xl py-2 text-sm font-semibold flex-1 disabled:opacity-50 transition-opacity"
                                >
                                    {isProcessing
                                        ? "처리 중..."
                                        : "승인"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
