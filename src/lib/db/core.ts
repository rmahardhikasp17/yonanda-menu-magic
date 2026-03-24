/**
 * IndexedDB Core Module
 * Database initialization, connection management, and generic CRUD helpers.
 */

const DB_NAME = 'hotel_yonanda_db';
const DB_VERSION = 3; // v3: Added audit_log and owner_config stores

// Object Store Names
export const STORES = {
  GUESTS: 'guests',
  ROOMS: 'rooms',
  MENUS: 'menus',
  ORDERS_TEMP: 'orders_temp',
  AUDIT_LOG: 'audit_log',
  OWNER_CONFIG: 'owner_config',
} as const;

// ============================================
// Database Instance
// ============================================

let dbInstance: IDBDatabase | null = null;

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Initialize IndexedDB database
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Create guests store
      if (!db.objectStoreNames.contains(STORES.GUESTS)) {
        const guestStore = db.createObjectStore(STORES.GUESTS, { keyPath: 'id' });
        guestStore.createIndex('is_active', 'is_active', { unique: false });
        guestStore.createIndex('ktp_number', 'ktp_number', { unique: false });
      }

      // Create rooms store
      if (!db.objectStoreNames.contains(STORES.ROOMS)) {
        const roomStore = db.createObjectStore(STORES.ROOMS, { keyPath: 'room_number' });
        roomStore.createIndex('status', 'status', { unique: false });
        roomStore.createIndex('guest_id', 'guest_id', { unique: false });
      }

      // Create menus store
      if (!db.objectStoreNames.contains(STORES.MENUS)) {
        const menuStore = db.createObjectStore(STORES.MENUS, { keyPath: 'id' });
        menuStore.createIndex('category', 'category', { unique: false });
        menuStore.createIndex('is_active', 'is_active', { unique: false });
      }

      // Create orders_temp store
      if (!db.objectStoreNames.contains(STORES.ORDERS_TEMP)) {
        const orderStore = db.createObjectStore(STORES.ORDERS_TEMP, { keyPath: 'id' });
        orderStore.createIndex('room_number', 'room_number', { unique: false });
        orderStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // v3: Create audit_log store
      if (!db.objectStoreNames.contains(STORES.AUDIT_LOG)) {
        const auditStore = db.createObjectStore(STORES.AUDIT_LOG, { keyPath: 'id' });
        auditStore.createIndex('action', 'action', { unique: false });
        auditStore.createIndex('counterType', 'counterType', { unique: false });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // v3: Create owner_config store
      if (!db.objectStoreNames.contains(STORES.OWNER_CONFIG)) {
        db.createObjectStore(STORES.OWNER_CONFIG, { keyPath: 'key' });
      }

      // Migration from v1 to v2: Add active_rooms field to existing guests
      if (oldVersion < 2) {
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const guestStore = transaction.objectStore(STORES.GUESTS);
          const cursorRequest = guestStore.openCursor();
          cursorRequest.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const guest = cursor.value;
              if (!guest.active_rooms) {
                guest.active_rooms = [];
              }
              cursor.update(guest);
              cursor.continue();
            }
          };
        }
      }
    };
  });
}

/**
 * Get database instance (auto-init if needed)
 * Exported for use by other modules
 */
export async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

// ============================================
// Generic CRUD Helpers (exported for domain modules)
// ============================================

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`));
  });
}

export async function getById<T>(storeName: string, id: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Failed to get from ${storeName}`));
  });
}

export async function put<T>(storeName: string, data: T): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(data);
    request.onerror = () => reject(new Error(`Failed to put to ${storeName}`));
  });
}

export async function deleteById(storeName: string, id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
  });
}

/**
 * Reset entire database (development only)
 */
export async function resetDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }

    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete database'));
  });
}
