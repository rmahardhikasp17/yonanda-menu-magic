/**
 * IndexedDB Database Service for Hotel Yonanda
 * Production-ready, offline-first storage layer
 * 
 * @description Primary storage for sensitive and operational data.
 * LocalStorage is NOT used for any sensitive data.
 */

const DB_NAME = 'hotel_yonanda_db';
const DB_VERSION = 2;

// Object Store Names
const STORES = {
  GUESTS: 'guests',
  ROOMS: 'rooms',
  MENUS: 'menus',
  ORDERS_TEMP: 'orders_temp',
} as const;

// ============================================
// Types
// ============================================

export interface GuestRecord {
  id: string;
  name: string;
  address: string;
  ktp_number: string;
  phone: string | null;
  created_at: number;
  active_rooms: string[];  // Source of truth for guest's rooms
  is_active: boolean;      // Computed: active_rooms.length > 0
}

export interface RoomRecord {
  room_number: string;
  room_type: string;
  rate_per_night: number;
  status: 'available' | 'occupied';
  guest_id: string | null;
  checkin_time: number | null;
  checkout_deadline: number | null;
}

export interface MenuRecord {
  id: string;
  category: string;
  name: string;
  price: number;
  is_active: boolean;
}

export interface OrderTempRecord {
  id: string;
  room_number: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  payment_method: 'CASH' | 'QRIS';
  total: number;
  created_at: number;
}

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
 */
async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

// ============================================
// Generic CRUD Helpers
// ============================================

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`));
  });
}

async function getById<T>(storeName: string, id: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Failed to get from ${storeName}`));
  });
}

async function put<T>(storeName: string, data: T): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(data);
    request.onerror = () => reject(new Error(`Failed to put to ${storeName}`));
  });
}

async function deleteById(storeName: string, id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
  });
}

// ============================================
// Guest Operations
// ============================================

export interface CreateGuestInput {
  name: string;
  address: string;
  ktp_number: string;
  phone?: string | null;
}

/**
 * Create a new guest record
 * @throws Error if validation fails
 */
export async function createGuest(input: CreateGuestInput): Promise<GuestRecord> {
  // Validation
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Nama tamu wajib diisi');
  }
  if (!input.address || input.address.trim().length === 0) {
    throw new Error('Alamat wajib diisi');
  }
  if (!input.ktp_number || input.ktp_number.trim().length === 0) {
    throw new Error('Nomor KTP wajib diisi');
  }

  // KTP validation: numeric only, min 16 digits
  const ktpClean = input.ktp_number.replace(/\D/g, '');
  if (ktpClean.length < 16) {
    throw new Error('Nomor KTP harus minimal 16 digit');
  }

  const guest: GuestRecord = {
    id: generateId(),
    name: input.name.trim(),
    address: input.address.trim(),
    ktp_number: ktpClean,
    phone: input.phone?.trim() || null,
    created_at: Date.now(),
    active_rooms: [],
    is_active: true,
  };

  return put(STORES.GUESTS, guest);
}

/**
 * Get guest by ID
 */
export async function getGuest(id: string): Promise<GuestRecord | null> {
  return getById<GuestRecord>(STORES.GUESTS, id);
}

/**
 * Get all active guests
 */
export async function getActiveGuests(): Promise<GuestRecord[]> {
  const all = await getAll<GuestRecord>(STORES.GUESTS);
  return all.filter((g) => g.is_active);
}

/**
 * Update guest
 */
export async function updateGuest(id: string, updates: Partial<GuestRecord>): Promise<GuestRecord | null> {
  const existing = await getGuest(id);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  return put(STORES.GUESTS, updated);
}

/**
 * Deactivate guest (set is_active = false)
 */
export async function deactivateGuest(id: string): Promise<void> {
  await updateGuest(id, { is_active: false });
}

/**
 * Delete guest permanently
 */
export async function deleteGuest(id: string): Promise<void> {
  return deleteById(STORES.GUESTS, id);
}

// ============================================
// Room Operations
// ============================================

/**
 * Get all rooms
 */
export async function getAllRooms(): Promise<RoomRecord[]> {
  return getAll<RoomRecord>(STORES.ROOMS);
}

