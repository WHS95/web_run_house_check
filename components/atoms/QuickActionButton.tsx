import React from "react";
import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
    icon: Icon,
    label,
    onClick,
}) => (
    <button
        onClick={onClick}
        className="flex flex-1 flex-col items-center justify-center gap-2 rounded-rh-lg bg-rh-bg-surface p-4 h-[100px] active:scale-95 transition-transform"
    >
        <Icon className="h-7 w-7 text-rh-accent" />
        <span className="text-[13px] font-medium text-white">
            {label}
        </span>
    </button>
);

export default QuickActionButton;
