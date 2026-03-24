import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Currency & Formatting Utilities
// ============================================

/**
 * Format currency to Indonesian Rupiah
 * Single source of truth — replaces duplicates in roomData.ts, validation.ts
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale (full)
 */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

/**
 * Format short date (DD/MM/YYYY HH:mm)
 */
export function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// ============================================
// Masking Utilities
// ============================================

/**
 * Mask KTP number for public display
 * Example: "2434123456785647" → "2434********5647"
 * Single source of truth — replaces duplicates in db.ts, validation.ts
 */
export function maskKtp(ktp: string): string {
  if (!ktp || ktp.length <= 8) return ktp;
  const first = ktp.slice(0, 4);
  const last = ktp.slice(-4);
  const middle = '*'.repeat(ktp.length - 8);
  return `${first}${middle}${last}`;
}

/**
 * Mask phone number for public display
 * Example: "081234567890" → "0812****7890"
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length <= 8) return phone;
  const first = phone.slice(0, 4);
  const last = phone.slice(-4);
  const middle = '*'.repeat(phone.length - 8);
  return `${first}${middle}${last}`;
}

/**
 * Mask address for public display (partial)
 * Shows first 10 chars + "..."
 */
export function maskAddress(address: string): string {
  if (!address || address.length <= 15) return address;
  return address.slice(0, 10) + '...';
}

// ============================================
// Input Cleaning Utilities
// ============================================

/**
 * Clean KTP input (remove non-numeric characters, max 16 digits)
 */
export function cleanKtpInput(input: string): string {
  return input.replace(/\D/g, '').slice(0, 16);
}

/**
 * Clean phone input (remove non-numeric characters, max 15 digits)
 */
export function cleanPhoneInput(input: string): string {
  return input.replace(/\D/g, '').slice(0, 15);
}
