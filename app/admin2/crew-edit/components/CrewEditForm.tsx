"use client";

import { useState, useCallback, memo } from "react";
import { Camera } from "lucide-react";
import FadeIn from "@/components/atoms/FadeIn";
import {
    AdminLabeledInput,
    AdminDivider,
} from "@/app/admin2/components/ui";

interface CrewEditFormProps {
    crewId: string;
    initialData: {
        name: string;
        description: string;
        region: string;
        maxMembers: number;
        createdAt: string;
        currentMembers: number;
        logoUrl: string | null;
    };
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return "정보 없음";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const CrewEditForm = memo(function CrewEditForm({
    crewId,
    initialData,
}: CrewEditFormProps) {
    const [name, setName] = useState(initialData.name);
    const [description, setDescription] = useState(
        initialData.description,
    );
    const [region, setRegion] = useState(
        initialData.region,
    );
    const [maxMembers, setMaxMembers] = useState(
        String(initialData.maxMembers),
    );
    const [saving, setSaving] = useState(false);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            // TODO: Supabase 크루 정보 업데이트 API 연동
            const { createClient } = await import(
                "@/lib/supabase/client"
            );
            const supabase = createClient();
            const { error } = await supabase
                .schema("attendance")
                .from("crews")
                .update({
                    name: name.trim(),
                    description: description.trim(),
                    region: region.trim(),
                    max_members: parseInt(maxMembers) || 50,
                })
                .eq("id", crewId);

            if (error) {
                alert("크루 정보 수정에 실패했습니다.");
                return;
            }
            alert("크루 정보가 수정되었습니다.");
        } catch {
            alert("오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    }, [crewId, name, description, region, maxMembers]);

    return (
        <FadeIn>
            <div className="flex-1 px-4 pt-4 pb-8 space-y-6">
                {/* 로고 영역 */}
                <div className="flex flex-col items-center gap-2 py-2">
                    <button className="w-16 h-16 rounded-full bg-rh-bg-surface flex items-center justify-center">
                        <Camera
                            size={24}
                            className="text-rh-text-secondary"
                        />
                    </button>
                    <span className="text-xs font-medium text-rh-accent">
                        크루 로고 변경
                    </span>
                </div>

                {/* 편집 폼 */}
                <div className="space-y-4">
                    <AdminLabeledInput
                        label="크루명"
                        value={name}
                        onChange={setName}
                        placeholder="크루 이름을 입력하세요"
                    />
                    <AdminLabeledInput
                        label="크루 소개"
                        value={description}
                        onChange={setDescription}
                        placeholder="크루 소개를 입력하세요"
                    />
                    <AdminLabeledInput
                        label="활동 지역"
                        value={region}
                        onChange={setRegion}
                        placeholder="활동 지역을 입력하세요"
                    />
                    <AdminLabeledInput
                        label="최대 인원"
                        value={maxMembers}
                        onChange={setMaxMembers}
                        placeholder="50"
                        type="number"
                    />
                </div>

                {/* 크루 정보 (읽기 전용) */}
                <div className="space-y-3">
                    <span className="text-xs font-semibold text-rh-text-tertiary uppercase tracking-widest">
                        크루 정보
                    </span>
                    <AdminDivider />
                    <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-rh-text-secondary">
                            생성일
                        </span>
                        <span className="text-sm font-medium text-white">
                            {formatDate(
                                initialData.createdAt,
                            )}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-rh-text-secondary">
                            현재 인원
                        </span>
                        <span className="text-sm font-medium text-white">
                            {initialData.currentMembers}명
                        </span>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <button
                    className="w-full py-3.5 rounded-xl bg-rh-accent text-white text-sm font-semibold disabled:opacity-50"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? "저장 중..."
                        : "변경사항 저장"}
                </button>
            </div>
        </FadeIn>
    );
});

export default CrewEditForm;
