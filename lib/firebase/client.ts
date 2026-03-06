import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messagingInstance: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
    if (typeof window === "undefined") return null;
    if (!("Notification" in window)) return null;
    if (!messagingInstance) {
        messagingInstance = getMessaging(app);
    }
    return messagingInstance;
}

export async function getFCMToken(): Promise<string | null> {
    try {
        const messaging = getFirebaseMessaging();
        if (!messaging) return null;

        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration:
                await navigator.serviceWorker.getRegistration(
                    "/firebase-messaging-sw.js"
                ),
        });

        return token || null;
    } catch {
        return null;
    }
}

export function onForegroundMessage(
    callback: (payload: unknown) => void
) {
    const messaging = getFirebaseMessaging();
    if (!messaging) return () => {};
    return onMessage(messaging, callback);
}
