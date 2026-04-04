"use client";

import {
    memo,
    useState,
    useCallback,
    useMemo,
} from "react";
import {
    AdminSwitchRow,
    AdminSearchBar,
    AdminBadge,
    AdminLabeledInput,
    AdminAlertDialog,
} from "@/app/admin2/components/ui";
import {
    useCrewLocationContext,
} from "@/contexts/CrewLocationContext";
import {
    CrewLocation,
} from "@/lib/validators/crewLocationSchema";
import { MapPin, ChevronRight } from "lucide-react";
import { haptic } from "@/lib/haptic";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";

/* ── 상수 ── */
const CLS_CARD =
    "rounded-xl bg-rh-bg-surface px-4 py-3";
const CLS_BTN_PRIMARY =
    "w-full h-12 rounded-xl bg-rh-accent"
    + " text-[15px] font-semibold text-white";
const CLS_SUB_TEXT =
    "text-xs text-rh-text-secondary";

/* ── 타입 ── */
interface LocationTabProps {
    crewId: string;
    locationBasedAttendance: boolean;
}

/* ── 컴포넌트 ── */
const LocationTab = memo(function LocationTab({
    crewId,
    locationBasedAttendance,
}: LocationTabProps) {
    const { state, actions } =
        useCrewLocationContext();
    const { locations } = state;

    const [isEnabled, setIsEnabled] = useState(
        locationBasedAttendance
    );
    const [viewMode, setViewMode] = useState<
        "list" | "form"
    >("list");
    const [editingLocation, setEditingLocation] =
        useState<CrewLocation | null>(null);
    const [search, setSearch] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        latitude: "",
        longitude: "",
    });
    const [deleteConfirm, setDeleteConfirm] =
        useState(false);
    const [saving, setSaving] = useState(false);

    /* 검색 필터링 */
    const filteredLocations = useMemo(() => {
        if (!search.trim()) return locations;
        const q = search.trim().toLowerCase();
        return locations.filter((loc) =>
            loc.name.toLowerCase().includes(q)
        );
    }, [locations, search]);

    /* 위치 기반 출석 토글 */
    const handleToggle = useCallback(
        async (enabled: boolean) => {
            haptic.medium();
            try {
                const url =
                    "/api/admin/crew-settings"
                    + "/location-attendance";
                const res = await fetch(url, {
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
                });
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

    /* 폼 초기화 + 리스트로 복귀 */
    const resetForm = useCallback(() => {
        setFormData({
            name: "",
            latitude: "",
            longitude: "",
        });
        setEditingLocation(null);
        setViewMode("list");
    }, []);

    /* 편집 시작 */
    const startEdit = useCallback(
        (loc: CrewLocation) => {
            haptic.light();
            setEditingLocation(loc);
            setFormData({
                name: loc.name,
                latitude: String(loc.latitude),
                longitude: String(loc.longitude),
            });
            setViewMode("form");
        },
        []
    );

    /* 새 장소 추가 시작 */
    const startAdd = useCallback(() => {
        haptic.light();
        setEditingLocation(null);
        setFormData({
            name: "",
            latitude: "",
            longitude: "",
        });
        setViewMode("form");
    }, []);

    /* 장소 저장 */
    const handleSave = useCallback(async () => {
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (
            !formData.name.trim()
            || isNaN(lat)
            || isNaN(lng)
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
            const method =
                isEditing ? "PUT" : "POST";
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
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const result = await res.json();
                if (isEditing) {
                    actions.updateLocation(
                        result.data
                    );
                } else {
                    actions.addLocation(
                        result.data
                    );
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

    /* 장소 삭제 */
    const handleDelete = useCallback(async () => {
        if (!editingLocation) return;
        actions.setLoading(true);

        try {
            const url =
                `/api/admin/crew-locations/${editingLocation.id}`;
            const res = await fetch(url, {
                method: "DELETE",
            });
            if (res.ok) {
                actions.deleteLocation(
                    editingLocation.id
                );
                haptic.success();
                setDeleteConfirm(false);
                resetForm();
            }
        } catch {
            haptic.error();
        } finally {
            actions.setLoading(false);
        }
    }, [editingLocation, actions, resetForm]);

    /* 폼 필드 변경 핸들러 */
    const handleLatChange = useCallback(
        (v: string) => {
            setFormData((p) => ({
                ...p,
                latitude: v,
            }));
        },
        []
    );
    const handleLngChange = useCallback(
        (v: string) => {
            setFormData((p) => ({
                ...p,
                longitude: v,
            }));
        },
        []
    );
    const handleNameChange = useCallback(
        (v: string) => {
            setFormData((p) => ({
                ...p,
                name: v,
            }));
        },
        []
    );

    /* ────── 폼 뷰 ────── */
    if (viewMode === "form") {
        return (
            <div className="space-y-4">
                <AdminSwitchRow
                    label="위치 기반 출석"
                    checked={isEnabled}
                    onCheckedChange={handleToggle}
                />

                {/* 폼 카드 */}
                <div className="rounded-xl bg-rh-bg-surface p-3 space-y-3">
                    <h3 className="text-[15px] font-semibold text-white">
                        활동 장소 정보 입력
                    </h3>

                    {/* 내부 카드 */}
                    <div className="rounded-xl bg-rh-bg-primary p-3 space-y-2.5">
                        <p className="text-[13px] font-medium text-slate-300">
                            지도에서 위치를 선택하면
                            위도/경도가 자동으로
                            채워집니다
                        </p>

                        {/* 지도 플레이스홀더 */}
                        <div className="flex flex-col items-center justify-center gap-2 h-[172px] rounded-[10px] bg-rh-bg-surface">
                            <MapPin
                                size={20}
                                color="#8BB5F5"
                            />
                            <span className="text-sm text-rh-text-secondary">
                                지도 위치를 선택해
                                주세요
                            </span>
                        </div>

                        <button className="w-full h-11 rounded-xl bg-rh-accent text-sm font-semibold text-white">
                            지도에서 위치 선택
                        </button>
                    </div>

                    <AdminLabeledInput
                        label="위도"
                        value={formData.latitude}
                        onChange={handleLatChange}
                        placeholder="예: 37.566680"
                        type="text"
                    />
                    <AdminLabeledInput
                        label="경도"
                        value={formData.longitude}
                        onChange={handleLngChange}
                        placeholder="예: 126.978414"
                        type="text"
                    />
                    <AdminLabeledInput
                        label="장소명"
                        value={formData.name}
                        onChange={handleNameChange}
                        placeholder="예: 한강공원 반포지구"
                    />
                    <p className={CLS_SUB_TEXT}>
                        장소명은 팀원들이 구분하기
                        쉽게 작성해 주세요
                    </p>
                </div>

                {/* 하단 버튼 */}
                <div className="flex gap-2">
                    {editingLocation && (
                        <button
                            onClick={() =>
                                setDeleteConfirm(
                                    true
                                )
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
                            : editingLocation
                              ? "수정"
                              : "저장"}
                    </button>
                </div>

                <AdminAlertDialog
                    open={deleteConfirm}
                    onClose={() =>
                        setDeleteConfirm(false)
                    }
                    onConfirm={handleDelete}
                    title="장소를 삭제하시겠습니까?"
                    description={
                        editingLocation
                            ? `"${editingLocation.name}" 장소가 삭제됩니다.`
                            : ""
                    }
                    cancelLabel="취소"
                    confirmLabel="삭제"
                    confirmVariant="danger"
                />
            </div>
        );
    }

    /* ────── 리스트 뷰 ────── */
    return (
        <div className="space-y-4">
            <AdminSwitchRow
                label="위치 기반 출석"
                checked={isEnabled}
                onCheckedChange={handleToggle}
            />

            <AdminSearchBar
                value={search}
                onChange={setSearch}
                placeholder="장소명 검색"
            />

            {/* 등록된 장소 헤더 */}
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                    등록된 장소
                </h3>
                <AdminBadge variant="muted">
                    {locations.length}
                </AdminBadge>
            </div>

            {/* 장소 리스트 */}
            <AnimatedList className="space-y-2">
                {filteredLocations.map((loc) => (
                    <AnimatedItem key={loc.id}>
                        <button
                            onClick={() =>
                                startEdit(loc)
                            }
                            className={
                                "flex items-center"
                                + " justify-between"
                                + " w-full"
                                + " " + CLS_CARD
                                + " text-left"
                            }
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {loc.name}
                                </p>
                                <p className={CLS_SUB_TEXT}>
                                    {"위도 "}
                                    {loc.latitude
                                        ?.toFixed(4)
                                        ?? "-"}
                                    {" · 경도 "}
                                    {loc.longitude
                                        ?.toFixed(4)
                                        ?? "-"}
                                </p>
                            </div>
                            <ChevronRight
                                size={18}
                                className="text-rh-text-secondary shrink-0 ml-2"
                            />
                        </button>
                    </AnimatedItem>
                ))}
            </AnimatedList>

            <button
                onClick={startAdd}
                className={CLS_BTN_PRIMARY}
            >
                + 새 장소 추가
            </button>
        </div>
    );
});

export default LocationTab;
