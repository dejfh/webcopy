self.skipWaiting();

var notifications = undefined;

// Register event listener for the 'push' event.
self.addEventListener("push", function (event) {
  // Keep the service worker alive until the notification is created.
  var eventData = event.data.json();
  var sessionId = eventData.sessionId;
  if (eventData.type !== "invitation" || !sessionId) {
    return;
  }
  event.waitUntil(
    // Show a notification with title 'ServiceWorker Cookbook' and body 'Alea iacta est'.
    self.registration.showNotification("Invitation to webcopy session", {
      data: {
        type: "invitation",
        sessionId: sessionId,
      },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  if (event.notification.data.type === "invitation") {
    var sessionId = event.notification.data.sessionId;
    clients.openWindow(
      "http://localhost:3000/#join=" + encodeURIComponent(sessionId)
    );
  }
  event.notification.close();
});
