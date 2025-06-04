"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptic";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 100,
  disabled = false,
}: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);

  const startY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLElement>(null);

  const handleTouchStart = (e: Event) => {
    const touchEvent = e as TouchEvent;
    if (disabled || isRefreshing) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) return;

    startY.current = touchEvent.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: Event) => {
    const touchEvent = e as TouchEvent;
    if (!isDragging.current || disabled || isRefreshing) return;

    const currentY = touchEvent.touches[0].clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, threshold * 1.5);
      setPullDistance(distance);

      if (distance >= threshold && !isTriggered) {
        setIsTriggered(true);
        haptic.medium();
      } else if (distance < threshold && isTriggered) {
        setIsTriggered(false);
        haptic.light();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current || disabled) return;

    isDragging.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      haptic.success();

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setIsTriggered(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
      setIsTriggered(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current || document;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, threshold, isTriggered]);

  const refreshIndicatorStyle = {
    transform: `translateY(${Math.max(0, pullDistance - 20)}px)`,
    opacity: Math.min(pullDistance / threshold, 1),
  };

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isTriggered,
    refreshIndicatorStyle,
  };
};
