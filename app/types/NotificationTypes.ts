export type NotificationStatus = "unread" | "read" | "actioned" | "deleted";

export type NotificationType =
  | "offer"
  | "payment"
  | "gigUpdate"
  | "gigAssignment"
  | "gigDelegation"
  | "gigAmendment"
  | "badge"
  | "referral"
  | "actionRequired"
  | "system";

export const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  "offer",
  "payment",
  "gigUpdate",
  "gigAssignment",
  "gigDelegation",
  "gigAmendment",
  "badge",
  "referral",
  "actionRequired",
  "system",
];

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  body: string;
  image: string;
  path?: string;
  topic: string;
  createTime: string;
}
