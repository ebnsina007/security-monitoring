"use client";

/**
 * مدل پایگاه داده محلی اتاق (Room Database) برای نسخه اندروید / PWA اپلیکیشن
 * Entity: ShiftEvent (رویداد شیفت)
 */
export interface ShiftEventEntity {
  id: string;
  timestamp: string;
  timeDisplay: string;
  description: string;
  severity: "NORMAL" | "WARNING" | "CRITICAL";
  officerName: string;
  location: string;
  isSynced: boolean;
  createdAt: number;
}

const ROOM_DB_NAME = "AvicennaSecurityRoomDb";
const ROOM_STORE_NAME = "shift_events";

function openRoomDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported"));
    }

    const req = indexedDB.open(ROOM_DB_NAME, 2);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ROOM_STORE_NAME)) {
        const store = db.createObjectStore(ROOM_STORE_NAME, {
          keyPath: "id",
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("severity", "severity", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * ثبت رویداد جدید در پایگاه داده Room
 */
export async function addShiftEventToRoom(
  description: string,
  severity: "NORMAL" | "WARNING" | "CRITICAL",
  officerName: string = "علی محمدی (پست ۲)",
  location: string = "ورودی اورژانس و تریاژ"
): Promise<ShiftEventEntity> {
  const now = new Date();
  const timeDisplay = now.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const event: ShiftEventEntity = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.toISOString(),
    timeDisplay,
    description,
    severity,
    officerName,
    location,
    isSynced: false,
    createdAt: Date.now(),
  };

  try {
    const db = await openRoomDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ROOM_STORE_NAME, "readwrite");
      const store = tx.objectStore(ROOM_STORE_NAME);
      store.put(event);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Room IndexedDB write fallback:", err);
  }

  return event;
}

/**
 * بازیابی تمام رویدادهای شیفت ذخیره‌شده در پایگاه داده Room
 */
export async function getAllShiftEventsFromRoom(): Promise<ShiftEventEntity[]> {
  try {
    const db = await openRoomDb();
    return await new Promise<ShiftEventEntity[]>((resolve) => {
      const tx = db.transaction(ROOM_STORE_NAME, "readonly");
      const store = tx.objectStore(ROOM_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []) as ShiftEventEntity[];
        list.sort((a, b) => b.createdAt - a.createdAt);
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
