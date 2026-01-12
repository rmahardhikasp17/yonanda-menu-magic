// Hotel Room Types
export type RoomType = 'standar' | 'superior' | 'suite' | 'family' | 'deluxe';

export interface Room {
  number: string;
  type: RoomType;
  rate: number;
  facilities: string[];
  isOccupied: boolean;
  guestName?: string;
  checkInTime?: string;
}

export interface RoomTypeInfo {
  type: RoomType;
  label: string;
  rate: number;
  facilities: string[];
  rooms: string[];
}

// Menu Types
export type MenuCategory = 
  | 'nasi-goreng'
  | 'gorengan'
  | 'penyetan'
  | 'sambal'
  | 'sayur'
  | 'mie'
  | 'minuman'
  | 'jus';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
}

export interface MenuCategoryInfo {
  id: MenuCategory;
  label: string;
  icon: string;
}

// Order Types
export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  roomNumber?: string;
  total: number;
  timestamp: string;
  type: 'guest' | 'direct';
}

// Receipt Types
export interface ReceiptData {
  hotelName: string;
  timestamp: string;
  roomNumber?: string;
  guestName?: string;
  items: { name: string; quantity: number; price: number; subtotal: number }[];
  total: number;
  type: 'room' | 'canteen-guest' | 'canteen-direct';
  checkInTime?: string;
  checkOutTime?: string;
  nights?: number;
  roomType?: string;
  roomRate?: number;
}
