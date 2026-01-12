import { useState, useEffect, useCallback } from 'react';
import { Room } from '@/types/hotel';
import { generateInitialRooms } from '@/data/roomData';

const STORAGE_KEY = 'hotel-yonanda-rooms';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return generateInitialRooms();
      }
    }
    return generateInitialRooms();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  }, [rooms]);

  const checkIn = useCallback((roomNumber: string, guestName?: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.number === roomNumber
          ? {
              ...room,
              isOccupied: true,
              guestName: guestName || undefined,
              checkInTime: new Date().toISOString(),
            }
          : room
      )
    );
  }, []);

  const checkOut = useCallback((roomNumber: string): Room | null => {
    let checkedOutRoom: Room | null = null;
    setRooms((prev) =>
      prev.map((room) => {
        if (room.number === roomNumber && room.isOccupied) {
          checkedOutRoom = { ...room };
          return {
            ...room,
            isOccupied: false,
            guestName: undefined,
            checkInTime: undefined,
          };
        }
        return room;
      })
    );
    return checkedOutRoom;
  }, []);

  const getRoom = useCallback(
    (roomNumber: string): Room | undefined => {
      return rooms.find((room) => room.number === roomNumber);
    },
    [rooms]
  );

  const getOccupiedRooms = useCallback((): Room[] => {
    return rooms.filter((room) => room.isOccupied);
  }, [rooms]);

  const getAvailableRooms = useCallback((): Room[] => {
    return rooms.filter((room) => !room.isOccupied);
  }, [rooms]);

  const resetRooms = useCallback(() => {
    const initial = generateInitialRooms();
    setRooms(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }, []);

  return {
    rooms,
    checkIn,
    checkOut,
    getRoom,
    getOccupiedRooms,
    getAvailableRooms,
    resetRooms,
  };
}
