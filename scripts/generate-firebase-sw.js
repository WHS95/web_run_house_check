/* eslint-disable @typescript-eslint/no-require-imports */
// Firebase 메시징 Service Worker 생성기.
// SW는 process.env에 접근할 수 없으므로 빌드/개발 시점에 .env.local 값을
// 인라인 주입한 sw.js 를 생성한다. predev/prebuild/prestart 에서 호출됨.

const fs = require("fs");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env.local"),
});

const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missing.length > 0) {
    console.warn(
        `[firebase-sw] Firebase 환경변수 누락 (푸시 알림 동작 불가): ${missing.join(
            ", "
        )}`
    );
}

const swContent = `// 자동 생성됨 — scripts/generate-firebase-sw.js 가 빌드/개발 시점에 작성합니다.
// 직접 수정하지 마세요. Firebase 값은 .env.local 에서 주입됩니다.
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config, null, 4)});

const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러 (data-only 메시지 기준)
messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const title = data.title || "런하우스";
    const options = {
        body: data.body || "새로운 알림이 있습니다.",
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        vibrate: [100, 50, 100],
        data,
        actions: [
            { action: "open", title: "확인하기" },
            { action: "close", title: "닫기" },
        ],
    };

    self.registration.showNotification(title, options);
});

// 알림 클릭 → data.url 로 deep-link
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    if (event.action === "close") return;

    const data = event.notification.data || {};
    const targetUrl = data.url || "/";

    event.waitUntil(
        (async () => {
            const allClients = await clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });

            for (const client of allClients) {
                try {
                    const clientUrl = new URL(client.url);
                    const selfUrl = new URL(self.location.origin);
                    if (clientUrl.origin === selfUrl.origin) {
                        await client.focus();
                        if ("navigate" in client) {
                            await client.navigate(targetUrl);
                        }
                        return;
                    }
                } catch {
                    // URL 파싱 실패는 무시
                }
            }

            await clients.openWindow(targetUrl);
        })()
    );
});
`;

const outputPath = path.resolve(
    __dirname,
    "../public/firebase-messaging-sw.js"
);

fs.writeFileSync(outputPath, swContent, "utf-8");
console.log(
    `[firebase-sw] ${path.relative(process.cwd(), outputPath)} 생성 완료`
);
