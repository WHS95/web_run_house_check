"use client";

import { useState, useCallback } from "react";
import { haptic } from "@/lib/haptic";
import AdminGradeSettings from "./AdminGradeSettings";
import AdminGradeRecommendations from "./AdminGradeRecommendations";
import AdminGradeAssignment from "./AdminGradeAssignment";

interface AdminGradeManagementProps {
    crewId: string;
}

export default function AdminGradeManagement({ crewId }: AdminGradeManagementProps) {
    const [activeSubTab, setActiveSubTab] = useState<
        "settings" | "recommendations" | "assignment"
    >("settings");

    const handleSubTabChange = useCallback((tab: "settings" | "recommendations" | "assignment") => {
        haptic.light();
        setActiveSubTab(tab);
    }, []);

    const subTabs = [
        { key: "settings" as const, label: "등급 설정" },
        { key: "recommendations" as const, label: "추천 확인" },
        { key: "assignment" as const, label: "수동 지정" },
    ];

    return (
        <div className="space-y-4">
            {/* Sub-tab navigation - pill style */}
            <div className="flex gap-2">
                {subTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleSubTabChange(tab.key)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                            activeSubTab === tab.key
                                ? "bg-rh-accent text-white"
                                : "border border-rh-border text-rh-text-secondary hover:text-white"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Sub-tab content */}
            {activeSubTab === "settings" && <AdminGradeSettings crewId={crewId} />}
            {activeSubTab === "recommendations" && <AdminGradeRecommendations crewId={crewId} />}
            {activeSubTab === "assignment" && <AdminGradeAssignment crewId={crewId} />}
        </div>
    );
}
