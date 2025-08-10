// 푸시 알림 권한 요청
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    // console.log("이 브라우저는 알림을 지원하지 않습니다.");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// Service Worker 등록 및 푸시 구독
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;

    // VAPID 키는 실제 서비스에서는 환경변수로 관리해야 합니다
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return subscription;
  } catch (error) {
    //console.error("푸시 구독 실패:", error);
    return null;
  }
}

// VAPID 키 변환 함수
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 로컬 알림 표시 (테스트용)
export function showLocalNotification(title: string, body: string): void {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
    });
  }
}

// 푸시 알림 설정 초기화
export async function initializePushNotifications(): Promise<boolean> {
  try {
    const permission = await requestNotificationPermission();

    if (permission === "granted") {
      const subscription = await subscribeToPush();

      if (subscription) {
        // 여기서 구독 정보를 서버에 저장할 수 있습니다
        // console.log("푸시 알림 구독 성공:", subscription);
        return true;
      }
    }

    return false;
  } catch (error) {
    //console.error("푸시 알림 초기화 실패:", error);
    return false;
  }
}
