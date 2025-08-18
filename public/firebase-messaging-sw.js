importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

console.log("🛠 Service Worker: initializing...");

(async () => {
  try {
    const res = await fetch("/firebase-config.json");
    const firebaseConfig = await res.json();

    firebase.initializeApp(firebaseConfig);

    const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null

    if (!messaging) {
      console.warn("[SW][MSG] ⚠️ Firebase Messaging is not supported");
      return;
    }

    messaging.onBackgroundMessage(async (payload) => {

      if (!payload?.notification) {
        console.warn("[SW][MSG] ⚠️ payload.notification not found");
        return;
      }

      try {
        const dbOpenRequest = indexedDB.open("notifications-db", 5);

        dbOpenRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("counters")) {
            db.createObjectStore("counters", { keyPath: "id" });
          }
        };

        dbOpenRequest.onsuccess = async () => {
          const db = dbOpenRequest.result;

          let currentCount = 0;
          try {
            const tx = db.transaction("counters", "readonly");
            const store = tx.objectStore("counters");
            const getRequest = store.get("unread");

            getRequest.onsuccess = () => {
              currentCount = getRequest.result?.count || 0;

              const txWrite = db.transaction("counters", "readwrite");
              const writeStore = txWrite.objectStore("counters");
              const putRequest = writeStore.put({ id: "unread", count: currentCount + 1 });

              putRequest.onsuccess = () => {
                console.log("[SW][DB] ✅ Unread count updated to:", currentCount + 1);
              };

              putRequest.onerror = () => {
                console.error("[SW][DB] ❌ Failed to write unread count:", putRequest.error);
              };
            };

            getRequest.onerror = () => {
              console.error("[SW][DB] ❌ Failed to read unread count:", getRequest.error);
            };
          } catch (innerErr) {
            console.error("[SW][DB] ❌ IndexedDB error during read/write:", innerErr);
          }
        };

        dbOpenRequest.onerror = () => {
          console.error("[SW][DB] ❌ Failed to open DB:", dbOpenRequest.error);
        };
      } catch (err) {
        console.error("[SW][MSG] ❌ Error interacting with IndexedDB:", err);
      }

      const { title, body, icon } = payload.notification;
      const notificationTitle = title || "📬 Notification";
      const notificationOptions = {
        body: body || "New message",
        icon: icon || "/icon.png",
        data: {
          url: payload.fcmOptions?.link || "/"
        }
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });


    self.addEventListener("notificationclick", (event) => {
      event.notification.close();

      const urlToOpen = event.notification?.data?.url || "/";
      event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
          for (const client of windowClients) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          return clients.openWindow(urlToOpen);
        })
      );
    });

  } catch (error) {
    console.error("[SW] ❌ Fatal error initializing Firebase messaging:", error);
  }
})();
