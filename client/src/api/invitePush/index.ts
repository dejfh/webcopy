import * as webPush from "web-push";
import { InvitePushData, InvitePushKeys, invitePushKeysSchema } from "./schema";

export async function getInvitePushData(): Promise<InvitePushData> {
  const keys = getOrCreateKeys();

  return {
    pushSubscription: await getSubscription(keys.publicKey),
    keys,
  };
}

export async function invite(
  invitePushData: InvitePushData,
  token: string
): Promise<void> {
  const payload = JSON.stringify({
    type: "invitation",
    token: token,
  });
  await webPush.sendNotification(
    invitePushData.pushSubscription as webPush.PushSubscription,
    payload,
    {
      vapidDetails: {
        subject: "http://webcopy",
        publicKey: invitePushData.keys.publicKey,
        privateKey: invitePushData.keys.privateKey,
      },
    }
  );
}

const invitePushKeysStorageKey = "invitePushKeys";

function getOrCreateKeys(): InvitePushKeys {
  return getKeys() || createKeys();
}

function getKeys(): InvitePushKeys | null {
  const raw = localStorage.getItem(invitePushKeysStorageKey);
  if (!raw) {
    return null;
  }
  try {
    return invitePushKeysSchema.parse(JSON.parse(raw));
  } catch (err) {
    console.warn("Failed to restore invite push keys.");
    return null;
  }
}

function createKeys(): InvitePushKeys {
  const keys = webPush.generateVAPIDKeys();
  localStorage.setItem(invitePushKeysStorageKey, JSON.stringify(keys));
  return keys;
}

async function getSubscription(
  publicKey: string
): Promise<PushSubscriptionJSON> {
  const registration = await navigator.serviceWorker.ready;

  const permissionState = await registration.pushManager.permissionState({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
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
      applicationServerKey: publicKey,
    });
    return subscription.toJSON();
  }
}
