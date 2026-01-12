import { useState, useEffect, useCallback } from 'react';
import { MenuItem, MenuCategory } from '@/types/hotel';
import { defaultMenuItems } from '@/data/menuData';

const STORAGE_KEY = 'hotel-yonanda-menu';

export function useMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultMenuItems;
      }
    }
    return defaultMenuItems;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(menuItems));
  }, [menuItems]);

  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `custom-${Date.now()}`,
    };
    setMenuItems((prev) => [...prev, newItem]);
  }, []);

  const updateMenuItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getMenuByCategory = useCallback(
    (category: MenuCategory): MenuItem[] => {
      return menuItems.filter((item) => item.category === category);
    },
    [menuItems]
  );

  const resetMenu = useCallback(() => {
    setMenuItems(defaultMenuItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMenuItems));
  }, []);

  return {
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuByCategory,
    resetMenu,
  };
}
