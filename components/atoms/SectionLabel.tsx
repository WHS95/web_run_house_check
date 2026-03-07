import React from "react";

interface SectionLabelProps {
    children: React.ReactNode;
    className?: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({
    children,
    className = "",
}) => (
    <h3
        className={`text-rh-label font-semibold text-rh-text-tertiary tracking-widest uppercase ${className}`}
    >
        {children}
    </h3>
);

export default SectionLabel;
