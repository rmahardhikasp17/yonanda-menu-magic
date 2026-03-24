/**
 * Menu Operations Module
 */

import { STORES, generateId, getAll, getById, put, getDB } from './core';

// ============================================
// Types
// ============================================

export interface MenuRecord {
  id: string;
  category: string;
  name: string;
  price: number;
  is_active: boolean;
}

// ============================================
// Operations
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

/**
 * Clear all menu items from the database
 * Used by resetMenu to force re-initialization with defaults
 */
export async function clearAllMenus(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MENUS, 'readwrite');
    const store = tx.objectStore(STORES.MENUS);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear menus'));
  });
}
