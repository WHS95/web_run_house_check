export type NotificationType = "attendance" | "announcement";

export interface NotificationPayload {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, string>;
}
