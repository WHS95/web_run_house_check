"use client";

import { motion } from "framer-motion";
import { Children, ReactNode, useMemo } from "react";

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
    /**
     * 전체 stagger 합계의 최대 초 단위 한도.
     * 지정 시 staggerChildren = min(0.05, maxStaggerSec / itemCount)
     * 200개 같이 큰 리스트에서 마지막 아이템 등장 시간이 폭주하지 않게 캡.
     */
    maxStaggerSec?: number;
}

export function AnimatedList({
    children,
    className,
    maxStaggerSec,
}: AnimatedListProps) {
    const listVariants = useMemo(() => {
        if (!maxStaggerSec) {
            return {
                hidden: {},
                visible: {
                    transition: { staggerChildren: 0.05 },
                },
            };
        }
        const count = Children.count(children);
        const stagger =
            count > 0
                ? Math.min(0.05, maxStaggerSec / count)
                : 0.05;
        return {
            hidden: {},
            visible: {
                transition: { staggerChildren: stagger },
            },
        };
    }, [children, maxStaggerSec]);

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
