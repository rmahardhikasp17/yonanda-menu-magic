import { useState } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { Room, ReceiptData } from '@/types/hotel';
import { getRoomTypeInfo, formatCurrency } from '@/data/roomData';
import { PageHeader } from '@/components/PageHeader';
import { RoomCard } from '@/components/RoomCard';
import { Receipt } from '@/components/Receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { differenceInDays, differenceInHours } from 'date-fns';

const RoomsPage = () => {
  const { rooms, checkIn, checkOut, getOccupiedRooms, getAvailableRooms } = useRooms();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [guestName, setGuestName] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const occupiedCount = getOccupiedRooms().length;
  const availableCount = getAvailableRooms().length;

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setGuestName('');
  };

  const handleCheckIn = () => {
    if (selectedRoom) {
      checkIn(selectedRoom.number, guestName || undefined);
      setSelectedRoom(null);
      setGuestName('');
    }
  };

  const handleCheckOut = () => {
    if (selectedRoom && selectedRoom.isOccupied) {
      const checkedOutRoom = { ...selectedRoom };
      checkOut(selectedRoom.number);
      
      // Calculate duration and total
      const checkInDate = new Date(checkedOutRoom.checkInTime || new Date());
      const checkOutDate = new Date();
      let nights = differenceInDays(checkOutDate, checkInDate);
      
      // If less than a day but checked in, count as 1 night
      if (nights === 0 && differenceInHours(checkOutDate, checkInDate) > 0) {
        nights = 1;
      }
      // Minimum 1 night
      nights = Math.max(1, nights);
      
      const total = nights * checkedOutRoom.rate;
      const typeInfo = getRoomTypeInfo(checkedOutRoom.type);

      setReceipt({
        hotelName: 'Hotel Yonanda',
        timestamp: new Date().toISOString(),
        roomNumber: checkedOutRoom.number,
        guestName: checkedOutRoom.guestName,
        items: [],
        total,
        type: 'room',
        checkInTime: checkedOutRoom.checkInTime,
        checkOutTime: new Date().toISOString(),
        nights,
        roomType: typeInfo?.label,
        roomRate: checkedOutRoom.rate,
      });
      
      setSelectedRoom(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const closeReceipt = () => {
    setReceipt(null);
  };

  const typeInfo = selectedRoom ? getRoomTypeInfo(selectedRoom.type) : null;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Manajemen Kamar"
        subtitle={`${availableCount} tersedia · ${occupiedCount} terisi`}
      />

      {/* Legend */}
      <div className="container flex items-center gap-6 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-hotel-available" />
          <span className="text-sm text-muted-foreground">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-hotel-occupied" />
          <span className="text-sm text-muted-foreground">Terisi</span>
        </div>
      </div>

      {/* Room Grid */}
      <main className="container px-4 pb-8">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {rooms.map((room) => (
            <RoomCard key={room.number} room={room} onClick={handleRoomClick} />
          ))}
        </div>
      </main>

      {/* Room Detail Dialog */}
      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kamar {selectedRoom?.number}</DialogTitle>
            <DialogDescription>
              {typeInfo?.label} - {formatCurrency(selectedRoom?.rate || 0)}/malam
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Facilities */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Fasilitas:</h4>
              <div className="flex flex-wrap gap-2">
                {typeInfo?.facilities.map((facility, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>

            {/* Status */}
            <div
              className={`rounded-lg p-4 ${
                selectedRoom?.isOccupied ? 'bg-hotel-occupied/10' : 'bg-hotel-available/10'
              }`}
            >
              <p className="font-medium">
                Status: {selectedRoom?.isOccupied ? 'Terisi' : 'Tersedia'}
              </p>
              {selectedRoom?.isOccupied && selectedRoom.guestName && (
                <p className="text-sm text-muted-foreground">Tamu: {selectedRoom.guestName}</p>
              )}
              {selectedRoom?.isOccupied && selectedRoom.checkInTime && (
                <p className="text-sm text-muted-foreground">
                  Check-in: {new Date(selectedRoom.checkInTime).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            {/* Guest name input for check-in */}
            {!selectedRoom?.isOccupied && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nama Tamu (opsional)
                </label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Masukkan nama tamu"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            {selectedRoom?.isOccupied ? (
              <Button
                onClick={handleCheckOut}
                className="flex-1 touch-button bg-hotel-occupied hover:bg-hotel-occupied/90"
              >
                Check-Out & Cetak Nota
              </Button>
            ) : (
              <Button onClick={handleCheckIn} className="flex-1 touch-button">
                Check-In
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      {receipt && (
        <Receipt data={receipt} onClose={closeReceipt} onPrint={handlePrint} />
      )}
    </div>
  );
};

export default RoomsPage;
