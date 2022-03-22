self.skipWaiting();

self.addEventListener("push", function (event) {
  var eventData = event.data.json();
  var token = eventData.token;
  if (eventData.type !== "invitation" || !token) {
    return;
  }
  event.waitUntil(
    self.registration.showNotification("Invitation to webcopy session", {
      data: {
        type: "invitation",
        token: token,
      },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  if (event.notification.data.type === "invitation") {
    var token = event.notification.data.token;
    var url = new URL(self.location.href);
    url.search = "";
    url.pathname = "";
    url.hash = "#join=" + encodeURIComponent(token);
    clients.openWindow(url.href);
  }
  event.notification.close();
});
