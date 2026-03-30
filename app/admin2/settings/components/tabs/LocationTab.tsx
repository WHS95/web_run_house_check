"use client";

import {
    memo,
    useState,
    useCallback,
    useEffect,
} from "react";
import {
    AdminSwitchRow,
    AdminLabeledInput,
    AdminDivider,
    AdminAlertDialog,
} from "@/app/admin2/components/ui";
import { useCrewLocationContext } from "@/contexts/CrewLocationContext";
import { CrewLocation } from "@/lib/validators/crewLocationSchema";
import { MapPin, Trash2, Edit2, ChevronDown } from "lucide-react";
import { haptic } from "@/lib/haptic";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";

interface LocationTabProps {
    crewId: string;
    locationBasedAttendance: boolean;
}

const LocationTab = memo(function LocationTab({
    crewId,
    locationBasedAttendance,
}: LocationTabProps) {
    const { state, actions } = useCrewLocationContext();
    const { locations, loading } = state;

    const [isEnabled, setIsEnabled] = useState(
        locationBasedAttendance
    );
    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] =
        useState<CrewLocation | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        latitude: "",
        longitude: "",
    });
    const [deleteTarget, setDeleteTarget] =
        useState<CrewLocation | null>(null);
    const [saving, setSaving] = useState(false);

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
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            crew_id: crewId,
                            location_based_attendance: enabled,
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

    // 폼 초기화
    const resetForm = useCallback(() => {
        setFormData({
            name: "",
            latitude: "",
            longitude: "",
        });
        setEditingLocation(null);
        setShowForm(false);
    }, []);

    // 편집 시작
    const startEdit = useCallback((loc: CrewLocation) => {
        haptic.light();
        setEditingLocation(loc);
        setFormData({
            name: loc.name,
            latitude: String(loc.latitude),
            longitude: String(loc.longitude),
        });
        setShowForm(true);
    }, []);

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
            const isEditing = !!editingLocation;
            const url = isEditing
                ? `/api/admin/crew-locations/${editingLocation!.id}`
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
                const result = await res.json();
                if (isEditing) {
                    actions.updateLocation(result.data);
                } else {
                    actions.addLocation(result.data);
                }
                haptic.success();
                resetForm();
            }
        } catch {
            haptic.error();
        } finally {
            setSaving(false);
        }
    }, [
        formData,
        editingLocation,
        crewId,
        actions,
        resetForm,
    ]);

    // 장소 삭제
    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        actions.setLoading(true);

        try {
            const res = await fetch(
                `/api/admin/crew-locations/${deleteTarget.id}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                actions.deleteLocation(deleteTarget.id);
                haptic.success();
            }
        } catch {
            haptic.error();
        } finally {
            actions.setLoading(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, actions]);

    // 장소 활성/비활성 토글
    const handleLocationToggle = useCallback(
        async (loc: CrewLocation) => {
            try {
                const res = await fetch(
                    `/api/admin/crew-locations/${loc.id}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            is_active: !loc.is_active,
                        }),
                    }
                );
                if (res.ok) {
                    const result = await res.json();
                    actions.updateLocation({
                        ...result.data,
                        updated_at: new Date().toISOString(),
                    });
                    haptic.success();
                }
            } catch {
                haptic.error();
            }
        },
        [actions]
    );

    return (
        <div className="space-y-4">
            {/* 위치 기반 출석 토글 */}
            <AdminSwitchRow
                label="위치 기반 출석"
                checked={isEnabled}
                onCheckedChange={handleToggle}
            />

            {/* 등록된 장소 목록 */}
            {locations.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                            등록된 장소
                        </h3>
                        <span className="text-xs text-rh-text-secondary">
                            {locations.length}개
                        </span>
                    </div>
                    <AnimatedList className="space-y-2">
                        {locations.map((loc) => (
                            <AnimatedItem key={loc.id}>
                                <LocationCard
                                    location={loc}
                                    onEdit={startEdit}
                                    onDelete={setDeleteTarget}
                                    onToggle={
                                        handleLocationToggle
                                    }
                                />
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                </div>
            )}

            <AdminDivider />

            {/* 장소 추가/수정 폼 */}
            {showForm ? (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white">
                        {editingLocation
                            ? "장소 수정"
                            : "활동 장소 정보 입력"}
                    </h3>
                    <p className="text-xs text-rh-text-secondary">
                        지도에서 위치를 선택하면 위도/경도가
                        자동으로 채워집니다
                    </p>

                    {/* 지도 플레이스홀더 */}
                    <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl bg-rh-bg-surface border border-rh-border">
                        <MapPin
                            size={32}
                            className="text-rh-text-muted"
                        />
                        <span className="text-sm text-rh-text-secondary">
                            지도 위치를 선택해 주세요
                        </span>
                    </div>

                    <button className="w-full h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white">
                        지도에서 위치 선택
                    </button>

                    <AdminLabeledInput
                        label="위도"
                        value={formData.latitude}
                        onChange={(v) =>
                            setFormData((p) => ({
                                ...p,
                                latitude: v,
                            }))
                        }
                        placeholder="예: 37.5666080"
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
                        placeholder="예: 126.9784414"
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

                    <div className="flex gap-2">
                        <button
                            onClick={resetForm}
                            className="flex-1 h-11 rounded-xl bg-rh-bg-muted text-sm font-medium text-white"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {saving
                                ? "저장 중..."
                                : editingLocation
                                  ? "수정"
                                  : "저장"}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => {
                        haptic.light();
                        setShowForm(true);
                    }}
                    className="w-full h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white"
                >
                    + 장소 추가
                </button>
            )}

            {/* 삭제 확인 다이얼로그 */}
            <AdminAlertDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="장소를 삭제하시겠습니까?"
                description={
                    deleteTarget
                        ? `"${deleteTarget.name}" 장소가 삭제됩니다.`
                        : ""
                }
                cancelLabel="취소"
                confirmLabel="삭제"
                confirmVariant="danger"
            />
        </div>
    );
});

// 장소 카드 컴포넌트
const LocationCard = memo(function LocationCard({
    location,
    onEdit,
    onDelete,
    onToggle,
}: {
    location: CrewLocation;
    onEdit: (loc: CrewLocation) => void;
    onDelete: (loc: CrewLocation) => void;
    onToggle: (loc: CrewLocation) => void;
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-rh-bg-surface">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-rh-accent/20 flex items-center justify-center shrink-0">
                    <MapPin
                        size={16}
                        className="text-rh-accent"
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                        {location.name}
                    </p>
                    <p className="text-xs text-rh-text-secondary">
                        {location.latitude?.toFixed(4) ?? "-"},{" "}
                        {location.longitude?.toFixed(4) ?? "-"}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        location.is_active
                            ? "bg-rh-accent/20 text-rh-accent"
                            : "bg-rh-bg-muted text-rh-text-secondary"
                    }`}
                    onClick={() => onToggle(location)}
                >
                    {location.is_active ? "활성" : "비활성"}
                </span>
                <button
                    onClick={() => onEdit(location)}
                    className="p-1.5 text-rh-text-secondary"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => onDelete(location)}
                    className="p-1.5 text-rh-text-secondary"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
});

export default LocationTab;
