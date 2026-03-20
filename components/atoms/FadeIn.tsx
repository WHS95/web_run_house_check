"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
    children: ReactNode;
    duration?: number;
    delay?: number;
    className?: string;
}

export default function FadeIn({
    children,
    duration = 0.2,
    delay = 0,
    className,
}: FadeInProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
