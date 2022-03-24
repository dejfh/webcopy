import { InvitePushData } from "../invitePush/schema";
import { CoupleStorage, coupleStorageSchema } from "./schema";

const coupleStorageKey = "coupleStorage";

export function read(): CoupleStorage {
  const raw = localStorage.getItem(coupleStorageKey);
  if (!raw) {
    return [];
  }
  try {
    return raw ? coupleStorageSchema.parse(JSON.parse(raw)) : [];
  } catch (err) {
    console.warn("Failed to restore couple storage.", err);
    return [];
  }
}

export function store(name: string, data: InvitePushData): void {
  const coupleStorage = read();
  coupleStorage.push({ name, data });
  localStorage.setItem(coupleStorageKey, JSON.stringify(coupleStorage));
}