/**
 * Get room by number
 */
export async function getRoom(roomNumber: string): Promise<RoomRecord | null> {
  return getById<RoomRecord>(STORES.ROOMS, roomNumber);
}

/**
 * Get available rooms
 */
export async function getAvailableRooms(): Promise<RoomRecord[]> {
  const all = await getAllRooms();
  return all.filter((r) => r.status === 'available');
}

/**
 * Get occupied rooms
 */
export async function getOccupiedRooms(): Promise<RoomRecord[]> {
  const all = await getAllRooms();
  return all.filter((r) => r.status === 'occupied');
}

/**
 * Get rooms by guest ID
 */
export async function getRoomsByGuestId(guestId: string): Promise<RoomRecord[]> {
  const all = await getAllRooms();
  return all.filter((r) => r.guest_id === guestId);
}

/**
 * Initialize rooms from static data (first run only)
 */
export async function initializeRooms(rooms: Omit<RoomRecord, 'guest_id' | 'checkin_time' | 'checkout_deadline' | 'status'>[]): Promise<void> {
  const existing = await getAllRooms();
  if (existing.length > 0) return; // Already initialized

  for (const room of rooms) {
    const record: RoomRecord = {
      ...room,
      status: 'available',
      guest_id: null,
      checkin_time: null,
      checkout_deadline: null,
    };
    await put(STORES.ROOMS, record);
  }
}

/**
 * Assign multiple rooms to a guest (multi-room check-in)
 * Also updates guest's active_rooms array
 */
export async function assignRooms(guestId: string, roomNumbers: string[]): Promise<RoomRecord[]> {
  const results: RoomRecord[] = [];

  // Get guest and update active_rooms
  const guest = await getGuest(guestId);
  if (!guest) {
    throw new Error('Tamu tidak ditemukan');
  }

  for (const roomNumber of roomNumbers) {
    const room = await getRoom(roomNumber);
    if (!room) {
      throw new Error(`Kamar ${roomNumber} tidak ditemukan`);
    }
    if (room.status === 'occupied') {
      throw new Error(`Kamar ${roomNumber} sudah terisi`);
    }

    const now = Date.now();
    // Default checkout deadline: next day at 12:00
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);

    const updated: RoomRecord = {
      ...room,
      status: 'occupied',
      guest_id: guestId,
      checkin_time: now,
      checkout_deadline: tomorrow.getTime(),
    };

    await put(STORES.ROOMS, updated);
    results.push(updated);

    // Add room to guest's active_rooms if not already there
    if (!guest.active_rooms.includes(roomNumber)) {
      guest.active_rooms.push(roomNumber);
    }
  }

  // Update guest with new active_rooms and ensure is_active = true
  await updateGuest(guestId, {
    active_rooms: guest.active_rooms,
    is_active: true,
  });

  return results;
}

/**
 * Checkout a single room
 * Also removes room from guest's active_rooms array
 */
export async function checkoutRoom(roomNumber: string): Promise<{ room: RoomRecord; guestId: string | null }> {
  const room = await getRoom(roomNumber);
  if (!room) {
    throw new Error(`Kamar ${roomNumber} tidak ditemukan`);
  }
  if (room.status !== 'occupied') {
    throw new Error(`Kamar ${roomNumber} tidak sedang terisi`);
  }

  const guestId = room.guest_id;

  // Remove room from guest's active_rooms
  if (guestId) {
    const guest = await getGuest(guestId);
    if (guest) {
      const updatedRooms = guest.active_rooms.filter((r) => r !== roomNumber);
      await updateGuest(guestId, {
        active_rooms: updatedRooms,
        is_active: updatedRooms.length > 0,
      });
    }
  }

  const updated: RoomRecord = {
    ...room,
    status: 'available',
    guest_id: null,
    checkin_time: null,
    checkout_deadline: null,
  };

  await put(STORES.ROOMS, updated);

  return { room: updated, guestId };
}

/**
 * Cleanup after checkout - deactivate guest if no more rooms
 * NOTE: Guest is NOT deleted, only deactivated for audit purposes
 */
