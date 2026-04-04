import { memo } from "react";

type BadgeVariant = "accent" | "outline" | "muted";

interface AdminBadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
    accent: "bg-rh-accent text-white",
    outline: "border border-rh-accent text-rh-accent",
    muted: "bg-rh-bg-muted text-rh-text-secondary",
};

const AdminBadge = memo(function AdminBadge({
    children,
    variant = "accent",
}: AdminBadgeProps) {
    return (
        <span
            className={`inline-flex items-center justify-center h-[22px] px-2 rounded-full text-[10px] font-semibold ${variantStyles[variant]}`}
        >
            {children}
        </span>
    );
});

export default AdminBadge;
