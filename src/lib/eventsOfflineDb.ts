// src/lib/eventsOfflineDb.ts
// Minimal IndexedDB wrapper for the Faculty Events PWA's offline needs:
// - draft report edits made while offline (object store: drafts)
// - queued evidence uploads awaiting a server round-trip (object store: uploads)
// No new dependency — wraps the native IndexedDB API directly, since the
// amount of code a library like idb would save isn't worth adding a new
// package for two small object stores.
const DB_NAME = 'campus-events-offline';
const DB_VERSION = 1;
const DRAFTS_STORE = 'drafts';
const UPLOADS_STORE = 'uploads';

export interface OfflineDraft {
  bookingId: string;
  fields: Record<string, unknown>;
  savedAt: string; // ISO timestamp — shown to the user as "saved locally at…"
}

export interface QueuedUpload {
  id: string; // local id, also used to prevent duplicate submission
  bookingId: string;
  category: string;
  fileName: string;
  fileType: string;
  fileData: Blob;
  geo?: { latitude?: number; longitude?: number; gpsAccuracyMeters?: number; capturedAt?: string };
  queuedAt: string;
  status: 'queued' | 'uploading' | 'failed';
  attempts: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) db.createObjectStore(DRAFTS_STORE, { keyPath: 'bookingId' });
      if (!db.objectStoreNames.contains(UPLOADS_STORE)) db.createObjectStore(UPLOADS_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

// Every call is wrapped so a storage failure (quota, private-browsing
// restrictions, etc.) degrades to a no-op/empty-result instead of crashing
// the report form — per the spec's "handle storage failures... safely".
async function safe<T>(fn: (db: IDBDatabase) => Promise<T>, fallback: T): Promise<T> {
  try {
    const db = await openDb();
    return await fn(db);
  } catch (e) {
    console.warn('[eventsOfflineDb] storage unavailable, degrading gracefully:', e);
    return fallback;
  }
}

export const offlineDrafts = {
  save: (draft: OfflineDraft) => safe((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readwrite');
    tx.objectStore(DRAFTS_STORE).put(draft);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }), undefined),

  get: (bookingId: string) => safe((db) => new Promise<OfflineDraft | null>((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readonly');
    const req = tx.objectStore(DRAFTS_STORE).get(bookingId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }), null),

  clear: (bookingId: string) => safe((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, 'readwrite');
    tx.objectStore(DRAFTS_STORE).delete(bookingId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }), undefined),
};

export const offlineUploads = {
  enqueue: (item: QueuedUpload) => safe((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(UPLOADS_STORE, 'readwrite');
    tx.objectStore(UPLOADS_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }), undefined),

  update: (item: QueuedUpload) => offlineUploads.enqueue(item), // put() upserts

  remove: (id: string) => safe((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(UPLOADS_STORE, 'readwrite');
    tx.objectStore(UPLOADS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }), undefined),

  listForBooking: (bookingId: string) => safe((db) => new Promise<QueuedUpload[]>((resolve, reject) => {
    const tx = db.transaction(UPLOADS_STORE, 'readonly');
    const req = tx.objectStore(UPLOADS_STORE).getAll();
    req.onsuccess = () => resolve((req.result || []).filter((u: QueuedUpload) => u.bookingId === bookingId));
    req.onerror = () => reject(req.error);
  }), []),

  listAll: () => safe((db) => new Promise<QueuedUpload[]>((resolve, reject) => {
    const tx = db.transaction(UPLOADS_STORE, 'readonly');
    const req = tx.objectStore(UPLOADS_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }), []),
};
