import * as webPush from "web-push";

export async function getPushSubscriptionData(): Promise<PushSubscriptionJSON> {
  const registration = await navigator.serviceWorker.ready;

  const permissionState = await registration.pushManager.permissionState({
    userVisibleOnly: true,
    applicationServerKey: null,
  });

  if (permissionState !== "granted") {
    if ((await Notification.requestPermission()) !== "granted") {
      throw new Error("Permission to send notifications denied.");
    }
  }

  {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      return subscription.toJSON();
    }
  }

  {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: null,
    });
    return subscription.toJSON();
  }
}

export async function invite(
  subscriptionData: PushSubscriptionJSON,
  token: string
): Promise<void> {
  const payload = JSON.stringify({
    type: "invitation",
    token: token,
  });
  await webPush.sendNotification(
    subscriptionData as webPush.PushSubscription,
    payload
  );
}
