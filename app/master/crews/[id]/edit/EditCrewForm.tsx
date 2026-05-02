"use client";

import {
    useCallback,
    useState,
    useTransition,
    memo,
    type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { updateCrewAction } from "@/app/master/actions";

interface EditCrewFormProps {
    crew: {
        id: string;
        name: string;
        description: string | null;
        region: string | null;
        location_based_attendance: boolean | null;
        accuracy_range: number | null;
        allow_unregistered_location: boolean | null;
    };
}

interface FormState {
    name: string;
    description: string;
    region: string;
    locationBasedAttendance: boolean;
    accuracyRange: string;
    allowUnregisteredLocation: boolean;
}

const EditCrewForm = memo(function EditCrewForm({
    crew,
}: EditCrewFormProps) {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(() => ({
        name: crew.name,
        description: crew.description ?? "",
        region: crew.region ?? "",
        locationBasedAttendance: crew.location_based_attendance ?? false,
        accuracyRange:
            crew.accuracy_range !== null && crew.accuracy_range !== undefined
                ? String(crew.accuracy_range)
                : "",
        allowUnregisteredLocation: crew.allow_unregistered_location ?? false,
    }));
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, name: e.target.value }));
        },
        []
    );

    const handleDescriptionChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setForm((prev) => ({
                ...prev,
                description: e.target.value,
            }));
        },
        []
    );

    const handleRegionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, region: e.target.value }));
        },
        []
    );

    const handleLocationToggle = useCallback((checked: boolean) => {
        setForm((prev) => ({
            ...prev,
            locationBasedAttendance: checked,
            // 끄면 종속 필드도 false로 정리
            allowUnregisteredLocation: checked
                ? prev.allowUnregisteredLocation
                : false,
        }));
    }, []);

    const handleAccuracyRangeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({
                ...prev,
                accuracyRange: e.target.value,
            }));
        },
        []
    );

    const handleAllowUnregisteredToggle = useCallback((checked: boolean) => {
        setForm((prev) => ({
            ...prev,
            allowUnregisteredLocation: checked,
        }));
    }, []);

    const handleSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);

            const trimmedName = form.name.trim();
            if (!trimmedName) {
                setError("크루 이름은 필수입니다.");
                return;
            }

            const payload: Record<string, unknown> = {
                name: trimmedName,
                description: form.description.trim() || null,
                region: form.region.trim() || null,
                location_based_attendance: form.locationBasedAttendance,
                allow_unregistered_location: form.allowUnregisteredLocation,
            };

            if (form.locationBasedAttendance) {
                if (form.accuracyRange.trim()) {
                    const parsed = Number(form.accuracyRange);
                    if (!Number.isFinite(parsed) || parsed <= 0) {
                        setError(
                            "정확도 범위는 0보다 큰 숫자여야 합니다."
                        );
                        return;
                    }
                    if (parsed > 5000) {
                        setError(
                            "정확도 범위는 5000m를 초과할 수 없습니다."
                        );
                        return;
                    }
                    payload.accuracy_range = parsed;
                } else {
                    payload.accuracy_range = null;
                }
            } else {
                payload.accuracy_range = null;
            }

            startTransition(async () => {
                try {
                    const result = await updateCrewAction(crew.id, payload);
                    if (!result.success) {
                        setError(
                            result.message ?? "크루 수정에 실패했습니다."
                        );
                        return;
                    }
                    router.push(`/master/crews/${crew.id}`);
                } catch (err) {
                    console.error("crew update error", err);
                    setError("크루 수정 중 오류가 발생했습니다.");
                }
            });
        },
        [form, crew.id, router]
    );

    const handleCancel = useCallback(() => {
        router.push(`/master/crews/${crew.id}`);
    }, [crew.id, router]);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-rh-status-error bg-rh-bg-surface px-4 py-3"
                >
                    <p className="text-[13px] text-rh-status-error">{error}</p>
                </div>
            )}

            <div className="space-y-2">
                <label
                    htmlFor="crew-name"
                    className="block text-[13px] font-medium text-rh-text-secondary"
                >
                    크루 이름 <span className="text-rh-accent">*</span>
                </label>
                <Input
                    id="crew-name"
                    type="text"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="예: 강남 러닝 크루"
                    maxLength={100}
                    disabled={isPending}
                />
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="crew-description"
                    className="block text-[13px] font-medium text-rh-text-secondary"
                >
                    설명
                </label>
                <Textarea
                    id="crew-description"
                    value={form.description}
                    onChange={handleDescriptionChange}
                    placeholder="크루 소개를 입력해주세요"
                    maxLength={1000}
                    rows={4}
                    disabled={isPending}
                    className="bg-rh-bg-surface text-rh-text-primary border-rh-border placeholder:text-rh-text-muted focus-visible:ring-rh-accent"
                />
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="crew-region"
                    className="block text-[13px] font-medium text-rh-text-secondary"
                >
                    지역
                </label>
                <Input
                    id="crew-region"
                    type="text"
                    value={form.region}
                    onChange={handleRegionChange}
                    placeholder="예: 서울 강남"
                    maxLength={50}
                    disabled={isPending}
                />
            </div>

            <div className="rounded-xl bg-rh-bg-surface p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="pr-3">
                        <p className="text-[14px] font-medium text-white">
                            위치 기반 출석
                        </p>
                        <p className="text-[12px] text-rh-text-tertiary mt-1">
                            지정 위치 반경 내에서만 출석 허용
                        </p>
                    </div>
                    <Switch
                        id="location-based-attendance"
                        checked={form.locationBasedAttendance}
                        onCheckedChange={handleLocationToggle}
                        disabled={isPending}
                    />
                </div>

                {form.locationBasedAttendance && (
                    <>
                        <div className="space-y-2 pt-2 border-t border-rh-border">
                            <label
                                htmlFor="accuracy-range"
                                className="block text-[13px] font-medium text-rh-text-secondary"
                            >
                                정확도 범위 (미터)
                            </label>
                            <Input
                                id="accuracy-range"
                                type="number"
                                min={10}
                                max={5000}
                                value={form.accuracyRange}
                                onChange={handleAccuracyRangeChange}
                                placeholder="예: 100"
                                disabled={isPending}
                                className="bg-rh-bg-primary"
                            />
                            <p className="text-[11px] text-rh-text-tertiary">
                                10m ~ 5000m 사이로 설정
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-rh-border">
                            <div className="pr-3">
                                <p className="text-[14px] font-medium text-white">
                                    미등록 위치 출석 허용
                                </p>
                                <p className="text-[12px] text-rh-text-tertiary mt-1">
                                    등록되지 않은 위치에서도 출석 가능
                                </p>
                            </div>
                            <Switch
                                id="allow-unregistered-location"
                                checked={form.allowUnregisteredLocation}
                                onCheckedChange={handleAllowUnregisteredToggle}
                                disabled={isPending}
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    size="lg"
                    onClick={handleCancel}
                    disabled={isPending}
                >
                    취소
                </Button>
                <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    disabled={isPending}
                >
                    {isPending ? "저장 중..." : "저장"}
                </Button>
            </div>
        </form>
    );
});

export default EditCrewForm;
