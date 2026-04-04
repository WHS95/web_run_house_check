"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { AdminLabeledInput } from "@/app/admin2/components/ui";
import FadeIn from "@/components/atoms/FadeIn";

type NoticeType = "공지" | "일반" | "중요";

const categoryOptions: { value: NoticeType; label: string }[] = [
    { value: "공지", label: "공지" },
    { value: "일반", label: "일반" },
    { value: "중요", label: "중요" },
];

const NoticeWriteForm = memo(function NoticeWriteForm() {
    const router = useRouter();
    const [type, setType] = useState<NoticeType>("공지");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = useCallback(() => {
        if (!title.trim()) return;
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
        const notice = {
            id: String(Date.now()),
            type,
            title: title.trim(),
            description: description.trim(),
            date: dateStr,
        };
        sessionStorage.setItem(
            "admin_new_notice",
            JSON.stringify(notice),
        );
        router.push("/admin2/notice");
    }, [type, title, description, router]);

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
                                setDescription(e.target.value)
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
                        disabled={!title.trim()}
                    >
                        공지사항 등록
                    </button>
                </div>
            </div>
        </FadeIn>
    );
});

export default NoticeWriteForm;
