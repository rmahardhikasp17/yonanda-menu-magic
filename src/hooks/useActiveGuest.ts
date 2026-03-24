import { useState, useEffect, useCallback } from 'react';
import {
  GuestRecord,
  getGuest,
  createGuest as dbCreateGuest,
  CreateGuestInput,
} from '@/lib/db';
import {
  getActiveGuestId,
  setActiveGuestId,
  clearCheckoutState,
} from '@/lib/storage';
import { maskKtp } from '@/lib/utils';

export interface UseActiveGuestReturn {
  activeGuest: GuestRecord | null;
  isLoading: boolean;
  error: string | null;
  setGuest: (input: CreateGuestInput) => Promise<GuestRecord>;
  selectExistingGuest: (guest: GuestRecord) => void;
  loadGuest: (id: string) => Promise<void>;
  clearGuest: () => void;
  hasActiveGuest: boolean;
  getMaskedKtp: (ktp: string) => string;
}

/**
 * Hook for managing active guest
 * Uses IndexedDB for guest data, LocalStorage only for guest ID reference
 */
export function useActiveGuest(): UseActiveGuestReturn {
  const [activeGuest, setActiveGuest] = useState<GuestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load guest on mount if ID exists in localStorage
  useEffect(() => {
    const loadInitialGuest = async () => {
      setIsLoading(true);
      try {
        const guestId = getActiveGuestId();
        if (guestId) {
          const guest = await getGuest(guestId);
          if (guest && guest.is_active) {
            setActiveGuest(guest);
          } else {
            // Guest not found or inactive, clear localStorage
            setActiveGuestId(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guest');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialGuest();
  }, []);

  /**
   * Create new guest and set as active
   */
  const setGuest = useCallback(async (input: CreateGuestInput): Promise<GuestRecord> => {
    setIsLoading(true);
    setError(null);
    try {
      const guest = await dbCreateGuest(input);
      setActiveGuest(guest);
      setActiveGuestId(guest.id);
      return guest;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create guest';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load existing guest by ID
   */
  const loadGuest = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const guest = await getGuest(id);
      if (guest && guest.is_active) {
        setActiveGuest(guest);
        setActiveGuestId(guest.id);
      } else {
        throw new Error('Guest not found or inactive');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load guest';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Select an existing guest (from GuestSelector) without creating new
   */
  const selectExistingGuest = useCallback((guest: GuestRecord) => {
    setActiveGuest(guest);
    setActiveGuestId(guest.id);
  }, []);

  /**
   * Clear active guest (e.g., after checkout)
   */
  const clearGuest = useCallback(() => {
    setActiveGuest(null);
    clearCheckoutState();
  }, []);

  /**
   * Mask KTP for display on receipts/UI
   */
  const getMaskedKtp = useCallback((ktp: string): string => {
    return maskKtp(ktp);
  }, []);

  return {
    activeGuest,
    isLoading,
    error,
    setGuest,
    selectExistingGuest,
    loadGuest,
    clearGuest,
    hasActiveGuest: activeGuest !== null,
    getMaskedKtp,
  };
}
