/**
 * Guest Operations Module
 */

import { STORES, generateId, getAll, getById, put, deleteById } from './core';

// ============================================
// Types
// ============================================

export interface GuestRecord {
  id: string;
  name: string;
  address: string;
  ktp_number: string;
  phone: string | null;
  created_at: number;
  active_rooms: string[];  // Source of truth for guest's rooms
  is_active: boolean;      // Computed: active_rooms.length > 0
}

export interface CreateGuestInput {
  name: string;
  address: string;
  ktp_number: string;
  phone?: string | null;
}

// ============================================
// Operations
// ============================================

/**
 * Create a new guest record
 * @throws Error if validation fails
 */
export async function createGuest(input: CreateGuestInput): Promise<GuestRecord> {
  // Validation
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Nama tamu wajib diisi');
  }
  if (!input.address || input.address.trim().length === 0) {
    throw new Error('Alamat wajib diisi');
  }
  if (!input.ktp_number || input.ktp_number.trim().length === 0) {
    throw new Error('Nomor KTP wajib diisi');
  }

  // KTP validation: numeric only, min 16 digits
  const ktpClean = input.ktp_number.replace(/\D/g, '');
  if (ktpClean.length < 16) {
    throw new Error('Nomor KTP harus minimal 16 digit');
  }

  const guest: GuestRecord = {
    id: generateId(),
    name: input.name.trim(),
    address: input.address.trim(),
    ktp_number: ktpClean,
    phone: input.phone?.trim() || null,
    created_at: Date.now(),
    active_rooms: [],
    is_active: false,
  };

  return put(STORES.GUESTS, guest);
}

/**
 * Get guest by ID
 */
export async function getGuest(id: string): Promise<GuestRecord | null> {
  return getById<GuestRecord>(STORES.GUESTS, id);
}

/**
 * Get all active guests
 */
export async function getActiveGuests(): Promise<GuestRecord[]> {
  const all = await getAll<GuestRecord>(STORES.GUESTS);
  return all.filter((g) => g.is_active);
}

/**
 * Update guest
 */
export async function updateGuest(id: string, updates: Partial<GuestRecord>): Promise<GuestRecord | null> {
  const existing = await getGuest(id);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  return put(STORES.GUESTS, updated);
}

/**
 * Deactivate guest (set is_active = false)
 */
export async function deactivateGuest(id: string): Promise<void> {
  await updateGuest(id, { is_active: false });
}

/**
 * Delete guest permanently
 */
export async function deleteGuest(id: string): Promise<void> {
  return deleteById(STORES.GUESTS, id);
}
