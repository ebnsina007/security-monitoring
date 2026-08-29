"use client";

export interface OfflinePatrolScan {
  id: string;
  patrolId: number;
  locationName: string;
  userLat: number;
  userLng: number;
  hmacPayload: string;
  scannedAt: string;
}

const DB_NAME = "avicenna_security_offline_db";
const STORE_NAME = "pending_qr_scans";

export async function saveOfflineScan(scan: OfflinePatrolScan): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(scan);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineScans(): Promise<OfflinePatrolScan[]> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return [];

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        db.close();
        resolve(getAllRequest.result || []);
      };
      getAllRequest.onerror = () => resolve([]);
    };

    request.onerror = () => resolve([]);
  });
}

export async function clearOfflineScan(id: string): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    };
  });
}
