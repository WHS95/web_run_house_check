"use client";

import { useState, useCallback } from "react";
import AdminLabeledInput from "@/app/admin2/components/ui/AdminLabeledInput";
import type { UserForAdmin } from "@/lib/supabase/admin";

interface UserEditFormProps {
    user: UserForAdmin;
    onSave: (data: {
        first_name: string;
        phone: string;
        birth_year: number;
    }) => Promise<void>;
    onClose: () => void;
}

export default function UserEditForm({
    user,
    onSave,
    onClose,
}: UserEditFormProps) {
    const [name, setName] = useState(
        user.first_name || "",
    );
    const [phone, setPhone] = useState(user.phone || "");
    const [birthYear, setBirthYear] = useState(
        String(
            user.birth_year || new Date().getFullYear() - 30,
        ),
    );
    const [saving, setSaving] = useState(false);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            await onSave({
                first_name: name,
                phone,
                birth_year: parseInt(birthYear),
            });
        } finally {
            setSaving(false);
        }
    }, [name, phone, birthYear, onSave]);

    return (
        <>
            <div className="flex flex-col gap-4">
                <AdminLabeledInput
                    label="이름"
                    value={name}
                    onChange={setName}
                    placeholder="이름을 입력하세요"
                />
                <AdminLabeledInput
                    label="연락처"
                    value={phone}
                    onChange={setPhone}
                    placeholder="010-0000-0000"
                    type="tel"
                />
                <AdminLabeledInput
                    label="출생연도"
                    value={birthYear}
                    onChange={setBirthYear}
                    placeholder="1990"
                    type="number"
                />
                <AdminLabeledInput
                    label="가입일"
                    value={new Date(
                        user.created_at,
                    ).toLocaleDateString("ko-KR")}
                    onChange={() => {}}
                    placeholder=""
                />
            </div>
            <div className="flex gap-2 pt-2">
                <button
                    className="flex-1 py-3 rounded-xl bg-rh-bg-muted text-white text-sm font-medium"
                    onClick={onClose}
                    disabled={saving}
                >
                    취소
                </button>
                <button
                    className="flex-1 py-3 rounded-xl bg-rh-accent text-white text-sm font-medium"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "저장 중..." : "저장"}
                </button>
            </div>
        </>
    );
}
