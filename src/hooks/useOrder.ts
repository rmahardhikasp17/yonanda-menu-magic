import { useState, useCallback } from 'react';
import {
  createTempOrder,
  deleteTempOrder,
  OrderTempRecord,
  CreateOrderInput,
} from '@/lib/db';

// Simplified menu item interface to accept both MenuItem and MenuRecord
interface OrderMenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export interface OrderItem {
  menuItem: OrderMenuItem;
  quantity: number;
}

export interface UseOrderReturn {
  orderItems: OrderItem[];
  addItem: (menuItem: OrderMenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearOrder: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemQuantity: (menuItemId: string) => number;
  saveOrder: (roomNumber: string | null, paymentMethod: 'CASH' | 'QRIS') => Promise<OrderTempRecord>;
  deleteOrder: (orderId: string) => Promise<void>;
}

/**
 * Hook for managing current order/cart
 * Order items are in React state, saved to IndexedDB only when completed
 */
export function useOrder(): UseOrderReturn {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  /**
   * Add item to order
   */
  const addItem = useCallback((menuItem: OrderMenuItem) => {
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

  /**
   * Remove item from order (decrease quantity or remove entirely)
   */
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

  /**
   * Update quantity directly
   */
  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems((prev) => prev.filter((item) => item.menuItem.id !== menuItemId));
    } else {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.menuItem.id === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  /**
   * Clear all items from order
   */
  const clearOrder = useCallback(() => {
    setOrderItems([]);
  }, []);

  /**
   * Get total price
   */
  const getTotal = useCallback((): number => {
    return orderItems.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  }, [orderItems]);

  /**
   * Get total item count
   */
  const getItemCount = useCallback((): number => {
    return orderItems.reduce((count, item) => count + item.quantity, 0);
  }, [orderItems]);

  /**
   * Get quantity of specific item
   */
  const getItemQuantity = useCallback((menuItemId: string): number => {
    const item = orderItems.find((item) => item.menuItem.id === menuItemId);
    return item?.quantity || 0;
  }, [orderItems]);

  /**
   * Save order to IndexedDB (for receipt printing)
   * Order is deleted after receipt is printed
   */
  const saveOrder = useCallback(
    async (roomNumber: string | null, paymentMethod: 'CASH' | 'QRIS'): Promise<OrderTempRecord> => {
      const input: CreateOrderInput = {
        room_number: roomNumber,
        items: orderItems.map((item) => ({
          name: item.menuItem.name,
          qty: item.quantity,
          price: item.menuItem.price,
        })),
        payment_method: paymentMethod,
        total: getTotal(),
      };

      const order = await createTempOrder(input);
      clearOrder(); // Clear cart after saving
      return order;
    },
    [orderItems, getTotal, clearOrder]
  );

  /**
   * Delete temp order (after receipt printed)
   */
  const deleteOrder = useCallback(async (orderId: string): Promise<void> => {
    await deleteTempOrder(orderId);
  }, []);

  return {
    orderItems,
    addItem,
    removeItem,
    updateQuantity,
    clearOrder,
    getTotal,
    getItemCount,
    getItemQuantity,
    saveOrder,
    deleteOrder,
  };
}
