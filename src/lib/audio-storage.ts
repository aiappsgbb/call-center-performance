/**
 * IndexedDB wrapper for storing audio files
 * This avoids localStorage quota issues with large audio data URLs
 */

const DB_NAME = 'CallCenterAudioDB';
const STORE_NAME = 'audioFiles';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Generate storage key with schema context
 * Format: {schemaId}/{callId} or just {callId} for backward compatibility
 */
function getStorageKey(callId: string, schemaId?: string): string {
  return schemaId ? `${schemaId}/${callId}` : callId;
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

/**
 * Store audio file in IndexedDB
 * @param callId - Unique call identifier
 * @param file - Audio file blob
 * @param schemaId - Optional schema ID for organization
 */
export async function storeAudioFile(callId: string, file: File | Blob, schemaId?: string): Promise<void> {
  const db = await openDB();
  const storageKey = getStorageKey(callId, schemaId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, storageKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve audio file from IndexedDB
 * @param callId - Unique call identifier
 * @param schemaId - Optional schema ID for organization
 */
export async function getAudioFile(callId: string, schemaId?: string): Promise<Blob | null> {
  const db = await openDB();
  const storageKey = getStorageKey(callId, schemaId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(storageKey);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete audio file from IndexedDB
 * @param callId - Unique call identifier
 * @param schemaId - Optional schema ID for organization
 */
export async function deleteAudioFile(callId: string, schemaId?: string): Promise<void> {
  const db = await openDB();
  const storageKey = getStorageKey(callId, schemaId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(storageKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all audio files from IndexedDB
 */
export async function clearAllAudioFiles(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store audio files for multiple calls
 * @param calls - Array of calls with audio files
 * @param schemaId - Optional schema ID for organization
 */
export async function storeAudioFiles(calls: Array<{ id: string; audioFile?: File | Blob; schemaId?: string }>): Promise<void> {
  const promises = calls
    .filter(call => call.audioFile)
    .map(call => storeAudioFile(call.id, call.audioFile!, call.schemaId));
  
  await Promise.all(promises);
}

/**
 * Restore audio files for multiple calls
 * @param calls - Array of calls with optional schemaId
 */
export async function restoreAudioFiles(calls: Array<{ id: string; schemaId?: string }>): Promise<Map<string, Blob>> {
  const promises = calls.map(async (call) => {
    const blob = await getAudioFile(call.id, call.schemaId);
    return { id: call.id, blob };
  });

  const results = await Promise.all(promises);
  const map = new Map<string, Blob>();
  
  results.forEach(({ id, blob }) => {
    if (blob) map.set(id, blob);
  });

  return map;
}
