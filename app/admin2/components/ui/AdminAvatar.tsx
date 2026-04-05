"use client";
import { memo } from "react";

interface AdminAvatarProps {
    name: string;
    size?: number;
}

const AdminAvatar = memo(function AdminAvatar({
    name,
    size = 36,
}: AdminAvatarProps) {
    const initial = name?.trim().charAt(0) || "?";
    const fontSize = Math.round(size * 0.44);

    return (
        <div
            className="flex items-center justify-center rounded-full bg-rh-bg-muted text-white font-semibold shrink-0"
            style={{
                width: size,
                height: size,
                fontSize,
            }}
        >
            {initial}
        </div>
    );
});

export default AdminAvatar;
