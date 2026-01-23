/**
 * Single Source of Truth - Receipt Template
 * Hotel Yonanda POS System
 * 
 * This module defines the STRUCTURE of receipts as abstract blocks.
 * NO RENDERING LOGIC HERE - only structure definition!
 * 
 * All renderers (ESC/POS, HTML, PDF, Email) consume the output of this module.
 */

import {
  ReceiptData,
  ReceiptBlock,
  HeaderBlockData,
  TransactionInfoBlockData,
  ReceiptNumberBlockData,
  RoomInfoBlockData,
  GuestInfoBlockData,
  ItemsBlockData,
  TotalBlockData,
  PaymentBlockData,
  NotesBlockData,
  FooterBlockData,
} from './receipt-types';

/**
 * Build receipt template from data
 * 
 * This is the SINGLE SOURCE OF TRUTH for receipt structure.
 * Returns an array of abstract blocks that will be rendered differently
 * by each renderer.
 * 
 * @param data - Transaction data
 * @returns Array of receipt blocks
 */
export function buildReceiptTemplate(data: ReceiptData): ReceiptBlock[] {
  const blocks: ReceiptBlock[] = [];

  // 1. Header Block - SELALU TAMPIL
  blocks.push({
    type: 'header',
    visible: true,
    data: {
      hotelName: 'HOTEL YONANDA',
      address: 'Jl. Mayor Soeyoto Km 6',
      city: 'Jimbaran-Bandungan',
      phone: '081392506299',
    } as HeaderBlockData,
  });

  // 2. Transaction Info Block - SELALU TAMPIL
  blocks.push({
    type: 'transaction-info',
    visible: true,
    data: {
      date: formatDate(data.timestamp),
      time: formatTime(data.timestamp),
      type: getTransactionLabel(data.type),
    } as TransactionInfoBlockData,
  });

  // 3. Receipt Number Block - SELALU TAMPIL
  blocks.push({
    type: 'receipt-number',
    visible: true,
    data: {
      number: data.receiptNumber,
    } as ReceiptNumberBlockData,
  });

  // 4. Room Info Block - OPSIONAL
  blocks.push({
    type: 'room-info',
    visible: !!data.room,
    data: data.room ? {
      number: data.room.number,
      type: data.room.type,
      rate: data.room.rate,
      nights: data.room.nights,
    } as RoomInfoBlockData : null,
  });

  // 5. Guest Info Block - OPSIONAL
  blocks.push({
    type: 'guest-info',
    visible: !!data.guest,
    data: data.guest ? {
      name: data.guest.name,
      maskedKtp: data.guest.maskedKtp,
    } as GuestInfoBlockData : null,
  });

  // 6. Items Block - OPSIONAL
  blocks.push({
    type: 'items',
    visible: !!data.items && data.items.length > 0,
    data: {
      items: data.items || [],
    } as ItemsBlockData,
  });

  // 7. Total Block - SELALU TAMPIL
  blocks.push({
    type: 'total',
    visible: true,
    data: {
      amount: data.total,
    } as TotalBlockData,
  });

  // 8. Payment Block - OPSIONAL
  blocks.push({
    type: 'payment',
    visible: !!data.paymentMethod,
    data: data.paymentMethod ? {
      method: data.paymentMethod,
    } as PaymentBlockData : null,
  });

  // 9. Notes Block - SELALU TAMPIL
  blocks.push({
    type: 'notes',
    visible: true,
    data: {
      text: '** Max Check-out 12.00 WIB **',
    } as NotesBlockData,
  });

  // 10. Footer Block - SELALU TAMPIL
  blocks.push({
    type: 'footer',
    visible: true,
    data: {
      text: 'Developed System by Nekat Digital',
    } as FooterBlockData,
  });

  return blocks;
}

// ============================================
// Helper Functions (Pure, No Side Effects)
// ============================================

/**
 * Format timestamp to date string
 */
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format timestamp to time string
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get transaction type label
 */
function getTransactionLabel(type: ReceiptData['type']): string {
  switch (type) {
    case 'checkin':
      return 'CHECK-IN';
    case 'checkout':
      return 'CHECK-OUT';
    case 'canteen-guest':
      return 'KANTIN TAMU';
    case 'canteen-direct':
      return 'KANTIN NON-TAMU';
    default:
      return 'NOTA';
  }
}
