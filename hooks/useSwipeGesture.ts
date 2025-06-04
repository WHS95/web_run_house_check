"use client";

import { useEffect, useRef } from "react";
import { haptic } from "@/lib/haptic";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  hapticFeedback?: boolean;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  hapticFeedback = true,
}: SwipeGestureOptions) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // 대각선 스와이프 방지를 위한 각도 체크
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (Math.max(absDeltaX, absDeltaY) < threshold) {
        return;
      }

      // 수평 스와이프가 더 큰 경우
      if (absDeltaX > absDeltaY) {
        if (deltaX > 0) {
          // 오른쪽 스와이프
          if (hapticFeedback) haptic.light();
          onSwipeRight?.();
        } else {
          // 왼쪽 스와이프
          if (hapticFeedback) haptic.light();
          onSwipeLeft?.();
        }
      } else {
        // 수직 스와이프가 더 큰 경우
        if (deltaY > 0) {
          // 아래쪽 스와이프
          if (hapticFeedback) haptic.light();
          onSwipeDown?.();
        } else {
          // 위쪽 스와이프
          if (hapticFeedback) haptic.light();
          onSwipeUp?.();
        }
      }

      touchStartRef.current = null;
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchCancel, {
      passive: true,
    });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    hapticFeedback,
  ]);

  return elementRef;
};
