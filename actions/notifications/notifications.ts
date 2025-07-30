"use server";
import admin, { dbdoc } from "@/lib/firebase/firebase-server";
import { getMessaging } from "firebase-admin/messaging";
import { FieldValue } from "firebase-admin/firestore";
import { isUserAuthenticated } from "@/lib/user.server";
import { ERROR_CODES } from "@/lib/responses/errors";
import { Notification, NotificationStatus, NotificationType, VALID_NOTIFICATION_TYPES } from "@/app/types/NotificationTypes";

export const subscribeFcmTopicAction = async (token: string, fcmToken: string) => {
  try {
    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;
    if (!fcmToken) throw "FCM is required";

    const messaging = getMessaging();
    await messaging.subscribeToTopic(
      fcmToken,
      "general"
    );

    await messaging.subscribeToTopic(fcmToken, uid);

    return { success: true, data: "suscribed successfully" };
  } catch (error) {
    console.log("Error subscribing to topic", error);
    return { success: false, error: error };
  }
};

export async function createNotificationAction(
  data: {
  userUid?: string;
  topic?: string;
  status?: NotificationStatus;
  type: NotificationType;
  title: string;
  body: string;
  image: string;
  path?: string;
},
token?: string) {
  try {
    const { userUid, title, body, image, path, status, type = "system" } = data;

    if (!VALID_NOTIFICATION_TYPES.includes(type)) {
      return {
        success: false,
        error: `Invalid notification type: ${type}`,
        data: null,
      };
    }

    const { data: result } = await isUserAuthenticated(token);
    if (!result) throw ERROR_CODES.UNAUTHORIZED;

    const topic = data.topic || userUid;

    if (!topic) {
      return {
        success: false,
        error: "No topic or uid provided",
        data: null,
      };
    }

    const notification = {
      topic,
      type,
      status: status ?? "unread",
      title,
      body,
      image,
      path: path ?? "/select-role",
      createTime: FieldValue.serverTimestamp(),
    };

    const notificationRef = await dbdoc
      .collection("notifications")
      .add(notification);

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      android: {
        priority: "high",
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          click_action: path || "/",
        },
      },
      data: {
        notificationId: notificationRef.id,
        type,
      },
      topic,
    };

    const response = await admin.messaging().send(message);
    return { success: true, data: response };
  } catch (error: unknown) {
    return { success: false, error, data: null };
  }
}

export async function getAllNotificationsAction(token: string) {
  const { data, uid } = await isUserAuthenticated(token);
  if (!data) throw ERROR_CODES.UNAUTHORIZED;

  const generalSnapshot = await dbdoc
    .collection("notifications")
    .where("topic", "==", "general")
    .get();

  const userSnapshot = await dbdoc
    .collection("notifications")
    .where("topic", "==", uid)
    .get();

  const allDocs = [...userSnapshot.docs, ...generalSnapshot.docs];

  const notifications: Notification[] = allDocs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      status: data.status,
      createTime: data.createTime?.toDate().toISOString() ?? null,
      body: data.body,
      image: data.image,
      title: data.title,
      type: data.type,
      topic: data.topic,
      path: data.path,
    };
  });

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return { notifications, unreadCount };
}

export async function getNotificationByIdAction(id: string) {
  const doc = await dbdoc.collection("notifications").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function deleteNotificationAction(id: string) {
  await dbdoc.collection("notifications").doc(id).delete();
}

export async function updateNotificationStatusAction(
  id: string,
  status: "read" | "unread" | "actioned" | "deleted"
) {
  await dbdoc.collection("notifications").doc(id).update({ status });
}
