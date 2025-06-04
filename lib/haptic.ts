// 햅틱 피드백 유틸리티
export const haptic = {
  // 가벼운 터치 피드백 (버튼 클릭 등)
  light: () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  },

  // 중간 강도 피드백 (선택, 토글 등)
  medium: () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(25);
    }
  },

  // 강한 피드백 (완료, 오류 등)
  heavy: () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  },

  // 성공 패턴
  success: () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },

  // 오류 패턴
  error: () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  },
};

// 터치 애니메이션과 햅틱을 결합한 함수
export const handleNativeTouch = (
  element: HTMLElement,
  feedback: "light" | "medium" | "heavy" = "light"
) => {
  // 햅틱 피드백
  haptic[feedback]();

  // 터치 애니메이션
  element.style.transform = "scale(0.98)";
  element.style.transition = "transform 0.1s ease";

  setTimeout(() => {
    element.style.transform = "scale(1)";
  }, 100);
};
