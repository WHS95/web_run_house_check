"use client";

import {
    memo,
    useState,
    useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
    AdminSwitchRow,
    AdminLabeledInput,
    AdminAlertDialog,
} from "@/app/admin2/components/ui";
import { CrewLocation } from "@/lib/validators/crewLocationSchema";
import { MapPin } from "lucide-react";
import { haptic } from "@/lib/haptic";
import FadeIn from "@/components/atoms/FadeIn";

interface PlaceFormProps {
    crewId: string;
    locationBasedAttendance: boolean;
    /** 편집 모드일 때 기존 장소 데이터 */
    initialData?: CrewLocation;
    /** 인라인 모드에서 뒤로가기 콜백 */
    onBack?: () => void;
}

const PlaceForm = memo(function PlaceForm({
    crewId,
    locationBasedAttendance,
    initialData,
    onBack,
}: PlaceFormProps) {
    const router = useRouter();
    const isEditing = !!initialData;

    const [isEnabled, setIsEnabled] = useState(
        locationBasedAttendance
    );
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        latitude: initialData
            ? String(initialData.latitude)
            : "",
        longitude: initialData
            ? String(initialData.longitude)
            : "",
    });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] =
        useState(false);

    // 위치 기반 출석 토글
    const handleToggle = useCallback(
        async (enabled: boolean) => {
            haptic.medium();
            try {
                const res = await fetch(
                    "/api/admin/crew-settings/" +
                        "location-attendance",
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            crew_id: crewId,
                            location_based_attendance:
                                enabled,
                        }),
                    }
                );
                if (res.ok) {
                    setIsEnabled(enabled);
                    haptic.success();
                }
            } catch {
                haptic.error();
            }
        },
        [crewId]
    );

    // 장소 저장
    const handleSave = useCallback(async () => {
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (
            !formData.name.trim() ||
            isNaN(lat) ||
            isNaN(lng)
        ) {
            return;
        }

        setSaving(true);
        haptic.medium();

        try {
            const url = isEditing
                ? `/api/admin/crew-locations/${initialData!.id}`
                : "/api/admin/crew-locations";
            const method = isEditing ? "PUT" : "POST";
            const body = isEditing
                ? {
                      name: formData.name.trim(),
                      latitude: lat,
                      longitude: lng,
                  }
                : {
                      crew_id: crewId,
                      name: formData.name.trim(),
                      latitude: lat,
                      longitude: lng,
                  };

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                haptic.success();
                if (onBack) {
                    onBack();
                } else {
                    router.push(
                        "/admin2/settings?tab=location"
                    );
                    router.refresh();
                }
            }
        } catch {
            haptic.error();
        } finally {
            setSaving(false);
        }
    }, [formData, isEditing, initialData, crewId, router, onBack]);

    // 장소 삭제
    const handleDelete = useCallback(async () => {
        if (!initialData) return;

        try {
            const res = await fetch(
                `/api/admin/crew-locations/${initialData.id}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                haptic.success();
                if (onBack) {
                    onBack();
                } else {
                    router.push(
                        "/admin2/settings?tab=location"
                    );
                    router.refresh();
                }
            }
        } catch {
            haptic.error();
        } finally {
            setDeleteConfirm(false);
        }
    }, [initialData, router, onBack]);

    return (
        <FadeIn>
            <div className="px-4 py-4 space-y-4">
                {/* 위치 기반 출석 토글 */}
                <AdminSwitchRow
                    label="위치 기반 출석"
                    checked={isEnabled}
                    onCheckedChange={handleToggle}
                />

                {/* 활동 장소 정보 입력 섹션 */}
                <div className="rounded-xl bg-rh-bg-surface p-3 space-y-3">
                    <h3 className="text-[15px] font-semibold text-white">
                        활동 장소 정보 입력
                    </h3>

                    {/* 지도 카드 */}
                    <div className="rounded-xl bg-rh-bg-primary p-3 space-y-2.5">
                        <p className="text-[13px] font-medium text-slate-300">
                            지도에서 위치를 선택하면
                            위도/경도가 자동으로 채워집니다
                        </p>
                        <div className="flex flex-col items-center justify-center gap-2 h-[172px] rounded-[10px] bg-rh-bg-surface">
                            <MapPin
                                size={20}
                                style={{
                                    color: "#8BB5F5",
                                }}
                            />
                            <span className="text-sm font-medium text-slate-200">
                                지도 위치를 선택해 주세요
                            </span>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white">
                            지도에서 위치 선택
                        </button>
                    </div>

                    {/* 입력 필드들 */}
                    <AdminLabeledInput
                        label="위도"
                        value={formData.latitude}
                        onChange={(v) =>
                            setFormData((p) => ({
                                ...p,
                                latitude: v,
                            }))
                        }
                        placeholder="예: 37.566680"
                        type="text"
                    />
                    <AdminLabeledInput
                        label="경도"
                        value={formData.longitude}
                        onChange={(v) =>
                            setFormData((p) => ({
                                ...p,
                                longitude: v,
                            }))
                        }
                        placeholder="예: 126.978414"
                        type="text"
                    />
                    <AdminLabeledInput
                        label="장소명"
                        value={formData.name}
                        onChange={(v) =>
                            setFormData((p) => ({
                                ...p,
                                name: v,
                            }))
                        }
                        placeholder="예: 한강공원 반포지구"
                    />
                    <p className="text-xs font-medium text-rh-text-secondary">
                        장소명은 팀원들이 구분하기 쉽게
                        작성해 주세요
                    </p>
                </div>

                {/* 저장 / 삭제 버튼 */}
                <div className="flex gap-2">
                    {isEditing && (
                        <button
                            onClick={() =>
                                setDeleteConfirm(true)
                            }
                            className="flex-1 h-12 rounded-xl bg-rh-bg-muted text-sm font-medium text-white"
                        >
                            삭제
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-12 rounded-xl bg-rh-accent text-[15px] font-semibold text-white disabled:opacity-50"
                    >
                        {saving
                            ? "저장 중..."
                            : isEditing
                              ? "수정"
                              : "저장"}
                    </button>
                </div>

                {/* 삭제 확인 다이얼로그 */}
                {isEditing && (
                    <AdminAlertDialog
                        open={deleteConfirm}
                        onClose={() =>
                            setDeleteConfirm(false)
                        }
                        onConfirm={handleDelete}
                        title="장소를 삭제하시겠습니까?"
                        description={`"${initialData!.name}" 장소가 삭제됩니다.`}
                        cancelLabel="취소"
                        confirmLabel="삭제"
                        confirmVariant="danger"
                    />
                )}
            </div>
        </FadeIn>
    );
});

export default PlaceForm;
