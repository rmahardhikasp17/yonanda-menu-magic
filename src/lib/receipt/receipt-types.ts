/**
 * Type Definitions for Single Source of Truth Receipt System
 * Hotel Yonanda POS
 */

// ============================================
// Input Data Types
// ============================================

export interface ReceiptData {
  type: 'checkin' | 'checkout' | 'canteen-guest' | 'canteen-direct';
  receiptNumber: string;
  timestamp: string;
  
  // Optional sections
  room?: {
    number: string;
    type: string;
    rate: number;
    nights?: number;
  };
  
  guest?: {
    name: string;
    maskedKtp?: string;
  };
  
  items?: Array<{
    name: string;
    quantity: number;
    subtotal: number;
  }>;
  
  total: number;
  paymentMethod?: 'cash' | 'qris';
}

// ============================================
// Template Block Types
// ============================================

export type ReceiptBlockType = 
  | 'header'
  | 'transaction-info'
  | 'receipt-number'
  | 'room-info'
  | 'guest-info'
  | 'items'
  | 'total'
  | 'payment'
  | 'notes'
  | 'footer';

export interface ReceiptBlock {
  type: ReceiptBlockType;
  visible: boolean;  // Conditional rendering
  data: unknown;     // Block-specific data
}

// Block-specific data types
export interface HeaderBlockData {
  hotelName: string;
  address: string;
  city: string;
  phone: string;
}

export interface TransactionInfoBlockData {
  date: string;
  time: string;
  type: string;
}

export interface ReceiptNumberBlockData {
  number: string;
}

export interface RoomInfoBlockData {
  number: string;
  type: string;
  rate: number;
  nights?: number;
}

export interface GuestInfoBlockData {
  name: string;
  maskedKtp?: string;
}

export interface ItemsBlockData {
  items: Array<{
    name: string;
    quantity: number;
    subtotal: number;
  }>;
}

export interface TotalBlockData {
  amount: number;
}

export interface PaymentBlockData {
  method: 'cash' | 'qris';
}

export interface NotesBlockData {
  text: string;
}

export interface FooterBlockData {
  text: string;
}

// ============================================
// Renderer Interface
// ============================================

export interface ReceiptRenderer {
  render(blocks: ReceiptBlock[]): Promise<void> | void;
  renderBlock(block: ReceiptBlock): Promise<void> | void;
}
