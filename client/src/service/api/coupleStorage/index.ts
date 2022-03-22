import { CoupleStorage, coupleStorageSchema } from "./Schema";

const coupleStorageKey = "coupleStorage";

export function store(name: string, data: PushSubscriptionJSON): void {
  const raw = localStorage.getItem(coupleStorageKey);
  const coupleStorage = raw ? coupleStorageSchema.parse(JSON.parse(raw)) : [];
  coupleStorage.push({ name, data });
  localStorage.setItem(coupleStorageKey, JSON.stringify(coupleStorage));
}

export function read(): CoupleStorage {
  const raw = localStorage.getItem(coupleStorageKey);
  return raw ? coupleStorageSchema.parse(JSON.parse(raw)) : [];
}
