"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

const listVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.15, ease: "easeOut" },
    },
};

interface AnimatedListProps {
    children: ReactNode;
    className?: string;
}

export function AnimatedList({
    children,
    className,
}: AnimatedListProps) {
    return (
        <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface AnimatedItemProps {
    children: ReactNode;
    className?: string;
}

export function AnimatedItem({
    children,
    className,
}: AnimatedItemProps) {
    return (
        <motion.div variants={itemVariants} className={className}>
            {children}
        </motion.div>
    );
}
