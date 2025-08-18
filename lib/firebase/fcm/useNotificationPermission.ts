"use client";
import { useEffect, useState } from "react";

const useNotificationPermissionStatus = () => {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      setPermission("denied");
      return;
    }

    const handlePermissionChange = () => setPermission(Notification.permission);

    if (Notification.permission === "granted") {
      setPermission("granted");
      // Optionally, you can show a notification here if needed
      // new Notification("Hi there!");
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        setPermission(permission);
        if (permission === "granted") {
          // Optionally, you can show a notification here if needed
          // new Notification("Hi there!");
        }
      });
    } else {
      setPermission(Notification.permission);
    }

    if ("permissions" in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((notificationPerm) => {
          notificationPerm.onchange = handlePermissionChange;
        });
    }
  }, []);

  return permission;
};

export default useNotificationPermissionStatus;
