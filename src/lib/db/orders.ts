/**
 * Temp Order Operations Module
 */

import { STORES, generateId, getAll, getById, put, deleteById, getDB } from './core';

// ============================================
// Types
// ============================================

export interface OrderTempRecord {
  id: string;
  room_number: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  payment_method: 'CASH' | 'QRIS';
  total: number;
  created_at: number;
}

export interface CreateOrderInput {
  room_number: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  payment_method: 'CASH' | 'QRIS';
  total: number;
}

// ============================================
// Operations
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
