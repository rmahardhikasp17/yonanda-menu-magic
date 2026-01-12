import { Room } from '@/types/hotel';
import { getRoomTypeInfo, formatCurrency } from '@/data/roomData';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  room: Room;
  onClick: (room: Room) => void;
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  const typeInfo = getRoomTypeInfo(room.type);

  return (
    <button
      onClick={() => onClick(room)}
      className={cn(
        'touch-card flex flex-col items-center justify-center rounded-xl p-3 text-white shadow-md',
        'min-h-[80px] w-full transition-all',
        room.isOccupied ? 'bg-hotel-occupied' : 'bg-hotel-available'
      )}
    >
      <span className="text-xl font-bold">{room.number}</span>
      <span className="text-xs opacity-90">{typeInfo?.label}</span>
      <span className="text-[10px] opacity-75">{formatCurrency(room.rate)}</span>
    </button>
  );
}
