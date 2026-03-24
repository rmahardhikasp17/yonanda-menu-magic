import { RoomTypeInfo, Room } from '@/types/hotel';

export const roomTypesData: RoomTypeInfo[] = [
  {
    type: 'standar',
    label: 'Standar',
    rate: 60000,
    facilities: ['AC (dingin)', 'TV 21"', 'Kipas angin', 'Closet jongkok', 'WiFi'],
    rooms: ['116', '117', '118', '119', '120'],
  },
  {
    type: 'superior',
    label: 'Superior',
    rate: 90000,
    facilities: ['AC (panas & dingin)', 'Kipas', 'TV 21"', 'Sofa', 'Closet jongkok', 'WiFi'],
    rooms: ['101', '102', '105', '106', '109', '110', '111', '112', '113', '114', '115'],
  },
  {
    type: 'suite',
    label: 'Suite',
    rate: 120000,
    facilities: ['AC (panas & dingin)', 'Kipas', 'TV 21"', 'Sofa', 'Meja', 'Balkon/Teras', 'Shower', 'Closet duduk', 'WiFi'],
    rooms: ['107', '108', '121', '122', '123', '124', '125', '127', '128', '129', '130', '201', '202', '203', '204', '205', '210', '211'],
  },
  {
    type: 'family',
    label: 'Family',
    rate: 140000,
    facilities: ['AC (panas & dingin)', 'Kipas', 'TV 21"', 'Sofa', 'Shower', 'Closet duduk', 'Double bed', 'Single bed', 'WiFi'],
    rooms: ['126', '206', '207', '208', '209', '301', '302'],
  },
  {
    type: 'deluxe',
    label: 'Deluxe Bathtub',
    rate: 150000,
    facilities: ['AC (panas & dingin)', 'Kipas', 'TV 21"', 'Sofa', 'Shower', 'Bathtub', 'WiFi'],
    rooms: ['103', '104'],
  },
];

export function generateInitialRooms(): Room[] {
  const rooms: Room[] = [];
  
  roomTypesData.forEach((typeInfo) => {
    typeInfo.rooms.forEach((roomNumber) => {
      rooms.push({
        number: roomNumber,
        type: typeInfo.type,
        rate: typeInfo.rate,
        facilities: typeInfo.facilities,
        isOccupied: false,
      });
    });
  });
  
  // Sort by room number
  return rooms.sort((a, b) => parseInt(a.number) - parseInt(b.number));
}

export function getRoomTypeInfo(type: string): RoomTypeInfo | undefined {
  return roomTypesData.find((t) => t.type === type);
}

// formatCurrency has been moved to @/lib/utils.ts
