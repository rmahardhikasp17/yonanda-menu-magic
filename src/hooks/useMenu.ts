import { useState, useEffect, useCallback } from 'react';
import {
  MenuRecord,
  getAllMenus,
  initializeMenus,
  clearAllMenus,
  addMenu as dbAddMenu,
  updateMenu as dbUpdateMenu,
  deleteMenu as dbDeleteMenu,
} from '@/lib/db';
import { defaultMenuItems } from '@/data/menuData';
import { MenuCategory } from '@/types/hotel';

export interface UseMenuReturn {
  menuItems: MenuRecord[];
  isLoading: boolean;
  error: string | null;
  addMenuItem: (item: Omit<MenuRecord, 'id' | 'is_active'>) => Promise<MenuRecord>;
  updateMenuItem: (id: string, updates: Partial<MenuRecord>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  resetMenu: () => Promise<void>;
  getMenuByCategory: (category: MenuCategory) => MenuRecord[];
  refreshMenu: () => Promise<void>;
}

/**
 * Convert static menu data to MenuRecord format
 */
function convertMenuData(): Omit<MenuRecord, 'is_active'>[] {
  return defaultMenuItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
  }));
}

/**
 * Hook for managing menu items
 * Uses IndexedDB for persistent storage
 */
export function useMenu(): UseMenuReturn {
  const [menuItems, setMenuItems] = useState<MenuRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load menu
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Initialize menu if empty
        const initialMenus = convertMenuData();
        await initializeMenus(initialMenus);

        // Load all menus
        const allMenus = await getAllMenus();
        // Filter only active menus
        setMenuItems(allMenus.filter((m) => m.is_active));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize menu');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  /**
   * Refresh menu from database
   */
  const refreshMenu = useCallback(async () => {
    try {
      const allMenus = await getAllMenus();
      setMenuItems(allMenus.filter((m) => m.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh menu');
    }
  }, []);

  /**
   * Add new menu item
   */
  const addMenuItem = useCallback(async (item: Omit<MenuRecord, 'id' | 'is_active'>): Promise<MenuRecord> => {
    try {
      const newItem = await dbAddMenu(item);
      await refreshMenu();
      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add menu item';
      setError(message);
      throw err;
    }
  }, [refreshMenu]);

  /**
   * Update menu item
   */
  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuRecord>): Promise<void> => {
    try {
      await dbUpdateMenu(id, updates);
      await refreshMenu();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update menu item';
      setError(message);
      throw err;
    }
  }, [refreshMenu]);

  /**
   * Delete menu item (soft delete)
   */
  const deleteMenuItem = useCallback(async (id: string): Promise<void> => {
    try {
      await dbDeleteMenu(id);
      await refreshMenu();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete menu item';
      setError(message);
      throw err;
    }
  }, [refreshMenu]);

  /**
   * Get menu items by category
   */
  const getMenuByCategory = useCallback((category: MenuCategory): MenuRecord[] => {
    return menuItems.filter((item) => item.category === category);
  }, [menuItems]);

  /**
   * Reset menu to defaults (clear all + re-initialize from static data)
   */
  const resetMenu = useCallback(async (): Promise<void> => {
    try {
      // Clear all existing menus from IndexedDB
      await clearAllMenus();
      // Re-initialize with default menu data
      const initialMenus = convertMenuData();
      await initializeMenus(initialMenus);
      // Refresh the UI state
      await refreshMenu();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset menu';
      setError(message);
      throw err;
    }
  }, [refreshMenu]);

  return {
    menuItems,
    isLoading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetMenu,
    getMenuByCategory,
    refreshMenu,
  };
}
