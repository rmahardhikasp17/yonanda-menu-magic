/**
 * Barrel re-export for @/lib/db
 *
 * This file ensures all existing imports from '@/lib/db' continue to work
 * without any changes. Vite resolves @/lib/db to this index.ts automatically.
 */

// Core: DB init, connection, helpers, and constants
export { STORES, generateId, initDB, getDB, resetDatabase, getAll, getById, put, deleteById } from './core';

// Guests
export type { GuestRecord, CreateGuestInput } from './guests';
export { createGuest, getGuest, getActiveGuests, updateGuest, deactivateGuest, deleteGuest } from './guests';

// Rooms
export type { RoomRecord } from './rooms';
export { getAllRooms, getRoom, getAvailableRooms, getOccupiedRooms, getRoomsByGuestId, initializeRooms, assignRooms, checkoutRoom, cleanupAfterCheckout, updateRoom } from './rooms';

// Menus
export type { MenuRecord } from './menus';
export { getAllMenus, getActiveMenus, getMenu, initializeMenus, addMenu, updateMenu, deleteMenu, clearAllMenus } from './menus';

// Orders
export type { OrderTempRecord, CreateOrderInput } from './orders';
export { getAllTempOrders, getTempOrder, createTempOrder, deleteTempOrder, clearAllTempOrders } from './orders';
