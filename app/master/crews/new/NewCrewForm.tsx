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
import { createCrewWithFirstAdminCodeAction } from "@/app/master/actions";

interface FormState {
    name: string;
    description: string;
    region: string;
    generateFirstAdminCode: boolean;
}

const INITIAL_STATE: FormState = {
    name: "",
    description: "",
    region: "",
    generateFirstAdminCode: false,
};

const NewCrewForm = memo(function NewCrewForm() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(INITIAL_STATE);
    const [error, setError] = useState<string | null>(null);
    const [issuedCode, setIssuedCode] = useState<string | null>(null);
    const [createdCrewId, setCreatedCrewId] = useState<string | null>(null);
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

    const handleGenerateToggle = useCallback((checked: boolean) => {
        setForm((prev) => ({ ...prev, generateFirstAdminCode: checked }));
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

            startTransition(async () => {
                try {
                    const result = await createCrewWithFirstAdminCodeAction({
                        name: trimmedName,
                        description: form.description.trim() || null,
                        region: form.region.trim() || null,
                        generate_first_admin_code:
                            form.generateFirstAdminCode,
                    });

                    if (!result.success || !result.data) {
                        setError(
                            result.message ?? "크루 생성에 실패했습니다."
                        );
                        return;
                    }

                    const { crew, invite_code } = result.data;
                    setCreatedCrewId(crew.id);

                    if (invite_code) {
                        // 초대코드를 1회 노출 후 상세 페이지로 이동
                        setIssuedCode(invite_code);
                    } else {
                        router.push(`/master/crews/${crew.id}`);
                    }
                } catch (err) {
                    console.error("crew create error", err);
                    setError("크루 생성 중 오류가 발생했습니다.");
                }
            });
        },
        [form, router]
    );

    const handleCloseIssuedCode = useCallback(() => {
        if (createdCrewId) {
            router.push(`/master/crews/${createdCrewId}`);
        }
    }, [createdCrewId, router]);

    if (issuedCode) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl bg-rh-bg-surface p-5 space-y-3">
                    <h2 className="text-[16px] font-semibold text-white">
                        첫 관리자 초대 코드가 발급되었습니다
                    </h2>
                    <p className="text-[13px] text-rh-text-secondary">
                        이 코드는 1회만 표시됩니다. 안전한 곳에 저장하세요.
                    </p>
                    <div className="rounded-lg bg-rh-bg-primary border border-rh-border px-4 py-3">
                        <p className="text-[20px] font-mono font-bold text-rh-accent tracking-widest">
                            {issuedCode}
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    onClick={handleCloseIssuedCode}
                    className="w-full"
                    size="lg"
                >
                    크루 상세로 이동
                </Button>
            </div>
        );
    }

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

            <div className="rounded-xl bg-rh-bg-surface p-4 flex items-center justify-between">
                <div className="pr-3">
                    <p className="text-[14px] font-medium text-white">
                        첫 관리자 초대 코드 자동 발급
                    </p>
                    <p className="text-[12px] text-rh-text-tertiary mt-1">
                        가입 시 자동으로 관리자 권한 부여
                    </p>
                </div>
                <Switch
                    id="generate-first-admin-code"
                    checked={form.generateFirstAdminCode}
                    onCheckedChange={handleGenerateToggle}
                    disabled={isPending}
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isPending}
            >
                {isPending ? "생성 중..." : "크루 생성"}
            </Button>
        </form>
    );
});

export default NewCrewForm;
