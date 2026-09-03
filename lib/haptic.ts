import { Capacitor } from "@capacitor/core";
import {
    Haptics,
    ImpactStyle,
    NotificationType,
} from "@capacitor/haptics";

/**
 * 햅틱 피드백 유틸리티.
 *
 * ⚠️ **`navigator.vibrate`는 iOS Safari에서 동작하지 않는다.**
 * Safari는 어떤 플랫폼에서도 Vibration API를 지원한 적이 없어서, 이전 구현은
 * 아이폰에서 전부 조용한 no-op이었다. 체감 네이티브함의 절반이 촉각인데
 * 그 채널이 통째로 비어 있었다.
 *
 * 그래서 두 경로로 분기한다:
 * - **네이티브 셸(Capacitor)**: iOS `UIImpactFeedbackGenerator` / Android 진동.
 *   진짜 햅틱이 나온다.
 * - **웹(브라우저·PWA)**: Vibration API. Android Chrome에서는 동작하고
 *   iOS Safari에서는 여전히 no-op이다 — 이건 플랫폼 한계라 정직하게 둔다.
 *
 * 호출부는 이 차이를 알 필요가 없다. API 표면은 그대로다.
 */

/** SSR 중에는 아무것도 하지 않는다. */
function 브라우저인가(): boolean {
    return typeof window !== "undefined";
}

/**
 * 네이티브 셸 안에서 실행 중인가.
 * 웹에서도 @capacitor/haptics 는 동작하지만 Vibration API 로 폴백하므로,
 * iOS Safari 에서는 여전히 no-op 이다. 분기해서 의도를 명확히 한다.
 */
function 네이티브인가(): boolean {
    return 브라우저인가() && Capacitor.isNativePlatform();
}

/** 햅틱은 실패해도 UI를 막지 않는다. */
function 조용히실행(작업: () => Promise<unknown>): void {
    try {
        void 작업().catch(() => {
            /* 햅틱 미지원 기기 — 무시 */
        });
    } catch {
        /* 플러그인 미등록 — 무시 */
    }
}

function 웹진동(pattern: number | number[]): void {
    if (브라우저인가() && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

export const haptic = {
    /** 가벼운 터치 피드백 (버튼 클릭 등) */
    light: () => {
        if (네이티브인가()) {
            조용히실행(() => Haptics.impact({ style: ImpactStyle.Light }));
            return;
        }
        웹진동(10);
    },

    /** 중간 강도 피드백 (선택, 토글 등) */
    medium: () => {
        if (네이티브인가()) {
            조용히실행(() => Haptics.impact({ style: ImpactStyle.Medium }));
            return;
        }
        웹진동(25);
    },

    /** 강한 피드백 (완료 등) */
    heavy: () => {
        if (네이티브인가()) {
            조용히실행(() => Haptics.impact({ style: ImpactStyle.Heavy }));
            return;
        }
        웹진동(50);
    },

    /** 성공 — iOS의 success notification 햅틱 */
    success: () => {
        if (네이티브인가()) {
            조용히실행(() =>
                Haptics.notification({ type: NotificationType.Success })
            );
            return;
        }
        웹진동([50, 50, 50]);
    },

    /** 오류 — iOS의 error notification 햅틱 */
    error: () => {
        if (네이티브인가()) {
            조용히실행(() =>
                Haptics.notification({ type: NotificationType.Error })
            );
            return;
        }
        웹진동([100, 50, 100, 50, 100]);
    },

    /** 경고 — iOS의 warning notification 햅틱 */
    warning: () => {
        if (네이티브인가()) {
            조용히실행(() =>
                Haptics.notification({ type: NotificationType.Warning })
            );
            return;
        }
        웹진동([80, 40, 80]);
    },

    /**
     * 드래그가 스냅 지점에 걸릴 때의 미세 피드백.
     * 제스처 중 반복 호출되므로 가장 가벼운 것만 쓴다.
     */
    selection: () => {
        if (네이티브인가()) {
            조용히실행(() => Haptics.selectionChanged());
            return;
        }
        웹진동(5);
    },
};

/** 터치 애니메이션과 햅틱을 결합한 함수 */
export const handleNativeTouch = (
    element: HTMLElement,
    feedback: "light" | "medium" | "heavy" = "light"
) => {
    haptic[feedback]();

    element.style.transform = "scale(0.98)";
    element.style.transition = "transform 0.1s ease";

    setTimeout(() => {
        element.style.transform = "scale(1)";
    }, 100);
};
