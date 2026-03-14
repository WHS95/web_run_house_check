importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// TODO: Firebase 콘솔에서 발급받은 값으로 교체
firebase.initializeApp({
    apiKey: "PLACEHOLDER",
    authDomain: "PLACEHOLDER",
    projectId: "PLACEHOLDER",
    messagingSenderId: "PLACEHOLDER",
    appId: "PLACEHOLDER",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "런하우스";
    const options = {
        body: payload.notification?.body || "새로운 알림이 있습니다.",
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        vibrate: [100, 50, 100],
        data: payload.data,
        actions: [
            { action: "open", title: "확인하기" },
            { action: "close", title: "닫기" },
        ],
    };

    self.registration.showNotification(title, options);
});

// 알림 클릭
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    if (event.action !== "close") {
        event.waitUntil(clients.openWindow("/"));
    }
});
