"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { AdminLabeledInput } from "@/app/admin2/components/ui";
import AdminModal from "@/app/admin2/components/ui/AdminModal";
import FadeIn from "@/components/atoms/FadeIn";

type NoticeType = "공지" | "일반" | "중요";

const categoryOptions: {
    value: NoticeType;
    label: string;
}[] = [
    { value: "공지", label: "공지" },
    { value: "일반", label: "일반" },
    { value: "중요", label: "중요" },
];

interface Props {
    crewId: string;
}

const NoticeWriteForm = memo(function NoticeWriteForm({
    crewId,
}: Props) {
    const router = useRouter();
    const [type, setType] = useState<NoticeType>("공지");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    // 등록 성공 후 생성된 공지 ID (푸시 발송 대상)
    const [createdNoticeId, setCreatedNoticeId] =
        useState<string | null>(null);
    const [pushing, setPushing] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!title.trim() || !description.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(
                "/api/admin/notices",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        crewId,
                        title: title.trim(),
                        type,
                        content: description.trim(),
                    }),
                },
            );
            const json = await res.json();
            if (!json?.success || !json.data?.id) {
                alert(
                    json?.message ??
                        "공지 등록에 실패했습니다.",
                );
                return;
            }
            setCreatedNoticeId(json.data.id);
        } catch (e) {
            console.error(
                "[notice write] submit failed:",
                e,
            );
            alert("공지 등록에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    }, [crewId, title, type, description]);

    // 모달 "확인" → 푸시 발송 후 목록으로 이동
    const handleConfirmPush = useCallback(async () => {
        if (!createdNoticeId || pushing) return;
        setPushing(true);
        try {
            const res = await fetch(
                `/api/admin/notices/${createdNoticeId}/push`,
                { method: "POST" },
            );
            const json = await res.json();
            if (!json?.success) {
                alert(
                    json?.message ??
                        "푸시 발송에 실패했습니다. 공지는 등록되었습니다.",
                );
            }
        } catch (e) {
            console.error(
                "[notice write] push failed:",
                e,
            );
            alert(
                "푸시 발송에 실패했습니다. 공지는 등록되었습니다.",
            );
        } finally {
            setPushing(false);
            setCreatedNoticeId(null);
            router.push("/admin2/notice");
            router.refresh();
        }
    }, [createdNoticeId, pushing, router]);

    const canSubmit =
        !!title.trim() &&
        !!description.trim() &&
        !submitting;

    return (
        <FadeIn>
            <div className="flex flex-col flex-1">
                <div className="flex-1 px-4 pt-5 space-y-6">
                    {/* 카테고리 */}
                    <div className="space-y-2">
                        <span className="text-[14px] text-white font-medium">
                            카테고리
                        </span>
                        <div className="flex gap-2">
                            {categoryOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                                        type === opt.value
                                            ? "bg-rh-accent text-white"
                                            : "bg-rh-bg-surface text-rh-text-secondary"
                                    }`}
                                    onClick={() =>
                                        setType(opt.value)
                                    }
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 제목 */}
                    <AdminLabeledInput
                        label="제목"
                        value={title}
                        onChange={setTitle}
                        placeholder="공지사항 제목을 입력하세요"
                    />

                    {/* 내용 */}
                    <div className="space-y-2">
                        <span className="text-[14px] text-white font-medium">
                            내용
                        </span>
                        <textarea
                            className="w-full min-h-[200px] px-4 py-3 rounded-lg bg-rh-bg-surface border border-rh-border text-white text-[14px] placeholder:text-rh-text-tertiary focus:outline-none focus:border-rh-accent resize-none"
                            placeholder="공지사항 내용을 입력하세요"
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value,
                                )
                            }
                        />
                    </div>
                </div>

                {/* 등록 버튼 */}
                <div className="shrink-0 px-4 py-4">
                    <button
                        type="button"
                        className="w-full py-4 rounded-xl bg-rh-accent text-white text-[15px] font-medium disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {submitting
                            ? "등록 중..."
                            : "공지사항 등록"}
                    </button>
                </div>
            </div>

            {/* 등록 완료 + 푸시 발송 확인 모달 */}
            <AdminModal
                open={!!createdNoticeId}
                onClose={() => {
                    // 모달 닫기 = 푸시 발송 없이 목록으로 이동
                    if (pushing) return;
                    setCreatedNoticeId(null);
                    router.push("/admin2/notice");
                    router.refresh();
                }}
                title="공지 등록 완료"
                footer={
                    <button
                        type="button"
                        className="w-full py-3 rounded-xl bg-rh-accent text-white text-sm font-semibold disabled:opacity-50"
                        onClick={handleConfirmPush}
                        disabled={pushing}
                    >
                        {pushing
                            ? "푸시 발송 중..."
                            : "확인 (푸시 발송)"}
                    </button>
                }
            >
                <p className="text-[14px] text-rh-text-secondary leading-relaxed">
                    공지가 정상적으로 등록되었습니다.
                    <br />
                    확인 버튼을 누르면 크루원 전체에게
                    푸시 알림이 발송됩니다.
                </p>
            </AdminModal>
        </FadeIn>
    );
});

export default NoticeWriteForm;
