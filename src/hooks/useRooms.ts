import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RoomRecord,
  getAllRooms,
  getRoom as dbGetRoom,
  initializeRooms,
  assignRooms as dbAssignRooms,
  checkoutRoom as dbCheckoutRoom,
  cleanupAfterCheckout,
  getAvailableRooms as dbGetAvailableRooms,
  getOccupiedRooms as dbGetOccupiedRooms,
  getRoomsByGuestId,
} from '@/lib/db';
import { roomTypesData } from '@/data/roomData';
import { RoomType } from '@/types/hotel';

export interface UseRoomsReturn {
  rooms: RoomRecord[];
  isLoading: boolean;
  error: string | null;
  checkIn: (guestId: string, roomNumbers: string[]) => Promise<RoomRecord[]>;
  checkOut: (roomNumber: string) => Promise<{ room: RoomRecord; guestId: string | null }>;
  getRoom: (roomNumber: string) => Promise<RoomRecord | null>;
  occupiedRooms: RoomRecord[];
  availableRooms: RoomRecord[];
  getRoomsByGuest: (guestId: string) => Promise<RoomRecord[]>;
  refreshRooms: () => Promise<void>;
}

/**
 * Convert room type static data to RoomRecord format for initialization
 */
function generateInitialRoomRecords(): Omit<RoomRecord, 'guest_id' | 'checkin_time' | 'checkout_deadline' | 'status'>[] {
  const records: Omit<RoomRecord, 'guest_id' | 'checkin_time' | 'checkout_deadline' | 'status'>[] = [];

  roomTypesData.forEach((typeInfo) => {
    typeInfo.rooms.forEach((roomNumber) => {
      records.push({
        room_number: roomNumber,
        room_type: typeInfo.type as RoomType,
        rate_per_night: typeInfo.rate,
      });
    });
  });

  // Sort by room number
  return records.sort((a, b) => parseInt(a.room_number) - parseInt(b.room_number));
}

/**
 * Hook for managing hotel rooms
 * Uses IndexedDB for persistent storage
 */
export function useRooms(): UseRoomsReturn {
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load rooms
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Initialize rooms if empty
        const initialRecords = generateInitialRoomRecords();
        await initializeRooms(initialRecords);

        // Load all rooms
        const allRooms = await getAllRooms();
        // Sort by room number
        allRooms.sort((a, b) => parseInt(a.room_number) - parseInt(b.room_number));
        setRooms(allRooms);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize rooms');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  /**
   * Refresh rooms from database
   */
  const refreshRooms = useCallback(async () => {
    try {
      const allRooms = await getAllRooms();
      allRooms.sort((a, b) => parseInt(a.room_number) - parseInt(b.room_number));
      setRooms(allRooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh rooms');
    }
  }, []);

  /**
   * Check in guest to multiple rooms
   */
  const checkIn = useCallback(async (guestId: string, roomNumbers: string[]): Promise<RoomRecord[]> => {
    try {
      const updatedRooms = await dbAssignRooms(guestId, roomNumbers);
      await refreshRooms();
      return updatedRooms;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-in failed';
      setError(message);
      throw err;
    }
  }, [refreshRooms]);

  /**
   * Check out from a room
   */
  const checkOut = useCallback(async (roomNumber: string): Promise<{ room: RoomRecord; guestId: string | null }> => {
    try {
      const result = await dbCheckoutRoom(roomNumber);

      // Cleanup if this was the guest's last room
      if (result.guestId) {
        await cleanupAfterCheckout(result.guestId);
      }

      await refreshRooms();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-out failed';
      setError(message);
      throw err;
    }
  }, [refreshRooms]);

  /**
   * Get room by number
   */
  const getRoom = useCallback(async (roomNumber: string): Promise<RoomRecord | null> => {
    return dbGetRoom(roomNumber);
  }, []);

  /**
   * Occupied rooms (memoized from local state)
   */
  const occupiedRooms = useMemo(() => {
    return rooms.filter((r) => r.status === 'occupied');
  }, [rooms]);

  /**
   * Available rooms (memoized from local state)
   */
  const availableRooms = useMemo(() => {
    return rooms.filter((r) => r.status === 'available');
  }, [rooms]);

  /**
   * Get rooms by guest ID
   */
  const getRoomsByGuest = useCallback(async (guestId: string): Promise<RoomRecord[]> => {
    return getRoomsByGuestId(guestId);
  }, []);

  return {
    rooms,
    isLoading,
    error,
    checkIn,
    checkOut,
    getRoom,
    occupiedRooms,
    availableRooms,
    getRoomsByGuest,
    refreshRooms,
  };
}
