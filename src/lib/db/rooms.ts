/**
 * Room Operations Module
 */

import { STORES, getAll, getById, put, getDB } from './core';
import { GuestRecord, getGuest, updateGuest } from './guests';

// ============================================
// Types
// ============================================

export interface RoomRecord {
  room_number: string;
  room_type: string;
  rate_per_night: number;
  status: 'available' | 'occupied';
  guest_id: string | null;
  checkin_time: number | null;
  checkout_deadline: number | null;
}

// ============================================
// Operations
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