export async function cleanupAfterCheckout(guestId: string): Promise<void> {
  if (!guestId) return;

  const guest = await getGuest(guestId);
  if (!guest) return;

  // Check if guest still has active rooms
  if (guest.active_rooms.length === 0) {
    // No more rooms for this guest - deactivate but DO NOT DELETE
    await updateGuest(guestId, { is_active: false });
  }
}

/**
 * Update room data
 */
export async function updateRoom(roomNumber: string, updates: Partial<RoomRecord>): Promise<RoomRecord | null> {
  const existing = await getRoom(roomNumber);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  return put(STORES.ROOMS, updated);
}

// ============================================
// Menu Operations
// ============================================

/**
 * Get all menus
 */
export async function getAllMenus(): Promise<MenuRecord[]> {
  return getAll<MenuRecord>(STORES.MENUS);
}

/**
 * Get active menus only
 */
export async function getActiveMenus(): Promise<MenuRecord[]> {
  const all = await getAllMenus();
  return all.filter((m) => m.is_active);
}

/**
 * Get menu by ID
 */
export async function getMenu(id: string): Promise<MenuRecord | null> {
  return getById<MenuRecord>(STORES.MENUS, id);
}

/**
 * Initialize menus from static data
 */
export async function initializeMenus(menus: Omit<MenuRecord, 'is_active'>[]): Promise<void> {
  const existing = await getAllMenus();
  if (existing.length > 0) return; // Already initialized

  for (const menu of menus) {
    const record: MenuRecord = {
      ...menu,
      is_active: true,
    };
    await put(STORES.MENUS, record);
  }
}

/**
 * Add a new menu item
 */
export async function addMenu(menu: Omit<MenuRecord, 'id' | 'is_active'>): Promise<MenuRecord> {
  const record: MenuRecord = {
    ...menu,
    id: generateId(),
    is_active: true,
  };
  return put(STORES.MENUS, record);
}

/**
 * Update menu item
 */
export async function updateMenu(id: string, updates: Partial<MenuRecord>): Promise<MenuRecord | null> {
  const existing = await getMenu(id);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  return put(STORES.MENUS, updated);
}

/**
 * Delete menu item (soft delete by setting is_active = false)
 */
export async function deleteMenu(id: string): Promise<void> {
  await updateMenu(id, { is_active: false });
}

// ============================================
// Temp Order Operations
// ============================================

/**
 * Get all temp orders
 */
export async function getAllTempOrders(): Promise<OrderTempRecord[]> {
  return getAll<OrderTempRecord>(STORES.ORDERS_TEMP);
}

/**
 * Get temp order by ID
 */
export async function getTempOrder(id: string): Promise<OrderTempRecord | null> {
  return getById<OrderTempRecord>(STORES.ORDERS_TEMP, id);
}

export interface CreateOrderInput {
  room_number: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  payment_method: 'CASH' | 'QRIS';
  total: number;
}

/**
 * Create a temporary order (deleted after receipt printed)
 */
export async function createTempOrder(input: CreateOrderInput): Promise<OrderTempRecord> {
  const order: OrderTempRecord = {
    id: generateId(),
    room_number: input.room_number,
    items: input.items,
    payment_method: input.payment_method,
    total: input.total,
    created_at: Date.now(),
  };

  return put(STORES.ORDERS_TEMP, order);
}

/**
 * Delete temp order (after receipt printed)
 */
export async function deleteTempOrder(id: string): Promise<void> {
  return deleteById(STORES.ORDERS_TEMP, id);
}

/**
 * Clear all temp orders
 */
export async function clearAllTempOrders(): Promise<void> {
  const orders = await getAllTempOrders();
  for (const order of orders) {
    await deleteTempOrder(order.id);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Mask KTP number for display (show first 4 + last 4 only)
 */
export function maskKtp(ktp: string): string {
  if (!ktp || ktp.length <= 8) return ktp;
  const first = ktp.slice(0, 4);
  const last = ktp.slice(-4);
  const middle = '*'.repeat(ktp.length - 8);
  return `${first}${middle}${last}`;
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

// Export store names for external use
export { STORES };
