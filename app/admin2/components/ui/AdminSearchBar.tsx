"use client";
import { memo } from "react";
import { Search } from "lucide-react";

interface AdminSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const AdminSearchBar = memo(function AdminSearchBar({
    value,
    onChange,
    placeholder = "검색어를 입력하세요",
}: AdminSearchBarProps) {
    return (
        <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-lg bg-rh-bg-surface">
            <Search size={18} className="text-rh-text-muted shrink-0" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-rh-text-muted outline-none"
            />
        </div>
    );
});

export default AdminSearchBar;
