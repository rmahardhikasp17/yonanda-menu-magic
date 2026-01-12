import { useState, useCallback } from 'react';
import { OrderItem, MenuItem } from '@/types/hotel';

export function useOrder() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const addItem = useCallback((menuItem: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.menuItem.id !== menuItemId);
    });
  }, []);

  const clearOrder = useCallback(() => {
    setOrderItems([]);
  }, []);

  const getTotal = useCallback((): number => {
    return orderItems.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  }, [orderItems]);

  const getItemCount = useCallback((): number => {
    return orderItems.reduce((count, item) => count + item.quantity, 0);
  }, [orderItems]);

  const getItemQuantity = useCallback(
    (menuItemId: string): number => {
      const item = orderItems.find((item) => item.menuItem.id === menuItemId);
      return item?.quantity || 0;
    },
    [orderItems]
  );

  return {
    orderItems,
    addItem,
    removeItem,
    clearOrder,
    getTotal,
    getItemCount,
    getItemQuantity,
  };
}
