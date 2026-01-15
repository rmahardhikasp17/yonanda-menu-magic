import { useState, useCallback } from 'react';
import { ActiveGuest } from '@/types/hotel';

const SESSION_KEY = 'hotel-yonanda-active-guest';

export function useActiveGuest() {
  const [activeGuest, setActiveGuest] = useState<ActiveGuest | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setGuest = useCallback((guest: ActiveGuest) => {
    setActiveGuest(guest);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(guest));
  }, []);

  const clearGuest = useCallback(() => {
    setActiveGuest(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const hasActiveGuest = activeGuest !== null;

  // Mask KTP for display on receipt (show first 4 + last 4)
  const getMaskedKtp = useCallback((ktp: string): string => {
    if (ktp.length <= 8) return ktp;
    const first = ktp.slice(0, 4);
    const last = ktp.slice(-4);
    const middle = '*'.repeat(ktp.length - 8);
    return `${first}${middle}${last}`;
  }, []);

  return {
    activeGuest,
    setGuest,
    clearGuest,
    hasActiveGuest,
    getMaskedKtp,
  };
}
